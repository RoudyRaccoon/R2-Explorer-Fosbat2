import { OpenAPIRoute } from "chanfana";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppContext } from "../../types";

export class GetObject extends OpenAPIRoute {
  schema = {
    operationId: "get-bucket-object",
    tags: ["Buckets"],
    summary: "Get Object",
    request: {
      params: z.object({
        bucket: z.string(),
        key: z.string().describe("base64 encoded file key"),
      }),
      query: z.object({
        public: z.string().optional(), // optional query param to request public link
      }),
    },
    responses: {
      "200": {
        description: "File binary or public URL",
        schema: z.union([
          z.string().openapi({ format: "binary" }),
          z.object({ url: z.string().url() }),
        ]),
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const bucketName = data.params.bucket;
    const bucket = c.env[bucketName] as R2Bucket | undefined;

    if (!bucket) {
      throw new HTTPException(500, {
        message: `Bucket binding not found: ${bucketName}`,
      });
    }

    let filePath: string;
    try {
      filePath = decodeURIComponent(escape(atob(data.params.key)));
    } catch (e) {
      filePath = decodeURIComponent(
        escape(atob(decodeURIComponent(data.params.key))),
      );
    }

    // --- Handle public URL request ---
    if (data.query.public === "true") {
      // Replace with your public domain for shared links
      const publicDomain = c.env.PUBLIC_DOMAIN || c.req.headers.get("host")!;
      const publicUrl = `https://${publicDomain}/files/${bucketName}/${encodeURIComponent(data.params.key)}`;
      return Response.json({ url: publicUrl });
    }

    // --- Regular file download ---
    const object = await bucket.get(filePath);

    if (object === null) {
      return Response.json({ msg: "Object Not Found" }, { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${filePath.split("/").pop()}"`
    );

    return new Response(object.body, { headers });
  }
}

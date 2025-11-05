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
        public: z.string().optional(), // new query param for sharable link
      }),
    },
    responses: {
      "200": {
        description: "File binary or JSON with sharable link",
        schema: z.union([
          z.string().openapi({ format: "binary" }),
          z.object({ url: z.string() }),
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

    let filePath;
    try {
      filePath = decodeURIComponent(escape(atob(data.params.key)));
    } catch (e) {
      filePath = decodeURIComponent(
        escape(atob(decodeURIComponent(data.params.key))),
      );
    }

    const object = await bucket.get(filePath);

    if (!object) {
      return Response.json({ msg: "Object Not Found" }, { status: 404 });
    }

    // Handle public sharable link
    if (data.query.public === "true") {
      // Construct the URL to this worker endpoint
      const url = `${c.env.PUBLIC_WORKER_URL}/files/${btoa(filePath)}`;
      return Response.json({ url }, { status: 200 });
    }

    // Normal download response
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${filePath.split("/").pop()}"`,
    );

    return new Response(object.body, {
      headers,
    });
  }
}

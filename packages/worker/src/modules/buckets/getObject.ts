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
				public: z.boolean().optional(), // optional query to return JSON with public URL
			}),
		},
		responses: {
			"200": {
				description: "File binary or JSON with public URL",
				schema: z.union([
					z.string().openapi({ format: "binary" }),
					z.object({
						bucket: z.string(),
						key: z.string(),
						name: z.string(),
						size: z.number(),
						lastModified: z.string().nullable(),
						url: z.string(),
					}),
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

		// Decode base64 key
		let filePath: string;
		try {
			filePath = decodeURIComponent(escape(atob(data.params.key)));
		} catch (e) {
			filePath = decodeURIComponent(
				escape(atob(decodeURIComponent(data.params.key))),
			);
		}

		// Fetch object
		const object = await bucket.get(filePath);

		if (!object) {
			return Response.json({ msg: "Object Not Found" }, { status: 404 });
		}

		// If frontend requested ?public=true, return JSON with URL
		if (data.query.public) {
			const publicUrl = `https://file.fosbat.art/${bucketName}/${filePath}`;
			return Response.json({
				bucket: bucketName,
				key: filePath,
				name: filePath.split("/").pop(),
				size: object.size,
				lastModified: object.httpMetadata?.lastModified?.toISOString() ?? null,
				url: publicUrl,
			});
		}

		// Default: return file for download
		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set("etag", object.httpEtag);
		headers.set(
			"Content-Disposition",
			`attachment; filename="${filePath.split("/").pop()}"`,
		);

		return new Response(object.body, { headers });
	}
}

// Vercel Serverless Function: 클라이언트 직접 업로드용 토큰 발급
// 브라우저 → Vercel Blob 직접 업로드 (서버 본문 4.5MB 제한 우회)
import { handleUpload } from "@vercel/blob/client";
import { randomBytes } from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const id = randomBytes(8).toString("hex");
        return {
          allowedContentTypes: ["model/gltf-binary", "application/octet-stream"],
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: false,
          cacheControlMaxAge: 60 * 60 * 24 * 7,
          tokenPayload: JSON.stringify({ id })
        };
      },
      onUploadCompleted: async () => {}
    });
    res.status(200).json(jsonResponse);
  } catch (e) {
    console.error("upload token error", e);
    res.status(400).json({ error: e.message || "upload failed" });
  }
}

// Vercel Serverless Function: GLB 업로드 → Blob 저장 → URL 반환
import { put } from "@vercel/blob";
import { randomBytes } from "crypto";

export const config = {
  api: { bodyParser: false }
};

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const buf = await readBody(req);
    if (!buf || !buf.length) {
      res.status(400).json({ error: "Empty body" });
      return;
    }
    if (buf.length > 50 * 1024 * 1024) {
      res.status(413).json({ error: "Too large (>50MB)" });
      return;
    }
    const id = randomBytes(8).toString("hex");
    const filename = `ar/${id}.glb`;
    const blob = await put(filename, buf, {
      access: "public",
      contentType: "model/gltf-binary",
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 7
    });
    res.status(200).json({ id, url: blob.url });
  } catch (e) {
    console.error("upload error", e);
    res.status(500).json({ error: e.message || "upload failed" });
  }
}

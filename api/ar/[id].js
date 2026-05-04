// GET /api/ar/{id} → blob URL로 redirect (302)
import { list } from "@vercel/blob";

export default async function handler(req, res) {
  const id = req.query.id;
  if (!id) {
    res.status(400).send("Missing id");
    return;
  }
  try {
    const { blobs } = await list({ prefix: `ar/${id}.glb`, limit: 1 });
    if (!blobs || blobs.length === 0) {
      res.status(404).send("Not found");
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.redirect(302, blobs[0].url);
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
}

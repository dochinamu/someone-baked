// The newest few cakes, without songs or names, for "Fresh out of the oven".
import { list } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    const { blobs } = await list({ prefix: "recent/", limit: 8 });
    const cakes = (await Promise.all(blobs.map((b) => fetch(b.url).then((r) => (r.ok ? r.json() : null)).catch(() => null)))).filter(Boolean);
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=300");
    return res.status(200).json({ cakes });
  } catch {
    return res.status(200).json({ cakes: [] });
  }
}

// The newest few cakes, without songs or names, for "Fresh out of the oven".
import { list, get } from "@vercel/blob";

const read = async (pathname) => {
  const r = await get(pathname, { access: "private" });
  return r && r.statusCode === 200 ? new Response(r.stream).json() : null;
};

export default async function handler(req, res) {
  try {
    const { blobs } = await list({ prefix: "recent/", limit: 8 });
    const cakes = (await Promise.all(blobs.map((b) => read(b.pathname).catch(() => null)))).filter(Boolean);
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=300");
    return res.status(200).json({ cakes });
  } catch {
    return res.status(200).json({ cakes: [] });
  }
}

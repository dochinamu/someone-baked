// Public running totals for the portfolio: visits, unique visitors, cakes baked and opened,
// and the songs sent most often (title and artist only).
import { redis, K } from "../lib/stats.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const r = await redis([["GET", K.visits], ["PFCOUNT", K.visitors], ["GET", K.baked], ["GET", K.opened], ["ZREVRANGE", K.songs, 0, 9, "WITHSCORES"]]);
  if (!r) return res.status(503).json({ error: "stats unavailable" });
  const top = [];
  for (let i = 0; i < (r[4] || []).length; i += 2) top.push({ song: r[4][i], count: +r[4][i + 1] });
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  return res.status(200).json({ visits: +r[0] || 0, visitors: +r[1] || 0, baked: +r[2] || 0, opened: +r[3] || 0, topSongs: top });
}

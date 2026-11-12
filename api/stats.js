// Running totals. Anyone gets the view count (the portfolio shows it);
// the rest (unique visitors, cakes baked and opened, top songs) only with ?key=<STATS_KEY>.
import { timingSafeEqual } from "node:crypto";
import { redis, K } from "../lib/stats.js";

const ok = (key) => {
  const want = process.env.STATS_KEY || "";
  if (!want || !key) return false;
  const a = Buffer.from(String(key)), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
};

export default async function handler(req, res) {
  const full = ok(req.query.key);
  if (!full) res.setHeader("Access-Control-Allow-Origin", "*");
  const r = await redis(full
    ? [["GET", K.visits], ["PFCOUNT", K.visitors], ["GET", K.baked], ["GET", K.opened], ["ZREVRANGE", K.songs, 0, 19, "WITHSCORES"]]
    : [["GET", K.visits]]);
  if (!r) return res.status(503).json({ error: "stats unavailable" });
  if (!full) {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return res.status(200).json({ views: +r[0] || 0 });
  }
  const top = [];
  for (let i = 0; i < (r[4] || []).length; i += 2) top.push({ song: r[4][i], count: +r[4][i + 1] });
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({ views: +r[0] || 0, visitors: +r[1] || 0, baked: +r[2] || 0, opened: +r[3] || 0, topSongs: top });
}

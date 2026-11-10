// A page was opened in a browser (crawlers that only read the preview don't run this).
import { redis, K, visitorId } from "../lib/stats.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); }
  await redis([["INCR", K.visits], ["PFADD", K.visitors, visitorId(req)]]);
  return res.status(204).end();
}

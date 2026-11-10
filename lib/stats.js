// Anonymous counters in Upstash Redis (REST, no client library).
// Nothing here ties a song to a cake, a name or a date: just running totals.
import { createHash } from "node:crypto";

const URL_ = process.env.KV_REST_API_URL, TOKEN = process.env.KV_REST_API_TOKEN;
export const K = { visits: "stats:visits", visitors: "stats:visitors", baked: "stats:baked", opened: "stats:opened", songs: "stats:songs" };

// run several Redis commands in one round trip; never let stats break the app
export async function redis(cmds) {
  if (!URL_ || !TOKEN) return null;
  try {
    const r = await fetch(`${URL_}/pipeline`, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(cmds) });
    return r.ok ? (await r.json()).map((x) => x.result) : null;
  } catch {
    return null;
  }
}

// a one-way fingerprint for counting unique visitors; the IP itself is never stored
export const visitorId = (req) => {
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ua = String(req.headers["user-agent"] || "");
  return createHash("sha256").update(`${ip}|${ua}|${(TOKEN || "").slice(0, 24)}`).digest("hex").slice(0, 32);
};

export const songKey = (c) => `${c.song}${c.artist ? ` — ${c.artist}` : ""}`.slice(0, 200);

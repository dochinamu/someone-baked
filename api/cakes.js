// POST a cake -> { id }. GET ?id= -> the cake, with how far its candles have melted.
//
// Candles start burning when the cake is baked and stop the first time the recipient opens the link.
// If nobody opens it within MELT_DAYS, the candles burn down and the songs are gone for good.
//
// Everything lives in a private Vercel Blob store and is only ever read here, with the store token:
//   cakes/<id>.json   the full cake as sent. Deleted automatically after MELT_DAYS (ttlDays).
//   kept/<id>.json    the full cake after its first open, with the melt frozen at that moment. Kept.
//   shells/<id>.json  the cake without songs, so a burnt-down cake can still show its wax puddles. Kept.
//   recent/<key>.json the public view for "Fresh out of the oven" (no songs, no names).
import { put, get, del } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import { cleanCake, publicView } from "../lib/cake.js";

export const MELT_DAYS = 7;
const MELT_MS = MELT_DAYS * 864e5;
const ALPHA = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newId = () => [...randomBytes(10)].map((b) => ALPHA[b % ALPHA.length]).join("");
const ID = /^[A-Za-z0-9]{6,16}$/;
const OPTS = { access: "private", addRandomSuffix: false, contentType: "application/json", cacheControlMaxAge: 60 };

async function read(pathname) {
  const r = await get(pathname, { access: "private", useCache: false });
  return r && r.statusCode === 200 ? new Response(r.stream).json() : null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
    if (JSON.stringify(body || {}).length > 20000) return res.status(413).json({ error: "too big" });
    const cake = cleanCake(body);
    if (!cake) return res.status(400).json({ error: "a cake needs at least one candle" });
    const id = newId(), at = Date.now(), shown = publicView(cake, at);
    await Promise.all([
      put(`cakes/${id}.json`, JSON.stringify({ ...cake, at }), { ...OPTS, ttlDays: MELT_DAYS }),
      put(`shells/${id}.json`, JSON.stringify({ ...shown, to: cake.to, from: cake.from }), OPTS),
      put(`recent/${String(9e15 - at).padStart(16, "0")}-${id}.json`, JSON.stringify(shown), OPTS),
    ]);
    return res.status(201).json({ id, meltDays: MELT_DAYS });
  }
  if (req.method === "GET") {
    const id = String(req.query.id || "");
    if (!ID.test(id)) return res.status(400).json({ error: "bad id" });
    // the sender checking their own link: show the current melt, but don't count it as opened
    const peek = req.query.peek === "1";
    try {
      const kept = await read(`kept/${id}.json`);
      if (kept) return res.status(200).json(kept);

      const cake = await read(`cakes/${id}.json`);
      const now = Date.now();
      if (cake && now - cake.at < MELT_MS) {
        const melt = Math.max(0, (now - cake.at) / MELT_MS);
        if (peek) return res.status(200).json({ ...cake, melt });
        const opened = { ...cake, melt, openedAt: now };
        await put(`kept/${id}.json`, JSON.stringify(opened), { ...OPTS, allowOverwrite: true });
        await del(`cakes/${id}.json`).catch(() => {});
        return res.status(200).json(opened);
      }
      // past its time: the TTL may not have swept it yet, so remove the songs now
      if (cake) await del(`cakes/${id}.json`).catch(() => {});

      const shell = await read(`shells/${id}.json`);
      if (shell) return res.status(200).json({ ...shell, melt: 1, melted: true });
      return res.status(404).json({ error: "not found" });
    } catch {
      return res.status(404).json({ error: "not found" });
    }
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}

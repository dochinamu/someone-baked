// POST a cake -> { id }. GET ?id= -> the cake.
// Stored in Vercel Blob: cakes/<id>.json (full, read via the private link) and recent/<newest-first-key>.json (public view only).
import { put, head } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import { cleanCake, publicView } from "../lib/cake.js";

const ALPHA = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newId = () => [...randomBytes(10)].map((b) => ALPHA[b % ALPHA.length]).join("");
const ID = /^[A-Za-z0-9]{6,16}$/;

export default async function handler(req, res) {
  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
    if (JSON.stringify(body || {}).length > 20000) return res.status(413).json({ error: "too big" });
    const cake = cleanCake(body);
    if (!cake) return res.status(400).json({ error: "a cake needs at least one candle" });
    const id = newId(), at = Date.now();
    const opts = { access: "public", addRandomSuffix: false, contentType: "application/json" };
    await put(`cakes/${id}.json`, JSON.stringify({ ...cake, at }), { ...opts, cacheControlMaxAge: 31536000 });
    await put(`recent/${String(9e15 - at).padStart(16, "0")}-${id}.json`, JSON.stringify(publicView(cake, at)), opts);
    return res.status(201).json({ id });
  }
  if (req.method === "GET") {
    const id = String(req.query.id || "");
    if (!ID.test(id)) return res.status(400).json({ error: "bad id" });
    try {
      const meta = await head(`cakes/${id}.json`);
      const r = await fetch(meta.url);
      if (!r.ok) throw new Error();
      res.setHeader("Cache-Control", "public, s-maxage=3600");
      return res.status(200).json(await r.json());
    } catch {
      return res.status(404).json({ error: "not found" });
    }
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}

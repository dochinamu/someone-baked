// Shared validation for a baked cake. Anything not on these lists is dropped.
export const CAKES = ["cherry", "vanilla", "pink", "bows", "matcha", "strawberry", "lemon", "sweet", "lavender", "choco", "social"];
export const LOOKS = ["linen", "emerald", "tent", "velvet", "candy", "gingham"];
const STYLES = ["taper", "stripe", "twist", "skinny", "curl"];
const WAX = ["cream", "blush", "cherry", "butter", "sage", "powder", "cocoa", "gold"];
const TOPPERS = ["cherry", "star", "heart", "bow", "pearls", "rosette"];
const MAX_CANDLES = 10, MAX_TOPPERS = 12;

const str = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const num = (v) => (Number.isFinite(+v) ? Math.max(-1, Math.min(1, +v)) : 0);
const url = (v, hosts) => {
  try { const u = new URL(str(v, 500)); return u.protocol === "https:" && hosts.some((h) => u.hostname === h || u.hostname.endsWith("." + h)) ? u.href : ""; } catch { return ""; }
};

export function cleanCake(body) {
  if (!body || typeof body !== "object") return null;
  const cake = CAKES.includes(body.cake) ? body.cake : null;
  if (!cake) return null;
  const items = Array.isArray(body.items) ? body.items : [];
  const candles = [], toppers = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    if (it.type === "candle" && candles.length < MAX_CANDLES) {
      const song = str(it.song, 120);
      if (!song) continue;
      candles.push({
        type: "candle", song, artist: str(it.artist, 120),
        art: url(it.art, ["mzstatic.com"]), preview: url(it.preview, ["apple.com", "mzstatic.com"]), url: url(it.url, ["apple.com"]),
        style: STYLES.includes(it.style) ? it.style : "taper", color: WAX.includes(it.color) ? it.color : "cream",
        u: num(it.u), v: num(it.v),
      });
    } else if (it.type === "topper" && toppers.length < MAX_TOPPERS && TOPPERS.includes(it.kind)) {
      toppers.push({ type: "topper", kind: it.kind, u: num(it.u), v: num(it.v) });
    }
  }
  if (!candles.length) return null;
  return { v: 1, cake, look: LOOKS.includes(body.look) ? body.look : "linen", to: str(body.to, 20), from: str(body.from, 20), items: [...candles, ...toppers] };
}

// what strangers may see in "Fresh out of the oven": the cake and where things sit, never songs or names
export const publicView = (c, at) => ({ cake: c.cake, look: c.look, at, items: c.items.map(({ type, style, color, kind, u, v }) => (type === "candle" ? { type, style, color, u, v } : { type, kind, u, v })) });

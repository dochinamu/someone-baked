// Song search through the iTunes Search API (free, no key, 30-second previews).
// Some storefronts (Korea, for one) return nothing from this API, so an empty result falls back to the US store,
// which also matches Korean titles and artist names.
const lookup = async (term, country) => {
  const params = new URLSearchParams({ term, media: "music", entity: "song", limit: "10", country });
  const r = await fetch(`https://itunes.apple.com/search?${params}`, { headers: { "user-agent": "someone-baked-you-a-playlist" } });
  if (!r.ok) throw new Error(String(r.status));
  return ((await r.json()).results || []).filter((t) => t.trackName);
};

export default async function handler(req, res) {
  const q = String(req.query.q || "").trim().slice(0, 80);
  if (!q) return res.status(200).json({ results: [] });
  const country = /^[A-Za-z]{2}$/.test(String(req.query.country || "")) ? String(req.query.country).toUpperCase() : "US";
  try {
    let found = await lookup(q, country);
    if (!found.length && country !== "US") found = await lookup(q, "US");
    const results = found.map((t) => ({
      title: t.trackName,
      artist: t.artistName || "",
      art: (t.artworkUrl100 || "").replace("100x100bb", "200x200bb"),
      preview: t.previewUrl || "",
      url: t.trackViewUrl || "",
    }));
    res.setHeader("Cache-Control", results.length ? "public, s-maxage=86400, stale-while-revalidate=604800" : "public, s-maxage=60");
    return res.status(200).json({ results });
  } catch {
    return res.status(502).json({ results: [] });
  }
}

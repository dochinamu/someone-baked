// Song search through the iTunes Search API (free, no key, 30-second previews).
export default async function handler(req, res) {
  const q = String(req.query.q || "").trim().slice(0, 80);
  if (!q) return res.status(200).json({ results: [] });
  const country = /^[A-Za-z]{2}$/.test(String(req.query.country || "")) ? String(req.query.country).toUpperCase() : "US";
  const params = new URLSearchParams({ term: q, media: "music", entity: "song", limit: "10", country });
  try {
    const r = await fetch(`https://itunes.apple.com/search?${params}`, { headers: { "user-agent": "someone-baked-you-a-playlist" } });
    if (!r.ok) return res.status(502).json({ results: [] });
    const j = await r.json();
    const results = (j.results || []).filter((t) => t.trackName).map((t) => ({
      title: t.trackName,
      artist: t.artistName || "",
      art: (t.artworkUrl100 || "").replace("100x100bb", "200x200bb"),
      preview: t.previewUrl || "",
      url: t.trackViewUrl || "",
    }));
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).json({ results });
  } catch {
    return res.status(502).json({ results: [] });
  }
}

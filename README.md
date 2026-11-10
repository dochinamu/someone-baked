# Someone Baked You a Playlist

Pick a cake, stick songs in as candles, wrap it up and send the link.
The person who opens it sees the cake in a dark room and blows out each candle (tap, or blow into the mic) to hear its song.

- `index.html` – the whole front end (vanilla JS + SVG, no build step)
- `cakes/` – cut-out cake images
- `api/search.js` – song search via the iTunes Search API (30-second previews)
- `api/cakes.js` – save a cake (`POST`) and open one by id (`GET ?id=`)
- `api/recent.js` – the newest cakes for "Fresh out of the oven" (no songs, no names)
- `lib/cake.js` – validation shared by the API

Storage is Vercel Blob. Connect a Blob store to the project so `BLOB_READ_WRITE_TOKEN` is set.
Shared links look like `/c/<id>`; `vercel.json` rewrites them to `index.html`.

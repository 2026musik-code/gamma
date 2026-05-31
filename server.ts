import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // YouTube Search API
  app.get("/api/youtube/search", async (req, res) => {
    try {
      const { q } = req.query;
      const apiKey = process.env.YOUTUBE_API_KEY;
      
      if (!apiKey) {
        return res.status(401).json({ 
          error: "API Key is missing. Please add your YOUTUBE_API_KEY to the Secrets panel." 
        });
      }

      if (!q) {
        return res.status(400).json({ error: "Search query is required." });
      }

      // Fetch from YouTube Data API v3
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(
          q as string
        )}&type=video&key=${apiKey}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "YouTube API error");
      }

      res.json(data);
    } catch (error: any) {
      console.error("Error fetching YouTube data:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Server-side searching of YouTube using native fetch (same as worker)
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: "Search query is required." });
      }

      const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q as string)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "id-ID,id;q=0.9",
        }
      });

      if (!response.ok) {
        return res.status(502).json({ error: "Failed to fetch from YouTube" });
      }

      const html = await response.text();
      const match = html.match(/ytInitialData\s*=\s*({.+?});/);
      
      if (!match) {
        return res.status(500).json({ error: "Failed to parse YouTube data" });
      }

      const ytData = JSON.parse(match[1]);
      const items = ytData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

      let mappedVideos: any[] = [];
      
      items.forEach((item: any) => {
        if (item.videoRenderer) {
          const v = item.videoRenderer;
          mappedVideos.push({
            id: v.videoId,
            duration: v.lengthText?.simpleText || "0:00",
            views: v.viewCountText?.simpleText || "0 views",
            title: v.title?.runs?.[0]?.text || "",
            channel: v.ownerText?.runs?.[0]?.text || "",
            time: v.publishedTimeText?.simpleText || "",
            thumbnail: v.thumbnail?.thumbnails?.[v.thumbnail?.thumbnails?.length - 1]?.url || v.thumbnail?.thumbnails?.[0]?.url || "",
          });
        } else if (item.reelShelfRenderer) {
          item.reelShelfRenderer.items?.forEach((reelItem: any) => {
            if (reelItem.reelItemRenderer) {
              const r = reelItem.reelItemRenderer;
              mappedVideos.push({
                id: r.videoId,
                duration: "Shorts",
                views: r.viewCountText?.simpleText || "0 views",
                title: r.headline?.simpleText || "",
                channel: r.channelText?.runs?.[0]?.text || "Shorts",
                time: "",
                thumbnail: r.thumbnail?.thumbnails?.[r.thumbnail?.thumbnails?.length - 1]?.url || r.thumbnail?.thumbnails?.[0]?.url || "",
              });
            }
          });
        } else if (item.gridShelfViewModel) {
          item.gridShelfViewModel.contents?.forEach((c: any) => {
            const s = c.shortsLockupViewModel;
            if (s) {
              const videoId = s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
              const title = s.overlayMetadata?.primaryText?.content || s.accessibilityText;
              // Accessibility text usually has views, let's extract them
              const viewsMatch = s.accessibilityText?.match(/,\s*(.+?)\s*-\s*putar/);
              const views = viewsMatch ? viewsMatch[1] : "0 ditonton";
              mappedVideos.push({
                id: videoId,
                duration: "Shorts",
                views: views,
                title: title,
                channel: "Shorts",
                time: "",
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              });
            }
          });
        }
      });

      res.json({ items: mappedVideos });
    } catch (error: any) {
      console.error("Error fetching YouTube data via proxy:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

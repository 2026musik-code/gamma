import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";

const app = new Hono();

app.get("/api/search", async (c) => {
  try {
    const q = c.req.query("q");
    if (!q) {
      return c.json({ error: "Search query is required." }, 400);
    }

    const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "id-ID,id;q=0.9",
      }
    });

    if (!response.ok) {
      return c.json({ error: "Failed to fetch from YouTube" }, 502);
    }

    const html = await response.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});/);
    
    if (!match) {
      return c.json({ error: "Failed to parse YouTube data" }, 500);
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
        item.gridShelfViewModel.contents?.forEach((cItem: any) => {
          const s = cItem.shortsLockupViewModel;
          if (s) {
            const videoId = s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;
            const title = s.overlayMetadata?.primaryText?.content || s.accessibilityText;
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

    return c.json({ items: mappedVideos });
  } catch (error: any) {
    console.error("Error fetching YouTube data via proxy:", error);
    return c.json({ error: error.message }, 500);
  }
});

async function startServer() {
  const PORT = 3000;

  // We are running in Node.js environment (Cloud Run/Local)
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Convert Express middleware signature to Hono
    app.use("*", async (c, next) => {
      await new Promise<void>((resolve) => {
        vite.middlewares(c.env?.incoming || c.req.raw, c.env?.outgoing || c.res, resolve);
      });
      await next();
    });
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    
    app.use("/*", serveStatic({ root: "./dist" }));
    app.get("*", async (c) => {
      const indexHtml = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
      return c.html(indexHtml);
    });
  }

  serve({
    fetch: app.fetch,
    port: PORT
  }, (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  });
}

startServer();


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

  // Server-side searching of YouTube using yt-search
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: "Search query is required." });
      }

      const ytSearch = (await import("yt-search")).default;
      const opts = {
        query: req.query.q as string,
        pageStart: 1,
        pageEnd: 1,
      };

      const result = await ytSearch(opts);
      
      // Map it to match what the frontend expects or we can just send the raw result
      // But the frontend currently expects `data.items` shaped like piped API.
      // Wait, let's just shape it. Frontend expects:
      /*
        {
          items: [
            {
              url: "/watch?v=...",
              duration: seconds, // integer
              views: number,
              title: string,
              uploaderName: string,
              uploadedDate: string,
              thumbnail: string
            }
          ]
        }
      */
      
      const mappedVideos = result.videos.map(v => ({
        url: v.url,
        duration: v.duration.seconds,
        views: v.views,
        title: v.title,
        uploaderName: v.author.name,
        uploadedDate: v.ago,
        thumbnail: v.thumbnail,
      }));

      res.json({ items: mappedVideos });
    } catch (error: any) {
      console.error("Error fetching YouTube data via proxy:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Local Preview Mock - simulates streaming response without needing a key
  app.post("/api/chat", async (req, res) => {
    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const mockMessage = "Halo! Ini adalah respons simulasi dari AI Studio. Anda meminta model 'Gemma' (Gemma 7B) yang sepenuhnya gratis dan dapat dijalankan tanpa API Key.\n\nUntuk menjalankan aplikasi ini secara nyata:\n1. **Deploy ke Cloudflare**: Gunakan file `cloudflare-worker.ts` (sudah disiapkan untuk memanggil `@cf/google/gemma-7b-it` gratis di jaringan Cloudflare).\n2. **Offline Lokal**: Anda dapat menginstal [Ollama](https://ollama.com) di PC Anda, jalankan `ollama run gemma`, dan hubungkan aplikasi ini ke localhost:11434.\n\nSistem siap di-deploy!";
      
      const words = mockMessage.split(" ");
      
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ text: word + " " })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 40)); // Simulate typing
      }
      
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("Error generating mock response:", error);
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

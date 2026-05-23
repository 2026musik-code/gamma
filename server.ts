import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

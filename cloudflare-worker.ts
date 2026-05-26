/**
 * Cloudflare Worker Implementation for AI GAMMA 4 (Menggunakan model Gemma gratis)
 * 
 * Instructions:
 * 1. Install Wrangler: npm install -g wrangler
 * 2. Login to Cloudflare: wrangler login
 * 3. Initialize Hono project: npm create cloudflare@latest algamma4 -- --framework hono
 * 4. Replace src/index.ts with this file.
 * 5. Update wrangler.toml to include the AI binding:
 *    [ai]
 *    binding = "AI"
 * 6. Deploy: npm run deploy
 * 
 * Catatan: Ini menggunakan Workers AI dari Cloudflare dengan model Gemma (gratis via Cloudflare edge).
 * Tidak memerlukan Google Gemini API Key.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  // Binding AI dari Cloudflare Workers
  AI: any 
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

app.get('/api/search', async (c) => {
  try {
    const q = c.req.query('q');
    
    if (!q) {
      return c.json({ error: "Search query is required." }, 400);
    }

    // Fetch directly from YouTube using Cloudflare's native fetch
    const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q as string)}`, {
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
        item.gridShelfViewModel.contents?.forEach((c: any) => {
          const s = c.shortsLockupViewModel;
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
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
})

app.post('/api/chat', async (c) => {
  try {
    const body = await c.req.json()
    const messages = body.messages || []

    if (messages.length === 0) {
      return c.json({ error: 'Message payload is empty.' }, 400)
    }

    const systemInstruction = 'You are AI GAMMA 4, an advanced, highly intelligent artificial intelligence. You communicate clearly, concisely, and sometimes with a slightly technical undertone.';
    
    // Ensure the first message is a user message. 
    // If the frontend sends the welcome 'model' greeting first, we need to handle it or inject a system-like user prompt.
    const cleanMessages = messages[0]?.role === 'model' || messages[0]?.role === 'assistant' 
        ? messages.slice(1) 
        : messages;

    // Map messages, replacing 'model' with 'assistant'
    // and merging the system instruction into the first user prompt.
    const mappedMessages = cleanMessages.map((m: any, index: number) => {
      let content = m.content;
      if (index === 0 && m.role === 'user') {
        content = `${systemInstruction}\n\nUser: ${m.content}`;
      }
      return {
        role: m.role === 'model' ? 'assistant' : m.role,
        content: content
      };
    });

    // Menggunakan model Gemma 7B dari Cloudflare Workers AI
    // Ini berjalan di jaringan Cloudflare dan masuk tier gratis mereka.
    const responseStream = await c.env.AI.run('@cf/google/gemma-7b-it-lora', {
      messages: mappedMessages,
      stream: true,
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (err: any) {
    console.error('API Chat route error:', err);
    return c.json({ error: `Cloudflare AI Error: ${err.message || String(err)}` }, 500)
  }
})

export default app

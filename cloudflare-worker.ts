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

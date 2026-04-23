/**
 * Cloudflare Worker — OpenAI proxy for Family Chinese Reader
 *
 * Environment variable required:
 *   OPENAI_API_KEY  — set via `wrangler secret put OPENAI_API_KEY`
 *
 * Request (POST /):
 *   { system: string, message: string }
 *
 * Response:
 *   { story: string }
 */

export interface Env {
  OPENAI_API_KEY: string;
  /** Comma-separated list of allowed origins, e.g. https://myapp.pages.dev */
  ALLOWED_ORIGIN?: string;
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

function corsHeaders(origin: string, allowed: string): HeadersInit {
  const origins = allowed ? allowed.split(",").map((s) => s.trim()) : [];
  const ok = origins.length === 0 || origins.includes(origin) || origins.includes("*");
  return {
    "Access-Control-Allow-Origin": ok ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "*";
    const allowed = env.ALLOWED_ORIGIN ?? "*";
    const cors = corsHeaders(origin, allowed);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors });
    }

    let body: { system?: string; message?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { system, message } = body;
    if (!system || !message) {
      return new Response(JSON.stringify({ error: "Missing system or message" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    try {
      const openaiRes = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: message },
          ],
          max_tokens: 600,
          temperature: 0.7,
        }),
      });

      if (!openaiRes.ok) {
        const err = await openaiRes.text();
        return new Response(JSON.stringify({ error: err }), {
          status: openaiRes.status,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const data = await openaiRes.json() as {
        choices: { message: { content: string } }[];
      };
      const story = data.choices?.[0]?.message?.content?.trim() ?? "";

      return new Response(JSON.stringify({ story }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
};

import { createServer } from "node:http";
import { createAIProvider } from "./provider.js";

const MAX_BODY_BYTES = 32 * 1024;
const provider = createAIProvider();

function send(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
  }
  try { return JSON.parse(raw || "{}"); }
  catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}

export function createAppServer(aiProvider = provider) {
  return createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    if (request.method === "GET" && url.pathname === "/api/health") {
      return send(response, 200, {
        status: "ok",
        ai: { configured: aiProvider.configured, provider: aiProvider.configured ? aiProvider.provider : null }
      });
    }
    if (request.method === "POST" && url.pathname === "/api/tutor") {
      try {
        const input = await readJson(request);
        if (!input || typeof input !== "object" || Array.isArray(input)) {
          return send(response, 400, { error: "A JSON object is required." });
        }
        if (typeof input.userMessage !== "string" || !input.userMessage.trim()) {
          return send(response, 400, { error: "userMessage is required." });
        }
        if (input.userMessage.length > 8000) {
          return send(response, 413, { error: "userMessage is too long." });
        }
        if (!aiProvider.configured) {
          return send(response, 503, { error: "AI provider is not configured on the server." });
        }
        const result = await aiProvider.generateTutorTurn(input);
        return send(response, 200, result);
      } catch (error) {
        return send(response, error.status || 502, { error: error.message || "Tutor request failed." });
      }
    }
    return send(response, 404, { error: "Not found." });
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const port = Number(process.env.PORT || 3000);
  createAppServer().listen(port, () => {
    console.log(`Adaptive Language Tutor API listening on port ${port}`);
  });
}

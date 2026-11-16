import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createAIProvider } from "./provider.js";

const MAX_BODY_BYTES = 32 * 1024;
const ROOT = resolve(fileURLToPath(new URL("../", import.meta.url)));
const provider = createAIProvider();
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};

async function serveStatic(pathname, response) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch { return send(response, 400, { error: "Invalid URL path." }); }
  const relative = decoded === "/" ? "index.html" : (decoded.startsWith("/") ? decoded.slice(1) : decoded);
  const filePath = resolve(ROOT, relative);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
    return send(response, 404, { error: "Not found." });
  }
  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "content-type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
      "x-content-type-options": "nosniff",
      "cache-control": "no-cache"
    });
    response.end(content);
  } catch {
    send(response, 404, { error: "Not found." });
  }
}

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
    if (request.method === "GET") return serveStatic(url.pathname, response);
    return send(response, 404, { error: "Not found." });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3000);
  createAppServer().listen(port, () => {
    console.log(`Adaptive Language Tutor API listening on port ${port}`);
  });
}

import "./load-env.js";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createAIProvider } from "./provider.js";

const MAX_BODY_BYTES = 32 * 1024;
const TUTOR_RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_TUTOR_REQUESTS_PER_WINDOW = 60;
const MAX_CONCURRENT_TUTOR_REQUESTS = 2;
const ROOT = resolve(fileURLToPath(new URL("../", import.meta.url)));
const PUBLIC_SRC_ROOT = resolve(ROOT, "src");
const PUBLIC_ASSET_EXTENSIONS = new Set([".js", ".css"]);
const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()"
};
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
  let filePath;
  if (decoded === "/" || decoded === "/index.html") {
    filePath = resolve(ROOT, "index.html");
  } else if (decoded.startsWith("/src/")) {
    filePath = resolve(ROOT, decoded.slice(1));
    if (!filePath.startsWith(PUBLIC_SRC_ROOT + sep) || !PUBLIC_ASSET_EXTENSIONS.has(extname(filePath))) {
      return send(response, 404, { error: "Not found." });
    }
  } else {
    return send(response, 404, { error: "Not found." });
  }
  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "content-type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
      "cache-control": "no-cache",
      ...SECURITY_HEADERS
    });
    response.end(content);
  } catch {
    send(response, 404, { error: "Not found." });
  }
}

function send(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...SECURITY_HEADERS,
    ...extraHeaders
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
  const tutorRequestTimes = [];
  let activeTutorRequests = 0;

  return createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    if (request.method === "GET" && url.pathname === "/api/health") {
      return send(response, 200, {
        status: "ok",
        ai: { configured: aiProvider.configured, provider: aiProvider.configured ? aiProvider.provider : null }
      });
    }
    if (request.method === "POST" && url.pathname === "/api/tutor") {
      let input;
      try {
        input = await readJson(request);
        if (!input || typeof input !== "object" || Array.isArray(input)) {
          return send(response, 400, { error: "A JSON object is required." });
        }
        if (typeof input.userMessage !== "string" || !input.userMessage.trim()) {
          return send(response, 400, { error: "userMessage is required." });
        }
        if (input.userMessage.length > 8000) {
          return send(response, 413, { error: "userMessage is too long." });
        }
      } catch (error) {
        return send(response, error.status || 400, { error: error.message || "Invalid request." });
      }
      if (!aiProvider.configured) {
        return send(response, 503, { error: "AI provider is not configured on the server." });
      }

      const now = Date.now();
      while (tutorRequestTimes.length && now - tutorRequestTimes[0] >= TUTOR_RATE_WINDOW_MS) {
        tutorRequestTimes.shift();
      }
      if (tutorRequestTimes.length >= MAX_TUTOR_REQUESTS_PER_WINDOW) {
        const retryAfter = Math.max(1, Math.ceil((TUTOR_RATE_WINDOW_MS - (now - tutorRequestTimes[0])) / 1000));
        return send(response, 429, { error: "Tutor request limit reached. Please try again later." }, { "retry-after": String(retryAfter) });
      }
      if (activeTutorRequests >= MAX_CONCURRENT_TUTOR_REQUESTS) {
        return send(response, 503, { error: "Tutor is busy. Please retry shortly." }, { "retry-after": "2" });
      }

      tutorRequestTimes.push(now);
      activeTutorRequests += 1;
      try {
        const result = await aiProvider.generateTutorTurn(input);
        return send(response, 200, result);
      } catch (error) {
        return send(response, error.status || 502, { error: error.message || "Tutor request failed." });
      } finally {
        activeTutorRequests -= 1;
      }
    }
    if (request.method === "GET") return serveStatic(url.pathname, response);
    return send(response, 404, { error: "Not found." });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3000);
  const host = "0.0.0.0";
  createAppServer().listen(port, host, () => {
    console.log(`Adaptive Language Tutor listening on http://${host}:${port}`);
  });
}

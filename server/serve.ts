/**
 * Serves the production build and the progress API on localhost.
 * Usage: node server/serve.ts [--port 5179] [--open]
 */
import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { parseArgs } from "node:util";
import { createApi } from "./api.ts";

const { values } = parseArgs({
  options: {
    port: { type: "string", default: process.env.PORT ?? "5179" },
    open: { type: "boolean", default: false },
  },
});

const DIST = join(import.meta.dirname, "..", "dist");
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

const api = createApi();

const server = createServer((req, res) => {
  void api(req, res, async () => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.statusCode = 405;
      res.end();
      return;
    }
    const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    let file = normalize(join(DIST, pathname));
    if (!file.startsWith(DIST + sep) && file !== DIST) {
      res.statusCode = 403;
      res.end();
      return;
    }
    let info = await stat(file).catch(() => null);
    if (!info?.isFile()) {
      file = join(DIST, "index.html"); // single-page app fallback
      info = await stat(file).catch(() => null);
    }
    if (!info) {
      res.statusCode = 503;
      res.end("No build found. Run `make build` first.");
      return;
    }
    res.setHeader("Content-Type", TYPES[extname(file)] ?? "application/octet-stream");
    res.setHeader(
      "Cache-Control",
      file.includes(`${sep}assets${sep}`) ? "public, max-age=31536000, immutable" : "no-cache",
    );
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(file).pipe(res);
  });
});

server.listen(Number(values.port), "127.0.0.1", () => {
  const url = `http://localhost:${values.port}/`;
  console.log(`Einbürgerungstest trainer running at ${url}  (Ctrl+C to stop)`);
  if (values.open) execFile(process.platform === "darwin" ? "open" : "xdg-open", [url]);
});

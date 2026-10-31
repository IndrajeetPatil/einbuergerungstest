// Serves the production build and the progress API on localhost.
// Usage: node server/serve.ts [--port 5179] [--open]
import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { parseArgs } from "node:util";

import { createApi } from "./api.ts";

const DEFAULT_PORT = "5179";
const STATUS = { forbidden: 403, notAllowed: 405, unavailable: 503 } as const;
const DIST = path.join(import.meta.dirname, "..", "dist");
const INDEX = path.join(DIST, "index.html");
const ASSETS = `${path.sep}assets${path.sep}`;
const TYPES: Readonly<Record<string, string>> = {
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

const { values } = parseArgs({
  options: {
    port: { type: "string", default: process.env["PORT"] ?? DEFAULT_PORT },
    open: { type: "boolean", default: false },
  },
});

async function isFile(file: string): Promise<boolean> {
  const info = await stat(file).catch(() => null);
  return info?.isFile() ?? false;
}

function insideDist(file: string): boolean {
  // Reject anything outside dist/, including siblings such as dist-other/.
  return file === DIST || file.startsWith(`${DIST}${path.sep}`);
}

/**
 * The file to serve for a URL path, falling back to the single-page app.
 * @param urlPath - Decoded path of the request URL.
 * @returns The file, null when outside dist/, or "" without a build.
 */
async function resolveFile(urlPath: string): Promise<string | null> {
  const file = path.normalize(path.join(DIST, decodeURIComponent(urlPath)));
  if (!insideDist(file)) {
    return null;
  }
  if (await isFile(file)) {
    return file;
  }
  return (await isFile(INDEX)) ? INDEX : "";
}

function reply(res: ServerResponse, status: number, text = ""): void {
  res.statusCode = status;
  res.end(text);
}

function sendFile(
  req: IncomingMessage,
  res: ServerResponse,
  file: string,
): void {
  res.setHeader(
    "Content-Type",
    TYPES[path.extname(file)] ?? "application/octet-stream",
  );
  res.setHeader(
    "Cache-Control",
    file.includes(ASSETS) ? "public, max-age=31536000, immutable" : "no-cache",
  );
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
}

function readOnly(req: IncomingMessage): boolean {
  return req.method === "GET" || req.method === "HEAD";
}

function respond(
  req: IncomingMessage,
  res: ServerResponse,
  file: string | null,
): void {
  if (file === null) {
    reply(res, STATUS.forbidden);
  } else if (file === "") {
    reply(res, STATUS.unavailable, "No build found. Run `make build` first.");
  } else {
    sendFile(req, res, file);
  }
}

async function serveStatic(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!readOnly(req)) {
    reply(res, STATUS.notAllowed);
    return;
  }
  const url = new URL(req.url ?? "/", "http://localhost");
  respond(req, res, await resolveFile(url.pathname));
}

const api = createApi();
const server = createServer((req, res) => {
  void api(req, res, () => {
    void serveStatic(req, res);
  });
});

server.listen(Number(values.port), "127.0.0.1", () => {
  const url = `http://localhost:${values.port}/`;
  console.log(`Einbürgerungstest trainer running at ${url}  (Ctrl+C to stop)`);
  if (values.open) {
    execFile(process.platform === "darwin" ? "open" : "xdg-open", [url]);
  }
});

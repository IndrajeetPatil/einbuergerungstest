// Connect-style handler for the progress API. The same handler serves
// `vp dev`, `vp preview` and server/serve.ts, so there is one source of truth.
import type { IncomingMessage, ServerResponse } from "node:http";

import { z as zod } from "zod/mini";

import { finishInputSchema } from "#lib/schemas.ts";

import { ProgressStore } from "./db.ts";
import { ValidationError } from "./errors.ts";

type Next = (error?: unknown) => void;
type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next?: Next,
) => Promise<void>;
type Handler = (context: RouteContext) => [number, unknown?];

interface RouteContext {
  store: ProgressStore;
  body: unknown;
  sessionId: number;
}

interface Exchange {
  store: ProgressStore;
  req: IncomingMessage;
  res: ServerResponse;
  route: string;
}

const MAX_BODY_BYTES = 262_144;
const STATUS = {
  ok: 200,
  created: 201,
  noContent: 204,
  badRequest: 400,
  notFound: 404,
  unsupportedMediaType: 415,
  serverError: 500,
} as const;

const SESSION_ROUTE = /^\/sessions\/(?<id>\d+)(?<action>\/answers|\/finish)?$/u;

function toBuffer(chunk: unknown): Buffer {
  return Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
}

function parseBody(raw: string): unknown {
  if (raw === "") {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed;
  } catch {
    throw new ValidationError("invalid JSON");
  }
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = toBuffer(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      throw new ValidationError("request body too large");
    }
    chunks.push(buffer);
  }
  return parseBody(Buffer.concat(chunks).toString("utf8"));
}

function send(res: ServerResponse, status: number, body?: unknown): void {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store");
  if (body === undefined) {
    res.end();
    return;
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function finish({ store, body, sessionId }: RouteContext): [number, unknown] {
  const input = zod.safeParse(finishInputSchema, body);
  if (!input.success) {
    throw new ValidationError(zod.prettifyError(input.error));
  }
  return [
    STATUS.ok,
    store.finishSession(sessionId, {
      answers: input.data.answers,
      durationMs: input.data.durationMs ?? null,
    }),
  ];
}

const ROUTES: Readonly<Record<string, Handler>> = {
  "GET /summary": ({ store }) => [STATUS.ok, store.summary()],
  "GET /export": ({ store }) => [STATUS.ok, store.dump()],
  "PUT /settings": ({ store, body }) => [STATUS.ok, store.updateSettings(body)],
  "POST /sessions": ({ store, body }) => [
    STATUS.created,
    { id: store.startSession(body) },
  ],
  "POST /sessions/:id/answers": ({ store, body, sessionId }) => [
    STATUS.created,
    { correct: store.recordAnswer(sessionId, body) },
  ],
  "POST /sessions/:id/finish": finish,
  "DELETE /sessions/:id": ({ store, sessionId }) => {
    store.discardSession(sessionId);
    return [STATUS.noContent];
  },
};

function routeKey(method: string, route: string): [string, number] {
  const groups = SESSION_ROUTE.exec(route)?.groups;
  if (groups === undefined) {
    return [`${method} ${route}`, Number.NaN];
  }
  const action = groups["action"] ?? "";
  return [`${method} /sessions/:id${action}`, Number(groups["id"])];
}

function isJsonWrite(req: IncomingMessage): boolean {
  const type = req.headers["content-type"] ?? "";
  return req.method === "GET" || type.startsWith("application/json");
}

function sendError(res: ServerResponse, error: unknown): void {
  if (error instanceof ValidationError) {
    send(res, STATUS.badRequest, { error: error.message });
    return;
  }
  console.error(error);
  send(res, STATUS.serverError, { error: "internal error" });
}

async function dispatch({ store, req, res, route }: Exchange): Promise<void> {
  const method = req.method ?? "GET";
  const [key, sessionId] = routeKey(method, route);
  const handler = ROUTES[key];
  if (handler === undefined) {
    send(res, STATUS.notFound, { error: "not found" });
    return;
  }
  try {
    const body = method === "GET" ? {} : await readJson(req);
    const [status, reply] = handler({ store, body, sessionId });
    send(res, status, reply);
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * Creates the API middleware.
 * @param store - Progress store; defaults to the configured database file.
 * @returns A Connect-style middleware that handles `/api/*`.
 */
function createApi(store: ProgressStore = new ProgressStore()): Middleware {
  return async (req, res, next) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (!url.pathname.startsWith("/api/")) {
      next?.();
      return;
    }
    // Only same-origin JSON requests may change data (blocks cross-site forms).
    if (!isJsonWrite(req)) {
      send(res, STATUS.unsupportedMediaType, {
        error: "expected application/json",
      });
      return;
    }
    const route = url.pathname.slice("/api".length);
    await dispatch({ store, req, res, route });
  };
}

export { createApi };
export type { Middleware };

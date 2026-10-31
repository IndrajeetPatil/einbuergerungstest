import type { IncomingMessage, ServerResponse } from "node:http";
import type { AnswerInput, Settings, StartSessionInput } from "../src/lib/types.ts";
import { ProgressStore, ValidationError } from "./db.ts";

const MAX_BODY = 256 * 1024;

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new ValidationError("request body too large");
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ValidationError("invalid JSON");
  }
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

type Next = (error?: unknown) => void;

/**
 * Connect-style middleware for the progress API. The same handler serves `vp dev`,
 * `vp preview` and the standalone server, so there is a single source of truth.
 */
export function createApi(store: ProgressStore = new ProgressStore()) {
  return async function api(req: IncomingMessage, res: ServerResponse, next?: Next): Promise<void> {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (!url.pathname.startsWith("/api/")) {
      next?.();
      return;
    }
    // Only same-origin JSON requests may change data (blocks cross-site form posts).
    if (req.method !== "GET" && !req.headers["content-type"]?.startsWith("application/json")) {
      send(res, 415, { error: "expected application/json" });
      return;
    }
    const path = url.pathname.slice("/api".length);
    const session = /^\/sessions\/(\d+)(\/answers|\/finish)?$/.exec(path);
    try {
      if (req.method === "GET" && path === "/summary") {
        send(res, 200, store.summary());
      } else if (req.method === "GET" && path === "/export") {
        send(res, 200, store.dump());
      } else if (req.method === "PUT" && path === "/settings") {
        send(res, 200, store.updateSettings((await readJson(req)) as Partial<Settings>));
      } else if (req.method === "POST" && path === "/sessions") {
        const id = store.startSession((await readJson(req)) as StartSessionInput);
        send(res, 201, { id });
      } else if (session && req.method === "POST" && session[2] === "/answers") {
        const correct = store.recordAnswer(
          Number(session[1]),
          (await readJson(req)) as AnswerInput,
        );
        send(res, 201, { correct });
      } else if (session && req.method === "POST" && session[2] === "/finish") {
        const body = (await readJson(req)) as { answers?: AnswerInput[]; durationMs?: number };
        if (body.answers !== undefined && !Array.isArray(body.answers)) {
          throw new ValidationError("answers must be an array");
        }
        send(
          res,
          200,
          store.finishSession(Number(session[1]), body.answers, body.durationMs ?? null),
        );
      } else if (session && req.method === "DELETE" && !session[2]) {
        store.discardSession(Number(session[1]));
        send(res, 204);
      } else {
        send(res, 404, { error: "not found" });
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        send(res, 400, { error: error.message });
      } else {
        console.error(error);
        send(res, 500, { error: "internal error" });
      }
    }
  };
}

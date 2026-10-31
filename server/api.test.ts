import { once } from "node:events";
import { createServer } from "node:http";
import type { Server } from "node:http";

import { describe, expect, test } from "vite-plus/test";

import { startedSchema } from "#lib/schemas.ts";

import { createApi } from "./api.ts";
import { ProgressStore } from "./db.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };
const TEAPOT = 418;
const EXAM_START = {
  mode: "exam",
  focus: null,
  state: "BE",
  questionCount: 33,
} as const;

interface Reply {
  status: number;
  data: unknown;
}

class TestApi implements AsyncDisposable {
  public readonly base: string;

  private readonly server: Server;

  private readonly store: ProgressStore;

  private constructor(server: Server, store: ProgressStore, base: string) {
    this.server = server;
    this.store = store;
    this.base = base;
  }

  public static async start(): Promise<TestApi> {
    const store = new ProgressStore(":memory:");
    const api = createApi(store);
    const server = createServer((req, res) => {
      void api(req, res, () => {
        res.statusCode = TEAPOT;
        res.end();
      });
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("server has no TCP address");
    }
    return new TestApi(server, store, `http://127.0.0.1:${address.port}`);
  }

  public async call(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Reply> {
    const response = await fetch(`${this.base}${path}`, {
      method,
      headers: method === "GET" ? {} : JSON_HEADERS,
      body: body === undefined ? null : JSON.stringify(body),
    });
    const text = await response.text();
    const data: unknown = text === "" ? null : JSON.parse(text);
    return { status: response.status, data };
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    this.server.close();
    await once(this.server, "close");
    this.store.close();
  }
}

describe(createApi, () => {
  test("serves the summary and leaves other paths to the next handler", async () => {
    await using api = await TestApi.start();
    const summary = await api.call("GET", "/api/summary");
    const other = await api.call("GET", "/index.html");
    expect([summary.status, other.status]).toStrictEqual([200, TEAPOT]);
  });

  test("runs a practice session from start to finish", async () => {
    await using api = await TestApi.start();
    await api.call("PUT", "/api/settings", { state: "BE" });
    const started = await api.call("POST", "/api/sessions", {
      ...EXAM_START,
      mode: "practice",
      focus: "smart",
      questionCount: 1,
    });
    expect(started).toStrictEqual({ status: 201, data: { id: 1 } });
    const answered = await api.call("POST", "/api/sessions/1/answers", {
      questionId: "g1",
      position: 0,
      chosen: 0,
      timeMs: 10,
    });
    const finished = await api.call("POST", "/api/sessions/1/finish", {
      durationMs: 10,
    });
    expect(answered.status).toBe(201);
    expect(finished.data).toMatchObject({ id: 1, answered: 1 });
  });

  test("discards an empty session with 204", async () => {
    await using api = await TestApi.start();
    const started = await api.call("POST", "/api/sessions", EXAM_START);
    const { id } = startedSchema.parse(started.data);
    const discarded = await api.call("DELETE", `/api/sessions/${id}`);
    expect(discarded.status).toBe(204);
  });

  test.each([
    {
      name: "a malformed finish body",
      method: "POST",
      path: "/api/sessions/1/finish",
      body: { answers: "nope" },
      status: 400,
    },
    {
      name: "an unknown route",
      method: "GET",
      path: "/api/nope",
      body: undefined,
      status: 404,
    },
    {
      name: "invalid settings",
      method: "PUT",
      path: "/api/settings",
      body: { examDate: "soon" },
      status: 400,
    },
  ])("rejects $name", async ({ method, path, body, status }) => {
    await using api = await TestApi.start();
    const result = await api.call(method, path, body);
    expect(result.status).toBe(status);
  });

  test("rejects writes that are not JSON and bodies that do not parse", async () => {
    await using api = await TestApi.start();
    const form = await fetch(`${api.base}/api/sessions`, {
      method: "POST",
      body: "a=b",
    });
    const broken = await fetch(`${api.base}/api/sessions`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: "{",
    });
    expect([form.status, broken.status]).toStrictEqual([415, 400]);
  });
});

// Typed client for the local progress API; every response is validated.
import { z as zod } from "zod/mini";

import {
  answerResultSchema,
  errorBodySchema,
  sessionSummarySchema,
  settingsSchema,
  startedSchema,
  summarySchema,
} from "./schemas.ts";
import type {
  AnswerInput,
  SessionSummary,
  Settings,
  SettingsPatch,
  StartSessionInput,
  Summary,
} from "./schemas.ts";

interface Call {
  method: "GET" | "PUT" | "POST" | "DELETE";
  path: string;
  body?: unknown;
}

const NO_CONTENT = 204;

async function failure(response: Response, call: Call): Promise<Error> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = errorBodySchema.safeParse(body);
  return new Error(
    parsed.success
      ? parsed.data.error
      : `${call.method} ${call.path} failed with ${response.status}`,
  );
}

function init(call: Call): RequestInit {
  if (call.method === "GET") {
    return { method: call.method };
  }
  return {
    method: call.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(call.body ?? {}),
  };
}

async function send(call: Call): Promise<Response> {
  const response = await fetch(`/api${call.path}`, init(call));
  if (!response.ok) {
    throw await failure(response, call);
  }
  return response;
}

async function request<Schema extends zod.ZodMiniType>(
  schema: Schema,
  call: Call,
): Promise<zod.infer<Schema>> {
  const response = await send(call);
  const data: unknown = await response.json();
  return zod.parse(schema, data);
}

const api = {
  summary: async (): Promise<Summary> =>
    request(summarySchema, { method: "GET", path: "/summary" }),
  updateSettings: async (patch: SettingsPatch): Promise<Settings> =>
    request(settingsSchema, { method: "PUT", path: "/settings", body: patch }),
  startSession: async (input: StartSessionInput): Promise<{ id: number }> =>
    request(startedSchema, { method: "POST", path: "/sessions", body: input }),
  answer: async (
    id: number,
    input: AnswerInput,
  ): Promise<{ correct: boolean }> =>
    request(answerResultSchema, {
      method: "POST",
      path: `/sessions/${id}/answers`,
      body: input,
    }),
  finish: async (
    id: number,
    answers: AnswerInput[],
    durationMs: number,
  ): Promise<SessionSummary> =>
    request(sessionSummarySchema, {
      method: "POST",
      path: `/sessions/${id}/finish`,
      body: { answers, durationMs },
    }),
  discard: async (id: number): Promise<void> => {
    const response = await send({ method: "DELETE", path: `/sessions/${id}` });
    if (response.status !== NO_CONTENT) {
      throw new Error(`DELETE /sessions/${id} returned ${response.status}`);
    }
  },
};

export { api };

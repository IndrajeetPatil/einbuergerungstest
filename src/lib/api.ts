import type { AnswerInput, SessionSummary, Settings, StartSessionInput, Summary } from "./types.ts";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: method === "GET" ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? (method === "GET" ? undefined : "{}") : JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `${method} ${path} failed with ${res.status}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  summary: () => request<Summary>("GET", "/summary"),
  updateSettings: (patch: Partial<Settings>) => request<Settings>("PUT", "/settings", patch),
  startSession: (input: StartSessionInput) => request<{ id: number }>("POST", "/sessions", input),
  answer: (id: number, input: AnswerInput) =>
    request<{ correct: boolean }>("POST", `/sessions/${id}/answers`, input),
  finish: (id: number, answers: AnswerInput[], durationMs: number) =>
    request<SessionSummary>("POST", `/sessions/${id}/finish`, { answers, durationMs }),
  discard: (id: number) => request<void>("DELETE", `/sessions/${id}`),
};

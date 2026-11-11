// Keeps the progress document in IndexedDB. Each change reads, transforms and
// writes the document in one readwrite transaction, so two open tabs cannot
// overwrite each other's answers, and a change that throws writes nothing.
import { EMPTY_PROGRESS } from "./progress.ts";
import type { Change } from "./progress.ts";
import { progressSchema } from "./schemas.ts";
import type { Progress } from "./schemas.ts";

const DB_NAME = "einbuergerungstest";
const DB_VERSION = 1;
const STORE = "progress";
const KEY = "progress";

let connection: Promise<IDBDatabase> | null = null;

async function settle<Value>(request: IDBRequest<Value>): Promise<Value> {
  const { promise, resolve, reject } = Promise.withResolvers<Value>();
  request.addEventListener("success", () => {
    resolve(request.result);
  });
  request.addEventListener("error", () => {
    reject(request.error ?? new Error("IndexedDB request failed"));
  });
  return promise;
}

async function completion(transaction: IDBTransaction): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<undefined>();
  transaction.addEventListener("complete", () => {
    resolve(undefined);
  });
  transaction.addEventListener("abort", () => {
    reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
  await promise;
}

/** Asks the browser not to evict the data under storage pressure. */
async function persist(): Promise<void> {
  try {
    await navigator.storage.persist();
  } catch {
    // Best effort: without it the data is kept unless storage runs short.
  }
}

async function openDatabase(): Promise<IDBDatabase> {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  // Version upgrades are the place for future schema migrations.
  request.addEventListener("upgradeneeded", () => {
    request.result.createObjectStore(STORE);
  });
  void persist();
  return settle(request);
}

async function database(): Promise<IDBDatabase> {
  connection ??= openDatabase();
  return connection;
}

function decode(stored: unknown): Progress {
  return stored === undefined ? EMPTY_PROGRESS : progressSchema.parse(stored);
}

/**
 * Reads the progress document.
 * @param view - What to compute from it.
 * @returns The computed value.
 */
async function readProgress<Result>(
  view: (progress: Progress) => Result,
): Promise<Result> {
  const db = await database();
  const transaction = db.transaction(STORE, "readonly");
  const stored: unknown = await settle(transaction.objectStore(STORE).get(KEY));
  return view(decode(stored));
}

function applyOrAbort<Result>(
  transaction: IDBTransaction,
  change: (progress: Progress) => Change<Result>,
  stored: unknown,
): Change<Result> {
  try {
    return change(decode(stored));
  } catch (error) {
    transaction.abort();
    throw error;
  }
}

/**
 * Applies a change to the progress document in one transaction.
 * @param change - Pure transformation; throwing aborts and writes nothing.
 * @returns What the change returns, once the write has been committed.
 */
async function changeProgress<Result>(
  change: (progress: Progress) => Change<Result>,
): Promise<Result> {
  const db = await database();
  const transaction = db.transaction(STORE, "readwrite");
  const store = transaction.objectStore(STORE);
  const stored: unknown = await settle(store.get(KEY));
  const next = applyOrAbort(transaction, change, stored);
  store.put(next.progress, KEY);
  await completion(transaction);
  return next.result;
}

export { changeProgress, readProgress };

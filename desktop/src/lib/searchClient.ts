import type { WorkerSearchResult } from "../workers/search.worker";

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, (results: WorkerSearchResult[]) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../workers/search.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (
      event: MessageEvent<{ requestId: number; results: WorkerSearchResult[] }>,
    ) => {
      const { requestId, results } = event.data;
      const resolve = pending.get(requestId);
      if (resolve) {
        pending.delete(requestId);
        resolve(results);
      }
    };
  }
  return worker;
}

export function searchQuranAsync(
  query: string,
  packId: string,
  options?: { chapterFilter?: number; limit?: number },
): Promise<WorkerSearchResult[]> {
  if (!query.trim()) return Promise.resolve([]);
  const requestId = ++seq;
  const w = getWorker();
  return new Promise((resolve) => {
    pending.set(requestId, resolve);
    w.postMessage({
      requestId,
      query,
      packId,
      chapterFilter: options?.chapterFilter,
      limit: options?.limit ?? 100,
    });
  });
}

export type { WorkerSearchResult };

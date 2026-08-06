import { vi } from "vitest";

export type QueryResult = { data: unknown; error: unknown };

type StorageResult = { data: unknown; error: unknown };

export type QueryLogEntry = {
  table: string;
  method: string;
  args: unknown[];
};

export type MockInsforgeClient = {
  database: {
    from: ReturnType<typeof vi.fn>;
  };
  storage: {
    from: ReturnType<typeof vi.fn>;
  };
  auth: {
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  __queries: QueryLogEntry[];
  __storageCalls: { bucket: string; method: string; args: unknown[] }[];
  setQueryResults: (table: string, results: QueryResult[]) => void;
  setStorageResults: (bucket: string, results: StorageResult[]) => void;
};

export function createMockInsforgeClient(): MockInsforgeClient {
  const __queries: QueryLogEntry[] = [];
  const __storageCalls: { bucket: string; method: string; args: unknown[] }[] = [];
  const queryResults = new Map<string, QueryResult[]>();
  const storageResults = new Map<string, StorageResult[]>();

  const pop = <T>(map: Map<string, T[]>, key: string, fallback: T): T => {
    const queue = map.get(key);
    if (queue && queue.length > 0) return queue.shift() as T;
    return fallback;
  };

  const buildChain = (table: string) => {
    const record = (method: string, args: unknown[]) => {
      __queries.push({ table, method, args });
    };
    const terminal = (): QueryResult =>
      pop(queryResults, table, { data: null, error: null });

    const chain = {
      select: (columns: string) => {
        record("select", [columns]);
        return chain;
      },
      eq: (column: string, value: unknown) => {
        record("eq", [column, value]);
        return chain;
      },
      not: (column: string, operator: string, value: unknown) => {
        record("not", [column, operator, value]);
        return chain;
      },
      lt: (column: string, value: string) => {
        record("lt", [column, value]);
        return chain;
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        record("order", [column, options]);
        return chain;
      },
      limit: (n: number) => {
        record("limit", [n]);
        return chain;
      },
      insert: (rows: unknown[]) => {
        record("insert", [rows]);
        return chain;
      },
      update: (patch: Record<string, unknown>) => {
        record("update", [patch]);
        return chain;
      },
      upsert: (row: unknown, options?: unknown) => {
        record("upsert", [row, options]);
        return chain;
      },
      maybeSingle: () => Promise.resolve(terminal()),
      single: () => Promise.resolve(terminal()),
      then: (
        onFulfilled?: (value: QueryResult) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(terminal()).then(onFulfilled, onRejected),
    };
    return chain;
  };

  const buildBucket = (bucket: string) => {
    const record = (method: string, args: unknown[]) => {
      __storageCalls.push({ bucket, method, args });
    };
    const resolve = (): StorageResult =>
      pop(storageResults, bucket, { data: null, error: null });
    return {
      upload: (path: string, file: unknown) => {
        record("upload", [path, file]);
        return resolve();
      },
      download: (path: string) => {
        record("download", [path]);
        return resolve();
      },
      getPublicUrl: (path: string) => {
        record("getPublicUrl", [path]);
        const queue = storageResults.get(bucket);
        if (queue && queue.length > 0) {
          return { data: (queue.shift() as StorageResult).data };
        }
        return { data: { publicUrl: `https://storage.example.com/${bucket}/${path}` } };
      },
    };
  };

  const client: MockInsforgeClient = {
    database: {
      from: vi.fn((table: string) => buildChain(table)),
    },
    storage: {
      from: vi.fn((bucket: string) => buildBucket(bucket)),
    },
    auth: {
      getCurrentUser: vi.fn(),
    },
    __queries,
    __storageCalls,
    setQueryResults: (table, results) => queryResults.set(table, [...results]),
    setStorageResults: (bucket, results) => storageResults.set(bucket, [...results]),
  };

  return client;
}

export function mockUser(userId = "user-1") {
  return {
    id: userId,
    email: "jane@example.com",
    name: "Jane Doe",
  };
}

export function okData(data: unknown): QueryResult {
  return { data, error: null };
}

export function errData(error: unknown): QueryResult {
  return { data: null, error };
}

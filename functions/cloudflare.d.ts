/**
 * The slice of the Cloudflare Workers runtime these functions use.
 *
 * Declared here rather than pulling in @cloudflare/workers-types: this is a
 * handful of shapes, and a types-only dependency on a fast-moving platform
 * package is a maintenance cost for no checking we do not already get.
 */

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: { changes: number; duration: number; last_row_id: number };
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface EventContext<Env> {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

type PagesFunction<Env = unknown> =
  (context: EventContext<Env>) => Response | Promise<Response>;

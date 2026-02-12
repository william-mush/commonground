import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb(): NeonHttpDatabase<typeof schema> | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  const sql: NeonQueryFunction<false, false> = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
}

const _db = createDb();

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    throw new Error("DATABASE_URL is not set");
  }
  return _db;
}

// For backwards compat — lazy getter that won't crash at import time
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const realDb = getDb();
    const value = Reflect.get(realDb, prop, receiver);
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});

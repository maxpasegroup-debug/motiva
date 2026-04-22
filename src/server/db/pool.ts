import prisma from "@/lib/prisma";

export function getDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL;
  return url && url.trim() ? url.trim() : null;
}

type QueryResult<Row = Record<string, unknown>> = {
  rows: Row[];
  rowCount: number;
};

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) return `'${value.toISOString().replace(/'/g, "''")}'`;
  if (Array.isArray(value)) {
    return `ARRAY[${value.map((v) => sqlValue(v)).join(", ")}]`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function bindSql(sql: string, params?: unknown[]): string {
  if (!params || params.length === 0) return sql;
  let out = sql;
  for (let i = params.length; i >= 1; i--) {
    const re = new RegExp(`\\$${i}(?!\\d)`, "g");
    out = out.replace(re, sqlValue(params[i - 1]));
  }
  return out;
}

async function runQuery<Row = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<QueryResult<Row>> {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "[env] DATABASE_URL is not set. Set it on Railway or in .env / .env.local (see .env.example).",
    );
  }

  const text = bindSql(sql, params);
  const normalized = text.trim().toLowerCase();

  if (
    normalized === "begin" ||
    normalized === "commit" ||
    normalized === "rollback"
  ) {
    return { rows: [], rowCount: 0 };
  }

  const hasReturning = /\breturning\b/i.test(text);
  const isRead = normalized.startsWith("select") || normalized.startsWith("with");
  const returnsRows = isRead || hasReturning;

  if (returnsRows) {
    const rows = (await prisma.$queryRawUnsafe(text)) as Row[];
    return { rows, rowCount: rows.length };
  }

  const rowCount = await prisma.$executeRawUnsafe(text);
  return { rows: [], rowCount };
}

export function getPool() {
  return {
    query<Row = Record<string, unknown>>(sql: string, params?: unknown[]) {
      return runQuery<Row>(sql, params);
    },
    async connect() {
      return {
        query<Row = Record<string, unknown>>(sql: string, params?: unknown[]) {
          return runQuery<Row>(sql, params);
        },
        release() {},
      };
    },
  };
}

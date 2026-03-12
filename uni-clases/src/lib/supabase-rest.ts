import crypto from "crypto";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

function extractMessage(x: unknown): string | undefined {
  if (!x || typeof x !== "object") return undefined;
  const v = (x as Record<string, unknown>).message;
  return typeof v === "string" ? v : undefined;
}

export function supabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL.");
  return url.replace(/\/$/, "");
}

export function supabaseServiceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY.");
  return key;
}

export function reporterHashFromRequest(req: Request) {
  const salt = process.env.REPORT_HASH_SALT;
  if (!salt) throw new Error("Falta REPORT_HASH_SALT.");

  const xf = req.headers.get("x-forwarded-for") ?? "";
  const ip = xf.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0";
  const ua = req.headers.get("user-agent") ?? "";

  return crypto.createHash("sha256").update(`${ip}|${ua}|${salt}`).digest("hex");
}

export async function supabaseRest<T>(
  path: string,
  opts: {
    method: HttpMethod;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    prefer?: string;
  },
): Promise<{ data: T; status: number }> {
  const url = new URL(`${supabaseUrl()}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const key = supabaseServiceKey();
  const headers: Record<string, string> = {
    apikey: key,
    authorization: `Bearer ${key}`,
  };

  if (opts.prefer) headers.prefer = opts.prefer;
  if (opts.body !== undefined) headers["content-type"] = "application/json";

  const res = await fetch(url.toString(), {
    method: opts.method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    // Avoid Next caching for API mutations/reads.
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const errMsg =
      extractMessage(json) ||
      text ||
      `Supabase REST error (${res.status}).`;
    throw new Error(String(errMsg));
  }

  return { data: json as T, status: res.status };
}

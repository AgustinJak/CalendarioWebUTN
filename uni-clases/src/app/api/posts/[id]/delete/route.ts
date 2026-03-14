import { NextResponse } from "next/server";
import crypto from "crypto";
import { reporterHashFromRequest, supabaseRest } from "@/lib/supabase-rest";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function badRequest(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

type DeleteBody = {
  deleteToken: string;
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("id requerido.");

  let body: DeleteBody | null = null;
  try {
    body = (await req.json()) as DeleteBody;
  } catch {
    return badRequest("JSON invalido.");
  }

  const token = String(body?.deleteToken ?? "").trim();
  if (!token) return badRequest("deleteToken requerido.");

  try {
    try {
      const h = reporterHashFromRequest(req);
      const rl = checkRateLimit(`delete:${h}`, 60_000, 10);
      if (!rl.ok) {
        const retrySec = Math.max(1, Math.ceil(rl.retryAfterMs / 1000));
        return NextResponse.json(
          { error: `Estas borrando muy rapido. Espera ${retrySec}s y reintenta.` },
          { status: 429, headers: { "retry-after": String(retrySec) } },
        );
      }
    } catch {
      // Skip rate limiting if fingerprint isn't available.
    }

    const { data: rows } = await supabaseRest<{ delete_token_hash: string | null }[]>(
      "/rest/v1/posts",
      {
        method: "GET",
        query: {
          select: "delete_token_hash",
          id: `eq.${id}`,
          limit: 1,
        },
      },
    );

    const row = rows?.[0];
    if (!row) return badRequest("No encontrado.", 404);
    if (!row.delete_token_hash) {
      return badRequest(
        "Este post no tiene delete token configurado (falta columna delete_token_hash).",
        409,
      );
    }

    const pepper = process.env.REPORT_HASH_SALT || "pepper";
    const hash = crypto.createHash("sha256").update(`${token}|${pepper}`).digest("hex");
    if (hash !== row.delete_token_hash) {
      return badRequest("No autorizado para borrar este post.", 403);
    }

    await supabaseRest<unknown>("/rest/v1/posts", {
      method: "DELETE",
      query: { id: `eq.${id}` },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido.";
    return badRequest(msg, 500);
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseRest } from "@/lib/supabase-rest";

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

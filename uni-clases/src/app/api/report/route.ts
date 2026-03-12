import { NextResponse } from "next/server";
import { reporterHashFromRequest, supabaseRest } from "@/lib/supabase-rest";

export const runtime = "nodejs";

const HIDE_AFTER = 5;

function badRequest(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("JSON invalido.");
  }

  const postId = String(body?.postId ?? "").trim();
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!postId) return badRequest("postId requerido.");

  try {
    const reporter_hash = reporterHashFromRequest(req);

    // Insert report; ignore duplicates for the same reporter_hash.
    const { data: inserted } = await supabaseRest<any[]>("/rest/v1/reports", {
      method: "POST",
      query: { on_conflict: "post_id,reporter_hash" },
      body: {
        post_id: postId,
        reporter_hash,
        reason: reason || null,
      },
      prefer: "resolution=ignore-duplicates,return=representation",
    });

    const didInsert = Array.isArray(inserted) && inserted.length > 0;

    // Always return current state.
    const { data: rows } = await supabaseRest<
      { report_count: number; hidden: boolean; hidden_at: string | null }[]
    >("/rest/v1/posts", {
      method: "GET",
      query: {
        select: "report_count,hidden,hidden_at",
        id: `eq.${postId}`,
        limit: 1,
      },
    });

    const current = rows?.[0];
    if (!current) return badRequest("Post no encontrado.", 404);

    if (!didInsert) {
      return NextResponse.json({
        ok: true,
        inserted: false,
        reportCount: current.report_count,
        hidden: current.hidden,
      });
    }

    const nextCount = current.report_count + 1;
    const shouldHide = nextCount >= HIDE_AFTER;

    const patch: any = {
      report_count: nextCount,
    };
    if (shouldHide && !current.hidden) {
      patch.hidden = true;
      patch.hidden_at = new Date().toISOString();
    }

    const { data: updated } = await supabaseRest<any[]>("/rest/v1/posts", {
      method: "PATCH",
      query: { id: `eq.${postId}` },
      body: patch,
      prefer: "return=representation",
    });

    const row = updated?.[0] ?? null;
    return NextResponse.json({
      ok: true,
      inserted: true,
      reportCount: row?.report_count ?? nextCount,
      hidden: row?.hidden ?? shouldHide,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido.";
    return badRequest(msg, 500);
  }
}

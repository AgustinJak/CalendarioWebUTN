import { NextResponse } from "next/server";
import type { SharedPost } from "@/lib/shared-types";
import { supabaseRest } from "@/lib/supabase-rest";

export const runtime = "nodejs";

function badRequest(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("id requerido.");

  try {
    const { data } = await supabaseRest<SharedPost[]>("/rest/v1/posts", {
      method: "GET",
      query: {
        select:
          "id,created_at,type,author_name,content,course_id,title,attachment_url,attachment_name,report_count,hidden,hidden_at",
        id: `eq.${id}`,
        limit: 1,
      },
    });
    const item = data?.[0] ?? null;
    if (!item) return badRequest("No encontrado.", 404);
    return NextResponse.json({ item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido.";
    return badRequest(msg, 500);
  }
}

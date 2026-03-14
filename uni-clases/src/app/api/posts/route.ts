import { NextResponse } from "next/server";
import type { SharedPost, SharedPostType } from "@/lib/shared-types";
import { reporterHashFromRequest, supabaseRest } from "@/lib/supabase-rest";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export const runtime = "nodejs";

const MAX_LIMIT = 200;

function badRequest(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

type CreatePostBody = {
  type: SharedPostType;
  authorName: string;
  content?: string;
  title?: string;
  courseId?: string;
  attachmentUrl?: string;
  attachmentName?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "").trim() as SharedPostType | "";
  const hiddenParam = url.searchParams.get("hidden");
  const includeContent = url.searchParams.get("includeContent") === "1";
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? "100") || 100, 1),
    MAX_LIMIT,
  );

  if (type !== "note" && type !== "file") {
    return badRequest("type invalido (note|file).");
  }

  const hidden =
    hiddenParam === null ? false : hiddenParam === "1" || hiddenParam === "true";

  const select = hidden && !includeContent
    ? "id,created_at,type,author_name,course_id,title,attachment_url,attachment_name,report_count,hidden,hidden_at"
    : "id,created_at,type,author_name,content,course_id,title,attachment_url,attachment_name,report_count,hidden,hidden_at";

  const qs = {
    select,
    type: `eq.${type}`,
    hidden: `eq.${hidden}`,
    order: "created_at.desc",
    limit,
  };

  try {
    const { data } = await supabaseRest<SharedPost[]>("/rest/v1/posts", {
      method: "GET",
      query: qs,
    });
    return NextResponse.json({ items: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido.";
    return badRequest(msg, 500);
  }
}

export async function POST(req: Request) {
  let body: CreatePostBody | null = null;
  try {
    body = (await req.json()) as CreatePostBody;
  } catch {
    return badRequest("JSON invalido.");
  }

  const type = String(body?.type ?? "") as SharedPostType | "";
  const authorName = String(body?.authorName ?? "").trim();
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const courseId = typeof body?.courseId === "string" ? body.courseId.trim() : "";
  const attachmentUrl =
    typeof body?.attachmentUrl === "string" ? body.attachmentUrl.trim() : "";
  const attachmentName =
    typeof body?.attachmentName === "string" ? body.attachmentName.trim() : "";

  if (type !== "note" && type !== "file") {
    return badRequest("type invalido (note|file).");
  }
  if (!authorName) {
    return badRequest("Completa tu nombre y apellido.");
  }

  // Anti-spam: limit creations per browser/device fingerprint.
  // This is best-effort (in-memory); combined with reports/hide it reduces abuse.
  try {
    const h = reporterHashFromRequest(req);
    const rl = checkRateLimit(`create:${type}:${h}`, 60_000, 2);
    if (!rl.ok) {
      const retrySec = Math.max(1, Math.ceil(rl.retryAfterMs / 1000));
      return NextResponse.json(
        { error: `Estas publicando muy rapido. Espera ${retrySec}s y reintenta.` },
        { status: 429, headers: { "retry-after": String(retrySec) } },
      );
    }
  } catch {
    // If fingerprinting isn't available, skip rate limiting.
  }

  if (type === "note") {
    if (!content) return badRequest("Escribi un mensaje.");
  } else {
    if (!title) return badRequest("Escribi un titulo.");
    if (!courseId) return badRequest("Selecciona una materia.");
    if (!attachmentUrl && !content) {
      return badRequest("Agrega un link o una descripcion.");
    }
  }

  const row = {
    type,
    author_name: authorName,
    content: content || null,
    title: title || null,
    course_id: courseId || null,
    attachment_url: attachmentUrl || null,
    attachment_name: attachmentName || null,
    delete_token_hash: null as string | null,
  };

  try {
    // Owner delete without accounts:
    // Create a random token, store its hash server-side, and return the raw token to the client.
    const deleteToken = crypto.randomBytes(24).toString("base64url");
    const pepper = process.env.REPORT_HASH_SALT || "pepper";
    row.delete_token_hash = crypto
      .createHash("sha256")
      .update(`${deleteToken}|${pepper}`)
      .digest("hex");

    const { data } = await supabaseRest<SharedPost[]>("/rest/v1/posts", {
      method: "POST",
      query: {
        // Avoid returning the token hash.
        select:
          "id,created_at,type,author_name,content,course_id,title,attachment_url,attachment_name,report_count,hidden,hidden_at",
      },
      body: row,
      prefer: "return=representation",
    });
    return NextResponse.json({ item: data?.[0] ?? null, deleteToken });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido.";
    return badRequest(msg, 500);
  }
}

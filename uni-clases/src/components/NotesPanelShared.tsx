"use client";

import { useEffect, useMemo, useState } from "react";
import { COURSES } from "@/lib/schedule";
import type { SharedPost } from "@/lib/shared-types";
import { loadSavedAuthorName, saveAuthorName } from "@/lib/prefs";
import Button from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Input, Label, Select, Textarea } from "./ui/Field";

function timeLabel(iso: string) {
  // Short + stable (avoids "p. m." wrapping/overflow on mobile).
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

function extractApiError(x: unknown): string | undefined {
  if (!x || typeof x !== "object") return undefined;
  const v = (x as Record<string, unknown>).error;
  return typeof v === "string" ? v : undefined;
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = extractApiError(data) || "Error desconocido.";
    throw new Error(String(msg));
  }
  return data as T;
}

const LS_DELETE_TOKENS = "uni_clases_delete_tokens_v1";
const MAX_AUTHOR = 60;
const MAX_TITLE = 90;
const MAX_DESC = 600;
const MAX_LINK = 350;

type SortMode = "new" | "old" | "reports";

function includesLoose(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function isValidHttpUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function loadDeleteTokens(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_DELETE_TOKENS);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveDeleteTokens(map: Record<string, string>) {
  localStorage.setItem(LS_DELETE_TOKENS, JSON.stringify(map));
}

export default function NotesPanelShared({
  onToast,
}: {
  onToast: (t: { title: string; description?: string; kind?: "info" | "ok" | "warn" | "danger" }) => void;
}) {
  const [items, setItems] = useState<SharedPost[]>([]);
  const [reported, setReported] = useState<SharedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportedOpen, setReportedOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, SharedPost>>({});
  const [deleteTokens, setDeleteTokens] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [authorName, setAuthorName] = useState("");
  const [courseId, setCourseId] = useState(COURSES[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [link, setLink] = useState("");
  const [q, setQ] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("");
  const [sortMode, setSortMode] = useState<SortMode>("new");

  const courseLabel = useMemo(() => {
    const c = COURSES.find((x) => x.id === courseId);
    return c?.name ?? "Materia";
  }, [courseId]);

  const countLabel = useMemo(() => `${items.length} item(s)`, [items.length]);
  const reportedLabel = useMemo(
    () => `Apuntes reportados (${reported.length})`,
    [reported.length],
  );

  async function refresh() {
    setLoading(true);
    try {
      const [vis, hid] = await Promise.all([
        apiJson<{ items: SharedPost[] }>("/api/posts?type=file&hidden=0&limit=200"),
        apiJson<{ items: SharedPost[] }>("/api/posts?type=file&hidden=1&limit=200"),
      ]);
      setItems(vis.items ?? []);
      setReported(hid.items ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      onToast({ title: "No se pudieron cargar apuntes", description: msg, kind: "danger" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setDeleteTokens(loadDeleteTokens());
    const saved = loadSavedAuthorName();
    if (saved) setAuthorName((v) => v || saved);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function publish() {
    const name = authorName.trim();
    if (!name) {
      onToast({ title: "Completa tu nombre y apellido", kind: "warn" });
      return;
    }
    if (name.length > MAX_AUTHOR) {
      onToast({ title: `Nombre demasiado largo (max ${MAX_AUTHOR}).`, kind: "warn" });
      return;
    }
    const t = title.trim() || `${courseLabel} · Apunte`;
    if (t.length > MAX_TITLE) {
      onToast({ title: `Titulo demasiado largo (max ${MAX_TITLE}).`, kind: "warn" });
      return;
    }
    const url = link.trim();
    const desc = details.trim();
    if (desc.length > MAX_DESC) {
      onToast({ title: `Descripcion demasiado larga (max ${MAX_DESC}).`, kind: "warn" });
      return;
    }
    if (url && url.length > MAX_LINK) {
      onToast({ title: `Link demasiado largo (max ${MAX_LINK}).`, kind: "warn" });
      return;
    }
    if (!url && !desc) {
      onToast({ title: "Agrega un link o una descripcion", kind: "warn" });
      return;
    }
    if (url && !isValidHttpUrl(url)) {
      onToast({ title: "Link invalido", description: "Usa http(s):// ...", kind: "warn" });
      return;
    }

    try {
      setPublishing(true);
      saveAuthorName(name);
      const res = await apiJson<{ item: SharedPost | null; deleteToken?: string }>(
        "/api/posts",
        {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "file",
          authorName: name,
          courseId,
          title: t,
          content: desc,
          attachmentUrl: url || undefined,
          attachmentName: url ? "Link" : undefined,
        }),
        },
      );

      if (res.item?.id && res.deleteToken) {
        const next = { ...loadDeleteTokens(), [res.item.id]: res.deleteToken };
        saveDeleteTokens(next);
        setDeleteTokens(next);
      }

      setTitle("");
      setDetails("");
      setLink("");
      onToast({ title: "Apunte publicado", description: t, kind: "ok" });
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      onToast({ title: "No se pudo publicar", description: msg, kind: "danger" });
    } finally {
      setPublishing(false);
    }
  }

  async function report(postId: string) {
    const ok = window.confirm("Reportar este apunte? Si llega a 5 reportes se oculta.");
    if (!ok) return;
    try {
      setBusyId(postId);
      const r = await apiJson<{ ok: boolean; inserted: boolean; reportCount: number; hidden: boolean }>(
        "/api/report",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ postId }),
        },
      );
      if (!r.inserted) {
        onToast({ title: "Ya lo reportaste", kind: "info" });
      } else if (r.hidden) {
        onToast({ title: "Contenido ocultado", description: "Se alcanzo el umbral de reportes.", kind: "warn" });
      } else {
        onToast({ title: "Reporte enviado", description: `Reportes: ${r.reportCount}/5`, kind: "ok" });
      }
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      onToast({ title: "No se pudo reportar", description: msg, kind: "danger" });
    } finally {
      setBusyId((cur) => (cur === postId ? null : cur));
    }
  }

  async function loadFull(id: string) {
    if (expanded[id]) return;
    try {
      setBusyId(id);
      const res = await apiJson<{ item: SharedPost }>("/api/posts/" + id);
      setExpanded((m) => ({ ...m, [id]: res.item }));
    } finally {
      setBusyId((cur) => (cur === id ? null : cur));
    }
  }

  async function removePost(id: string) {
    const token = deleteTokens[id];
    if (!token) {
      onToast({
        title: "No podes borrar este apunte",
        description: "Solo el creador (en este navegador) puede eliminarlo.",
        kind: "warn",
      });
      return;
    }
    const ok = window.confirm("Eliminar este apunte? Esta accion no se puede deshacer.");
    if (!ok) return;

    try {
      setBusyId(id);
      await apiJson<{ ok: boolean }>("/api/posts/" + id + "/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deleteToken: token }),
      });

      const next = { ...deleteTokens };
      delete next[id];
      saveDeleteTokens(next);
      setDeleteTokens(next);

      onToast({ title: "Apunte eliminado", kind: "info" });
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      onToast({ title: "No se pudo eliminar", description: msg, kind: "danger" });
    } finally {
      setBusyId((cur) => (cur === id ? null : cur));
    }
  }

  const visibleItems = useMemo(() => {
    const needle = q.trim();
    let arr = items.slice();

    if (filterCourse) arr = arr.filter((x) => (x.course_id ?? "") === filterCourse);

    if (needle) {
      arr = arr.filter((x) => {
        const course = COURSES.find((c) => c.id === x.course_id);
        return (
          includesLoose(x.title ?? "", needle) ||
          includesLoose(x.author_name ?? "", needle) ||
          includesLoose(x.content ?? "", needle) ||
          includesLoose(course?.name ?? "", needle)
        );
      });
    }

    if (sortMode === "old") {
      arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    } else if (sortMode === "reports") {
      arr.sort((a, b) => (b.report_count ?? 0) - (a.report_count ?? 0));
    } else {
      arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    return arr;
  }, [items, q, filterCourse, sortMode]);

  return (
    <Card className="u-noise" id="apuntes">
      <CardHeader
        title="Apuntes"
        subtitle="Recursos compartidos por link (Drive, YouTube, PDF, etc)."
        right={
          <div className="rounded-full border border-emerald-200/15 bg-emerald-200/10 px-3 py-1 text-xs text-white/80">
            {loading ? "Cargando..." : countLabel}
          </div>
        }
      />
      <CardBody>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-3">
              <div>
                <Label>Nombre y apellido</Label>
                <div className="mt-1">
                  <Input
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ej: Juan Perez"
                    maxLength={MAX_AUTHOR}
                  />
                </div>
              </div>
              <div>
                <Label>Materia</Label>
                <div className="mt-1">
                  <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                    {COURSES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label>Titulo</Label>
                <div className="mt-1">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`${courseLabel} · Resumen / Parciales / Guia`}
                    maxLength={MAX_TITLE}
                  />
                </div>
                <div className="mt-1 text-[11px] text-white/45">
                  {title.length}/{MAX_TITLE}
                </div>
              </div>
              <div>
                <Label>Link (opcional)</Label>
                <div className="mt-1">
                  <Input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://drive.google.com/... o https://youtube.com/..."
                    maxLength={MAX_LINK}
                  />
                </div>
                <div className="mt-1 text-[11px] text-white/45">
                  {link.length}/{MAX_LINK}
                </div>
              </div>
              <div>
                <Label>Descripcion (opcional)</Label>
                <div className="mt-1">
                  <Textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Que es, de que tema, para que parcial..."
                    maxLength={MAX_DESC}
                  />
                </div>
                <div className="mt-1 text-[11px] text-white/45">
                  {details.length}/{MAX_DESC}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="button" tone="ok" onClick={() => void publish()} disabled={publishing}>
                  {publishing ? "Publicando..." : "Publicar apunte"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => void refresh()} disabled={loading || publishing}>
                  {loading ? "Cargando..." : "Recargar"}
                </Button>
              </div>
              <div className="text-xs text-white/55">
                Consejo: sube recursos por link. Mas adelante podemos sumar Storage para subir archivos directo.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Ultimos apuntes</div>
            <div className="mt-1 text-xs text-white/55">
              Solo se muestran los no reportados (los reportados quedan abajo).
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por titulo, autor, materia..."
                className="h-10 text-sm"
              />
              <div className="flex items-center gap-2">
                <Select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="h-10 text-sm"
                  aria-label="Filtrar por materia"
                >
                  <option value="">Todas</option>
                  {COURSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="h-10 text-sm"
                  aria-label="Ordenar"
                >
                  <option value="new">Recientes</option>
                  <option value="old">Mas antiguos</option>
                  <option value="reports">Mas reportados</option>
                </Select>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                  Cargando...
                </div>
              ) : visibleItems.length ? (
                visibleItems.map((n) => {
                  const course = COURSES.find((c) => c.id === n.course_id);
                  const busy = busyId === n.id;
                  return (
                    <div
                      key={n.id}
                      className="rounded-2xl border border-emerald-200/12 bg-emerald-200/8 p-4 overflow-hidden"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-white">
                            {n.title ?? "Apunte"}
                          </div>
                          <div className="mt-1 truncate text-xs text-white/60">
                            {course?.name ?? "Materia"} · {n.author_name}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/55 sm:text-xs">
                            <span className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-white/6 px-2 py-0.5 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
                              {timeLabel(n.created_at)}
                            </span>
                            <span className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-white/6 px-2 py-0.5 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
                              Rep {n.report_count}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                          {n.attachment_url ? (
                            <Button
                              size="sm"
                              tone="accent"
                              variant="solid"
                              className="w-full sm:w-auto"
                              onClick={() => {
                                window.open(n.attachment_url!, "_blank", "noopener,noreferrer");
                              }}
                              disabled={busy}
                            >
                              Abrir link
                            </Button>
                          ) : null}
                          {deleteTokens[n.id] ? (
                            <Button
                              size="sm"
                              variant="soft"
                              tone="danger"
                              className="w-full sm:w-auto"
                              onClick={() => void removePost(n.id)}
                              disabled={busy}
                            >
                              {busy ? "Eliminando..." : "Eliminar"}
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="soft"
                            tone="danger"
                            className="w-full sm:w-auto"
                            onClick={() => void report(n.id)}
                            disabled={busy}
                          >
                            {busy ? "Enviando..." : "Reportar"}
                          </Button>
                        </div>
                      </div>
                      {n.content ? (
                        <div className="mt-3 break-words text-sm text-white/70">{n.content}</div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                  Todavia no hay apuntes. Publica el primero.
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="inline-flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/10"
                onClick={() => setReportedOpen((v) => !v)}
              >
                <span>{reportedLabel}</span>
                <span className="text-xs text-white/55">{reportedOpen ? "Ocultar" : "Ver"}</span>
              </button>

              {reportedOpen ? (
                <div className="mt-2 space-y-2">
                  {reported.length ? (
                    reported.map((p) => {
                      const full = expanded[p.id];
                      const course = COURSES.find((c) => c.id === p.course_id);
                      return (
                        <div
                          key={p.id}
                          className="rounded-2xl border border-amber-200/15 bg-amber-200/8 p-4 overflow-hidden"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="truncate font-medium text-white">
                                {p.title ?? "Apunte"}
                              </div>
                              <div className="mt-1 break-words text-[11px] text-white/55 sm:text-xs">
                                {course?.name ?? "Materia"} · {p.author_name} · {timeLabel(p.created_at)} · Reportes: {p.report_count}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="soft"
                              tone="warn"
                              className="w-full sm:w-auto"
                              onClick={() => void loadFull(p.id)}
                              disabled={busyId === p.id}
                            >
                              {busyId === p.id ? "Cargando..." : "Ver contenido"}
                            </Button>
                          </div>

                          {full ? (
                            <div className="mt-3 space-y-2">
                              {full.attachment_url ? (
                                <Button
                                  size="sm"
                                  variant="solid"
                                  tone="accent"
                                  className="w-full sm:w-auto"
                                  onClick={() => {
                                    window.open(full.attachment_url!, "_blank", "noopener,noreferrer");
                                  }}
                                >
                                  Abrir link
                                </Button>
                              ) : null}
                              {full.content ? (
                                <div className="text-sm text-white/75">{full.content}</div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                      No hay apuntes reportados.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

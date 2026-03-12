"use client";

import { useEffect, useMemo, useState } from "react";
import type { SharedPost } from "@/lib/shared-types";
import Button from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Input, Label, Textarea } from "./ui/Field";

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
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

export default function GuestbookPanelShared({
  onToast,
}: {
  onToast: (t: { title: string; description?: string; kind?: "info" | "ok" | "warn" | "danger" }) => void;
}) {
  const [messages, setMessages] = useState<SharedPost[]>([]);
  const [reported, setReported] = useState<SharedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportedOpen, setReportedOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, SharedPost>>({});
  const [deleteTokens, setDeleteTokens] = useState<Record<string, string>>({});

  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");

  const countLabel = useMemo(() => `${messages.length} mensaje(s)`, [messages.length]);
  const reportedLabel = useMemo(
    () => `Notas reportadas (${reported.length})`,
    [reported.length],
  );

  async function refresh() {
    setLoading(true);
    try {
      const [vis, hid] = await Promise.all([
        apiJson<{ items: SharedPost[] }>("/api/posts?type=note&hidden=0&limit=200"),
        apiJson<{ items: SharedPost[] }>("/api/posts?type=note&hidden=1&limit=200"),
      ]);
      setMessages(vis.items ?? []);
      setReported(hid.items ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      onToast({ title: "No se pudo cargar el muro", description: msg, kind: "danger" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setDeleteTokens(loadDeleteTokens());
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function publish() {
    const name = authorName.trim();
    const msg = message.trim();
    if (!name) {
      onToast({ title: "Completa tu nombre y apellido", kind: "warn" });
      return;
    }
    if (!msg) {
      onToast({ title: "Escribi un mensaje", kind: "warn" });
      return;
    }
    try {
      const res = await apiJson<{ item: SharedPost | null; deleteToken?: string }>(
        "/api/posts",
        {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "note", authorName: name, content: msg }),
        },
      );

      if (res.item?.id && res.deleteToken) {
        const next = { ...loadDeleteTokens(), [res.item.id]: res.deleteToken };
        saveDeleteTokens(next);
        setDeleteTokens(next);
      }
      setMessage("");
      onToast({ title: "Mensaje publicado", kind: "ok" });
      await refresh();
    } catch (e) {
      const msg2 = e instanceof Error ? e.message : "Error desconocido.";
      onToast({ title: "No se pudo publicar", description: msg2, kind: "danger" });
    }
  }

  async function removePost(id: string) {
    const token = deleteTokens[id];
    if (!token) {
      onToast({
        title: "No podes borrar este mensaje",
        description: "Solo el creador (en este navegador) puede eliminarlo.",
        kind: "warn",
      });
      return;
    }
    const ok = window.confirm("Eliminar este mensaje? Esta accion no se puede deshacer.");
    if (!ok) return;

    try {
      await apiJson<{ ok: boolean }>("/api/posts/" + id + "/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deleteToken: token }),
      });

      const next = { ...deleteTokens };
      delete next[id];
      saveDeleteTokens(next);
      setDeleteTokens(next);

      onToast({ title: "Mensaje eliminado", kind: "info" });
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido.";
      onToast({ title: "No se pudo eliminar", description: msg, kind: "danger" });
    }
  }

  async function report(postId: string) {
    const ok = window.confirm("Reportar este contenido? Si llega a 5 reportes se oculta.");
    if (!ok) return;
    try {
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
    }
  }

  async function loadFull(id: string) {
    if (expanded[id]) return;
    const res = await apiJson<{ item: SharedPost }>("/api/posts/" + id);
    setExpanded((m) => ({ ...m, [id]: res.item }));
  }

  return (
    <Card className="u-noise" id="muro">
      <CardHeader
        title="Muro"
        subtitle="Mensajes compartidos (sin login). Usa Reportar para ocultar spam."
        right={
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
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
                    placeholder="Ej: Valentina Ruiz"
                  />
                </div>
              </div>
              <div>
                <Label>Mensaje</Label>
                <div className="mt-1">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Pregunta, aviso, recurso, link..."
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="button" tone="accent" onClick={() => void publish()}>
                  Publicar
                </Button>
                <Button type="button" variant="ghost" onClick={() => void refresh()}>
                  Recargar
                </Button>
              </div>
              <div className="text-xs text-white/55">
                Tip: si ves spam, usa Reportar. Al llegar a 5 reportes se oculta del muro.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Mensajes recientes</div>
            <div className="mt-1 text-xs text-white/55">
              Solo se muestran los no reportados (los reportados quedan abajo).
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                  Cargando...
                </div>
              ) : messages.length ? (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className="relative rounded-2xl border border-white/10 bg-white/6 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white">{m.author_name}</div>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-white/75">
                          {m.content}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-white/55">
                        {timeLabel(m.created_at)}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-white/55">Reportes: {m.report_count}</div>
                      <div className="flex items-center gap-2">
                        {deleteTokens[m.id] ? (
                          <Button
                            size="sm"
                            variant="soft"
                            tone="danger"
                            onClick={() => void removePost(m.id)}
                          >
                            Eliminar
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="soft"
                          tone="danger"
                          onClick={() => void report(m.id)}
                        >
                          Reportar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                  Todavia no hay mensajes.
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
                      return (
                        <div
                          key={p.id}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-medium text-white">
                                {p.author_name}
                              </div>
                              <div className="mt-1 text-xs text-white/55">
                                {timeLabel(p.created_at)} · Reportes: {p.report_count}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {deleteTokens[p.id] ? (
                                <Button
                                  size="sm"
                                  variant="soft"
                                  tone="danger"
                                  onClick={() => void removePost(p.id)}
                                >
                                  Eliminar
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="soft"
                                tone="warn"
                                onClick={() => void loadFull(p.id)}
                              >
                                Ver contenido
                              </Button>
                            </div>
                          </div>

                          {full?.content ? (
                            <div className="mt-3 whitespace-pre-wrap text-sm text-white/75">
                              {full.content}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                      No hay notas reportadas.
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

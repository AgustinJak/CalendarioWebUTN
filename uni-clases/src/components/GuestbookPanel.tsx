"use client";

import { useEffect, useMemo, useState } from "react";
import type { GuestMessage } from "@/lib/types";
import { randomId, safeJsonParse } from "@/lib/storage";
import { loadSavedAuthorName, saveAuthorName } from "@/lib/prefs";
import Button from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Input, Label, Select, Textarea } from "./ui/Field";

const LS_KEY = "uni_clases_guestbook_v1";
const MAX_AUTHOR = 60;
const MAX_MSG = 700;

type SortMode = "new" | "old";

function includesLoose(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function loadMessages() {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(LS_KEY);
  const parsed = safeJsonParse<GuestMessage[]>(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function saveMessages(messages: GuestMessage[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(messages.slice(0, 200)));
}

function timeLabel(ts: number) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

export default function GuestbookPanel({
  onToast,
}: {
  onToast: (t: { title: string; description?: string; kind?: "info" | "ok" | "warn" | "danger" }) => void;
}) {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [q, setQ] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("new");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(loadMessages());
    const saved = loadSavedAuthorName();
    if (saved) setAuthorName((v) => v || saved);
  }, []);

  const countLabel = useMemo(() => `${messages.length} mensaje(s)`, [messages.length]);

  const visibleMessages = useMemo(() => {
    const needle = q.trim();
    let arr = messages.slice();
    if (needle) {
      arr = arr.filter(
        (m) => includesLoose(m.authorName ?? "", needle) || includesLoose(m.message ?? "", needle),
      );
    }
    if (sortMode === "old") arr.sort((a, b) => a.createdAt - b.createdAt);
    else arr.sort((a, b) => b.createdAt - a.createdAt);
    return arr;
  }, [messages, q, sortMode]);

  function publish() {
    const name = authorName.trim();
    const msg = message.trim();
    if (!name) {
      onToast({ title: "Completa tu nombre y apellido", kind: "warn" });
      return;
    }
    if (name.length > MAX_AUTHOR) {
      onToast({ title: `Nombre demasiado largo (max ${MAX_AUTHOR}).`, kind: "warn" });
      return;
    }
    if (!msg) {
      onToast({ title: "Escribi un mensaje", kind: "warn" });
      return;
    }
    if (msg.length > MAX_MSG) {
      onToast({ title: `Mensaje demasiado largo (max ${MAX_MSG}).`, kind: "warn" });
      return;
    }
    saveAuthorName(name);
    const next: GuestMessage = {
      id: randomId("msg"),
      createdAt: Date.now(),
      authorName: name,
      message: msg,
    };
    const updated = [next, ...messages].slice(0, 200);
    setMessages(updated);
    saveMessages(updated);
    setMessage("");
    onToast({ title: "Mensaje publicado", kind: "ok" });
  }

  function removeMessage(messageId: string) {
    const updated = messages.filter((m) => m.id !== messageId);
    setMessages(updated);
    saveMessages(updated);
    onToast({ title: "Mensaje eliminado", kind: "info" });
  }

  return (
    <Card className="u-noise" id="muro">
      <CardHeader
        title="Muro"
        subtitle="Deja mensajes sin loguearte (solo nombre y apellido)"
        right={
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
            {countLabel}
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
                    maxLength={MAX_AUTHOR}
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
                    maxLength={MAX_MSG}
                  />
                </div>
                <div className="mt-1 text-[11px] text-white/45">
                  {message.length}/{MAX_MSG}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button type="button" tone="accent" onClick={publish}>
                  Publicar
                </Button>
              </div>
              <div className="text-xs text-white/55">
                Nota: sin backend, los mensajes se guardan localmente. Luego lo
                hacemos multiusuario con una DB (Supabase/Neon).
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium text-white">Mensajes recientes</div>
            <div className="mt-1 text-xs text-white/55">
              Tip: podes fijar avisos importantes arriba mas adelante.
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nombre o contenido..."
                  className="h-10 text-sm"
                />
                <Select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="h-10 text-sm sm:w-56"
                  aria-label="Ordenar"
                >
                  <option value="new">Recientes</option>
                  <option value="old">Mas antiguos</option>
                </Select>
              </div>

              {visibleMessages.length ? (
                visibleMessages.map((m) => (
                  <div
                    key={m.id}
                    className="relative rounded-2xl border border-white/10 bg-white/6 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white">
                          {m.authorName}
                        </div>
                        <div className="mt-2 whitespace-pre-wrap break-words text-sm text-white/75">
                          {m.message}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-white/55">
                        {timeLabel(m.createdAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/35"
                      aria-label="Eliminar mensaje"
                      title="Eliminar"
                      onClick={() => {
                        const ok = window.confirm("Eliminar este mensaje?");
                        if (!ok) return;
                        removeMessage(m.id);
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                  Todavia no hay mensajes. Usa el muro para avisos rapidos: links
                  de clase, cambio de horario, recordatorios.
                </div>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";
import CalendarMonth from "@/components/CalendarMonth";
import GuestbookPanel from "@/components/GuestbookPanel";
import GuestbookPanelShared from "@/components/GuestbookPanelShared";
import NotesPanel from "@/components/NotesPanel";
import NotesPanelShared from "@/components/NotesPanelShared";
import ToastStack from "@/components/ToastStack";
import TodayPanel from "@/components/TodayPanel";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { addDays, formatDateShort, formatTime, minutesBetween } from "@/lib/date";
import { sessionsForRange } from "@/lib/schedule";
import type { Session } from "@/lib/types";
import { useHydrated } from "@/hooks/useHydrated";
import { useNow } from "@/hooks/useNow";
import { useToasts } from "@/hooks/useToasts";
import {
  hasNotificationSupport,
  requestNotificationPermission,
  useClassAlerts,
} from "@/hooks/useClassAlerts";

function permissionLabel(p: string) {
  if (p === "checking") return "cargando";
  if (p === "granted") return "activadas";
  if (p === "denied") return "bloqueadas";
  if (p === "default") return "sin permiso";
  return "no soportado";
}

function etaLabel(totalMinutes: number) {
  if (totalMinutes <= 0) return "hoy";
  if (totalMinutes < 60) return `en ${totalMinutes} min`;
  const hours = Math.round(totalMinutes / 60);
  if (hours < 24) return `en ${hours} h`;
  const days = Math.round(hours / 24);
  return `en ${days} d`;
}

export default function ClientApp({
  googleClientId,
  sharedEnabled,
}: {
  googleClientId: string | null;
  sharedEnabled: boolean;
}) {
  const hydrated = useHydrated();

  // Avoid hydration mismatches caused by time/locale-dependent rendering (Intl, Date, etc).
  // SSR and the first client render return the same stable skeleton; the real app mounts after hydration.
  if (!hydrated) {
    return <div className="min-h-screen" />;
  }

  return <ClientAppInner googleClientId={googleClientId} sharedEnabled={sharedEnabled} />;
}

function ClientAppInner({
  googleClientId,
  sharedEnabled,
}: {
  googleClientId: string | null;
  sharedEnabled: boolean;
}) {
  const now = useNow(25_000);
  const { toasts, push, dismiss } = useToasts();
  const [selected, setSelected] = useState<Session | null>(null);
  const [avatarSrc, setAvatarSrc] = useState("https://i.imgur.com/bfQfao1.png");

  const [browserNotifs, setBrowserNotifs] = useState(false);
  const [permission, setPermission] = useState<
    "checking" | "unsupported" | NotificationPermission
  >(() => {
    if (!hasNotificationSupport()) return "unsupported";
    // This component only mounts after hydration; Notification is safe here.
    return typeof Notification !== "undefined" ? Notification.permission : "unsupported";
  });

  useClassAlerts({
    now,
    pushToast: push,
    enableBrowserNotifications: browserNotifs && permission === "granted",
  });

  const soon = useMemo(() => {
    const sessions = sessionsForRange(now, addDays(now, 7));
    return sessions.slice(0, 6);
  }, [now]);

  const notifSupported = hasNotificationSupport();

  function scrollToActions() {
    // Wait a tick so the selected session renders the actions block.
    window.setTimeout(() => {
      document.getElementById("acciones")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function shouldAutoScrollToActions() {
    // Desktop: keep context (no jump). Mobile: bring actions into view.
    return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-28 sm:pb-10">
        <section className="u-fade-up">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/6 p-7 shadow-[0_18px_70px_-40px_var(--shadow)] backdrop-blur u-noise">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "var(--accent)" }}
                  aria-hidden="true"
                />
                Portal rapido
              </div>
              <h1 className="mt-4 font-serif text-[34px] leading-[1.05] tracking-tight text-white">
                Tu calendario de clases en vivo, con alertas y recursos en un
                solo lugar.
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/70">
                Consulta el cronograma semanal, mira que clase viene despues y
                entra al aula virtual con un click. Tambien podes guardar
                apuntes y mensajes (por ahora, local en tu dispositivo).
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <a href="#calendario">
                  <Button tone="accent" type="button">
                    Abrir calendario
                  </Button>
                </a>
                <a href="#apuntes">
                  <Button variant="soft" type="button">
                    Subir apuntes
                  </Button>
                </a>
                <a href="#muro">
                  <Button variant="ghost" type="button">
                    Ir al muro
                  </Button>
                </a>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[240px_1fr] md:items-end">
                <a
                  href="https://github.com/AgustinJak"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/7"
                  aria-label="Aguspium en GitHub"
                >
                  <div className="aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-white/4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarSrc}
                      alt="Agustin J."
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      onError={() => setAvatarSrc("/aguspium-avatar.svg")}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-sm font-semibold text-white">
                      Agustin J.
                    </div>
                    <div className="text-xs text-white/55">Aguspium</div>
                  </div>
                </a>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white">
                    Tecnologias
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-white/75">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] text-white/80">
                        N
                      </span>
                      Next.js
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-white/75">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                        className="text-[color:var(--accent)]"
                      >
                        <circle cx="12" cy="12" r="2.5" />
                        <path d="M20.5 12c0-2.1-3.8-3.8-8.5-3.8S3.5 9.9 3.5 12s3.8 3.8 8.5 3.8 8.5-1.7 8.5-3.8Z" />
                        <path d="M16.2 5.6c-1.8-1.1-4.8 1.6-6.8 6s-2.2 8.3-.4 9.4c1.8 1.1 4.8-1.6 6.8-6s2.2-8.3.4-9.4Z" />
                        <path d="M7.8 5.6c1.8-1.1 4.8 1.6 6.8 6s2.2 8.3.4 9.4c-1.8 1.1-4.8-1.6-6.8-6s-2.2-8.3-.4-9.4Z" />
                      </svg>
                      React
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-white/75">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#3178c6]/30 text-[10px] font-bold text-white/90">
                        TS
                      </span>
                      TypeScript
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-white/75">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        aria-hidden="true"
                        className="text-[color:var(--accent2)]"
                      >
                        <path d="M4 14c2.3 0 2.3-4 4.6-4S11 14 13.4 14s2.3-4 4.6-4 2.3 4 4.6 4" />
                      </svg>
                      Tailwind
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-white/75">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="text-white/80"
                      >
                        <path d="M20 7H4" />
                        <path d="M20 12H4" />
                        <path d="M20 17H4" />
                        <path d="M7 7v10" />
                      </svg>
                      IndexedDB
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-white/75">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="text-white/80"
                      >
                        <path d="M20 7H4v10h16V7Z" />
                        <path d="M8 11h8" />
                      </svg>
                      localStorage
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Card className="u-fade-up" style={{ animationDelay: "80ms" }}>
              <CardHeader
                title="Alertas"
                subtitle="En vivo, en menos de 1 hora y resumen del dia"
                right={
                  <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
                    {permissionLabel(permission)}
                  </div>
                }
              />
              <CardBody>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <div className="text-sm font-medium text-white">
                    Estado ahora
                  </div>
                  <div className="mt-1 text-xs text-white/55">
                    Las alertas aparecen como toasts arriba a la derecha.
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="soft"
                      tone="accent"
                      disabled={!notifSupported}
                      onClick={() => {
                        void (async () => {
                          const res = await requestNotificationPermission();
                          setPermission(res);
                          if (res === "granted") {
                            setBrowserNotifs(true);
                            push({
                              title: "Notificaciones activadas",
                              description: "El navegador puede mostrar alertas.",
                              kind: "ok",
                            });
                          } else {
                            push({
                              title: "No se pudo activar",
                              description:
                                res === "denied"
                                  ? "Estan bloqueadas en el navegador."
                                  : "Permiso no concedido.",
                              kind: "warn",
                            });
                          }
                        })();
                      }}
                    >
                      Habilitar notificaciones
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setBrowserNotifs(false);
                        push({
                          title: "Solo toasts",
                          description: "Alertas dentro del sitio.",
                          kind: "info",
                        });
                      }}
                    >
                      Solo toasts
                    </Button>
                  </div>
                  {!notifSupported ? (
                    <div className="mt-3 text-xs text-white/55">
                      Este navegador no soporta la API de notificaciones.
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-4">
                  <div className="text-sm font-medium text-white">
                    Proximas (7 dias)
                  </div>
                  <div className="mt-3 space-y-2">
                    {soon.length ? (
                      soon.map((s) => {
                        const mins = minutesBetween(now, s.start);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            className="w-full rounded-xl border border-white/10 bg-white/6 p-3 text-left transition hover:bg-white/9"
                            onClick={() => {
                              setSelected(s);
                              scrollToActions();
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-white">
                                  {s.title}
                                </div>
                                <div className="mt-1 text-xs text-white/60">
                                  {formatDateShort(s.start)} · {formatTime(s.start)}
                                </div>
                              </div>
                              <div className="shrink-0 text-right text-xs text-white/60">
                                {etaLabel(mins)}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-white/55">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ background: s.color }}
                                aria-hidden="true"
                              />
                              Click para acciones
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                        No hay clases cargadas para la proxima semana.
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="u-fade-up" style={{ animationDelay: "120ms" }}>
            <TodayPanel now={now} selected={selected} onSelect={setSelected} />
          </div>
          <div className="u-fade-up" style={{ animationDelay: "160ms" }}>
            <CalendarMonth
              initialMonth={now}
              onPickSession={(s) => {
                setSelected(s);
                if (shouldAutoScrollToActions()) scrollToActions();
              }}
              onToast={push}
              googleClientId={googleClientId}
            />
          </div>
        </section>

        <section className="mt-8 space-y-6">
          <div className="u-fade-up" style={{ animationDelay: "200ms" }}>
            {sharedEnabled ? <NotesPanelShared onToast={push} /> : <NotesPanel onToast={push} />}
          </div>
          <div className="u-fade-up" style={{ animationDelay: "240ms" }}>
            {sharedEnabled ? (
              <GuestbookPanelShared onToast={push} />
            ) : (
              <GuestbookPanel onToast={push} />
            )}
          </div>
        </section>

        <footer className="mt-10 pb-6 text-center text-xs text-white/45">
          <div className="flex flex-col items-center justify-center gap-3">
            <div>Creado por Agustin J. (Aguspium)</div>
            <div className="flex items-center gap-2">
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-[12px] text-white/75 transition hover:bg-white/10 hover:text-white"
                href="https://github.com/AgustinJak"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="GitHub"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.77.6-3.35-1.34-3.35-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.05 1.53 1.05.9 1.54 2.36 1.1 2.94.84.09-.66.35-1.1.63-1.35-2.21-.26-4.54-1.11-4.54-4.93 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.9-1.29 2.75-1.02 2.75-1.02.55 1.42.2 2.46.1 2.72.64.7 1.03 1.59 1.03 2.68 0 3.83-2.33 4.67-4.55 4.92.36.31.68.93.68 1.88v2.79c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
                </svg>
                GitHub
              </a>
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-[12px] text-white/75 transition hover:bg-white/10 hover:text-white"
                href="https://www.linkedin.com/in/agustin-jaksetic-56907a24a/"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="LinkedIn"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-.95 1.84-1.95 3.78-1.95C21.4 8.69 22 11 22 14v7h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V21h-4V9Z" />
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </footer>
      </main>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

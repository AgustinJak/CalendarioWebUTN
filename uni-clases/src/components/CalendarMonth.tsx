"use client";

import { useMemo, useState } from "react";
import {
  dateKey,
  endOfMonth,
  formatDateLong,
  formatTime,
  monthGrid,
  monthLabel,
  sameDay,
  startOfDay,
  startOfMonth,
} from "@/lib/date";
import { sessionsForMonth } from "@/lib/schedule";
import type { Session } from "@/lib/types";
import { syncSessionsToGoogleCalendar } from "@/lib/google-calendar";
import { useGoogleToken } from "@/hooks/useGoogleToken";
import Button from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { cx } from "./ui/cx";

function byDayMap(sessions: Session[]) {
  const m = new Map<string, Session[]>();
  for (const s of sessions) {
    const k = dateKey(s.start);
    const arr = m.get(k) ?? [];
    arr.push(s);
    m.set(k, arr);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => a.start.getTime() - b.start.getTime());
  }
  return m;
}

export default function CalendarMonth({
  initialMonth,
  onPickSession,
  onToast,
  googleClientId,
}: {
  initialMonth?: Date;
  onPickSession?: (session: Session) => void;
  onToast?: (t: {
    title: string;
    description?: string;
    kind?: "info" | "ok" | "warn" | "danger";
    actionLabel?: string;
    onAction?: () => void;
    ttlMs?: number;
  }) => void;
  googleClientId?: string | null;
}) {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => startOfDay(initialMonth ?? today));
  const [selected, setSelected] = useState(() => startOfDay(today));

  const sessions = useMemo(() => sessionsForMonth(month), [month]);
  const sessionsByDay = useMemo(() => byDayMap(sessions), [sessions]);
  const weeks = useMemo(() => monthGrid(month), [month]);

  const selectedKey = dateKey(selected);
  const selectedSessions = sessionsByDay.get(selectedKey) ?? [];

  const dow = ["L", "M", "X", "J", "V", "S", "D"];

  const { requestToken } = useGoogleToken(googleClientId ?? undefined);

  function openGoogleCalendar() {
    return window.open(
      "https://calendar.google.com/calendar/u/0/r",
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function syncMonthToGoogle() {
    try {
      if (!googleClientId) {
        onToast?.({
          title: "Falta configurar Google",
          description: "Setea NEXT_PUBLIC_GOOGLE_CLIENT_ID para sincronizar.",
          kind: "warn",
          ttlMs: 6000,
        });
        return;
      }

      onToast?.({
        title: "Conectando con Google...",
        description: "Se abrira una ventana para autorizar si hace falta.",
        kind: "info",
        ttlMs: 4500,
      });

      const token = await requestToken();
      const rangeStart = startOfMonth(month);
      const rangeEnd = endOfMonth(month);
      const timeZone = "America/Argentina/Buenos_Aires";

      const { inserted, skipped } = await syncSessionsToGoogleCalendar({
        sessions,
        accessToken: token,
        timeZone,
        rangeStart,
        rangeEnd,
      });

      const successDesc = `Agregadas: ${inserted} · Ya existian: ${skipped}. Abrimos Google Calendar en 3s.`;
      onToast?.({
        title: "Google Calendar actualizado",
        description: successDesc,
        kind: "ok",
        actionLabel: "Abrir ahora",
        onAction: () => {
          const w = openGoogleCalendar();
          if (!w) {
            onToast?.({
              title: "Pop-up bloqueado",
              description: "Permiti ventanas emergentes para abrir Google Calendar.",
              kind: "warn",
              ttlMs: 7000,
            });
          }
        },
        ttlMs: 9000,
      });

      // Nota: algunos navegadores bloquean popups si no es un gesto directo.
      window.setTimeout(() => {
        const w = openGoogleCalendar();
        if (!w) {
          onToast?.({
            title: "No se pudo abrir Google Calendar",
            description:
              "Tu navegador bloqueo la pestaña. Usa 'Abrir ahora' o habilita popups.",
            kind: "warn",
            actionLabel: "Abrir ahora",
            onAction: () => void openGoogleCalendar(),
            ttlMs: 9000,
          });
        }
      }, 3000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      onToast?.({
        title: "No se pudo sincronizar",
        description: msg,
        kind: "danger",
        ttlMs: 9000,
      });
    }
  }

  return (
    <Card className="u-noise" id="calendario">
      <CardHeader
        title={<span className="capitalize">{monthLabel(month)}</span>}
        subtitle="Clases en vivo (semanal)"
        right={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
              }
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() =>
                setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
              }
            >
              Siguiente
            </Button>
            <Button
              size="sm"
              variant="soft"
              tone="accent"
              type="button"
              onClick={() => void syncMonthToGoogle()}
              disabled={!googleClientId}
            >
              Cargar mes a Google Calendar
            </Button>
          </div>
        }
      />
      <CardBody>
        <div className="grid gap-5 md:gap-6 xl:grid-cols-[minmax(520px,1fr)_340px] xl:gap-6 2xl:grid-cols-[minmax(560px,1fr)_360px]">
          <div>
            <div className="grid grid-cols-7 gap-2 text-[11px] text-white/55 md:gap-3 md:text-xs">
              {dow.map((d) => (
                <div key={d} className="px-1 py-1 text-center">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2 md:gap-3">
              {weeks.flat().map((day) => {
                const inMonth = day.getMonth() === month.getMonth();
                const isToday = sameDay(day, today);
                const isSelected = sameDay(day, selected);
                const daySessions = sessionsByDay.get(dateKey(day)) ?? [];

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelected(startOfDay(day))}
                    className={cx(
                      "group relative flex aspect-square flex-col justify-between rounded-xl border p-2 text-left outline-none transition md:rounded-2xl md:p-3",
                      inMonth
                        ? "border-white/10 bg-white/5 hover:bg-white/8"
                        : "border-white/6 bg-white/3 opacity-70 hover:opacity-100",
                      isToday
                        ? "!border-rose-200/95 !bg-rose-500/45 shadow-[0_0_0_1px_rgba(251,113,133,0.28),0_22px_70px_-44px_rgba(251,113,133,0.8)] hover:!bg-rose-500/50"
                        : "",
                      isSelected ? "ring-2 ring-[color:var(--accent)]/35" : "",
                    )}
                    aria-current={isToday ? "date" : undefined}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={cx(
                          "text-sm font-medium tabular-nums",
                          inMonth ? "text-white" : "text-white/75",
                        )}
                      >
                        {day.getDate()}
                      </div>
                      {isToday ? (
                        <div
                          className="h-1.5 w-1.5 rounded-full bg-rose-300"
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {daySessions.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: s.color }}
                          aria-hidden="true"
                        />
                      ))}
                      {daySessions.length > 3 ? (
                        <span className="text-[11px] text-white/55">
                          +{daySessions.length - 3}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
            <div className="text-sm font-medium capitalize text-white">
              {formatDateLong(selected)}
            </div>
            <div className="mt-1 text-xs text-white/55">
              {selectedSessions.length
                ? `${selectedSessions.length} clase(s) programada(s)`
                : "Sin clases"}
            </div>

            <div className="mt-3 space-y-2">
              {selectedSessions.length ? (
                selectedSessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full rounded-xl border border-white/10 bg-white/6 p-3 text-left transition hover:bg-white/9"
                    onClick={() => onPickSession?.(s)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">
                          {s.title}
                        </div>
                        <div className="mt-1 truncate text-xs text-white/60">
                          {s.professor}
                          {s.room ? ` · ${s.room}` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-white/70">
                        <div>{formatTime(s.start)}</div>
                        <div className="text-white/50">{formatTime(s.end)}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: s.color }}
                      />
                      <span className="text-xs text-white/60">
                        Click para ver acciones
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                  Usa el calendario para ver tus clases. Cuando definamos las
                  materias reales, esto se conecta a una base de datos.
                </div>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

"use client";

import { useMemo } from "react";
import { addDays, formatDateLong, formatTime, minutesBetween, startOfDay } from "@/lib/date";
import { sessionsForRange } from "@/lib/schedule";
import type { Session } from "@/lib/types";
import Button from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";

function formatDateNumericShort(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function getStatus(now: Date, s: Session) {
  if (now >= s.start && now <= s.end) return { label: "En vivo ahora", tone: "ok" as const };
  if (now < s.start) {
    const mins = minutesBetween(now, s.start);
    if (mins <= 60) return { label: `Empieza en ${mins} min`, tone: "warn" as const };
    return { label: `En ${Math.round(mins / 60)} h`, tone: "info" as const };
  }
  return { label: "Finalizada", tone: "neutral" as const };
}

function tonePill(tone: "ok" | "warn" | "info" | "neutral") {
  if (tone === "ok") return "border-emerald-200/20 bg-emerald-200/10 text-emerald-50";
  if (tone === "warn") return "border-amber-200/20 bg-amber-200/10 text-amber-50";
  if (tone === "info") return "border-white/12 bg-white/8 text-white";
  return "border-white/10 bg-white/6 text-white/80";
}

export default function TodayPanel({
  now,
  selected,
  onSelect,
}: {
  now: Date;
  selected: Session | null;
  onSelect: (s: Session | null) => void;
}) {
  const upcoming = useMemo(() => {
    const from = new Date(now.getTime() - 10 * 60 * 1000);
    const to = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    return sessionsForRange(from, to);
  }, [now]);

  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);
  // "Hoy" debe mostrar el dia completo (aunque la clase ya haya terminado).
  const todaySessions = useMemo(
    () => sessionsForRange(todayStart, todayEnd),
    [todayStart, todayEnd],
  );
  const todayRemaining = useMemo(
    () => todaySessions.filter((s) => s.end > now),
    [todaySessions, now],
  );

  const nextSession = useMemo(() => {
    for (const s of upcoming) {
      if (now <= s.end) return s;
    }
    return null;
  }, [upcoming, now]);

  const focus = selected ?? nextSession;
  const focusStatus = focus ? getStatus(now, focus) : null;

  const joinUrl = focus?.liveUrl ?? "";

  const todaySubtitle =
    todaySessions.length === 0
      ? "Hoy no hay clases programadas"
      : todayRemaining.length === 0
        ? `Hoy hubo ${todaySessions.length} clase(s) (ya finalizaron)`
        : `Hoy tenes ${todaySessions.length} clase(s) · Quedan ${todayRemaining.length}`;

  return (
    <div className="space-y-4">
      <Card className="u-noise">
        <CardHeader
          title={
            <span className="capitalize">
              {formatDateLong(now)} · {formatTime(now)}
            </span>
          }
          subtitle={todaySubtitle}
          right={
            nextSession ? (
              <div className="hidden text-right md:block">
                <div className="text-xs text-white/55">Proxima</div>
                <div className="text-sm font-medium text-white">
                  {formatTime(nextSession.start)}
                </div>
                <div className="mt-0.5 text-[11px] text-white/55">
                  {formatDateNumericShort(nextSession.start)}
                </div>
              </div>
            ) : null
          }
        />
        <CardBody>
          {focus ? (
            <div
              id="acciones"
              className="scroll-mt-8 rounded-2xl border border-white/10 bg-white/6 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-serif text-[18px] text-white">
                    {focus.title}
                  </div>
                  <div className="mt-1 truncate text-sm text-white/65">
                    {focus.professor}
                    {focus.room ? ` · ${focus.room}` : ""}
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ background: focus.color }}
                        aria-hidden="true"
                      />
                      <div className="whitespace-nowrap text-sm text-white/80 tabular-nums">
                        {formatTime(focus.start)} - {formatTime(focus.end)}
                      </div>
                    </div>
                    {focusStatus ? (
                      <div
                        className={`inline-flex min-w-24 items-center justify-center rounded-full border px-2.5 py-1 text-xs ${tonePill(
                          focusStatus.tone,
                        )}`}
                      >
                        {focusStatus.label}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="w-full"
                      type="button"
                      tone="accent"
                      variant="solid"
                      onClick={() => {
                        if (!joinUrl) return;
                        window.open(joinUrl, "_blank", "noopener,noreferrer");
                      }}
                      disabled={!joinUrl}
                    >
                      Unirse
                    </Button>
                    <Button
                      size="sm"
                      className="w-full"
                      type="button"
                      variant="soft"
                      onClick={async () => {
                        if (!joinUrl) return;
                        await navigator.clipboard.writeText(joinUrl);
                      }}
                      disabled={!joinUrl}
                    >
                      Copiar link
                    </Button>
                  </div>
                  {selected ? (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => onSelect(null)}
                      >
                        Cerrar
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
              No hay clases proximamente. Cuando carguemos el cronograma real,
              esto va a mostrar tu proxima clase y alertas automáticas.
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Hoy"
          subtitle="Materias del dia"
          right={
            <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
              {todaySessions.length ? `${todaySessions.length} item(s)` : "0"}
            </div>
          }
        />
        <CardBody>
          <div className="space-y-2">
            {todaySessions.length ? (
              todaySessions.map((s) => {
                const status = getStatus(now, s);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full rounded-xl border border-white/10 bg-white/6 p-3 text-left transition hover:bg-white/9"
                    onClick={() => onSelect(s)}
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
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: s.color }}
                          aria-hidden="true"
                        />
                        <span className="text-xs text-white/60">Acciones</span>
                      </div>
                      <div
                        className={`rounded-full border px-2.5 py-1 text-[11px] ${tonePill(
                          status.tone,
                        )}`}
                      >
                        {status.label}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
                <div className="rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-white/65">
                  Si hoy no hay clases, igual podes subir apuntes o dejar un
                  mensaje para el resto.
                </div>
              )}
            </div>
        </CardBody>
      </Card>
    </div>
  );
}

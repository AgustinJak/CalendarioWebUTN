"use client";

import { useEffect } from "react";
import { addDays, dateKey, minutesBetween, startOfDay } from "@/lib/date";
import { sessionsForRange } from "@/lib/schedule";

function lsGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function notifyBrowser(title: string, body?: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body });
  } catch {
    // ignore
  }
}

export function useClassAlerts({
  now,
  pushToast,
  enableBrowserNotifications,
}: {
  now: Date;
  pushToast: (t: {
    title: string;
    description?: string;
    kind?: "info" | "ok" | "warn" | "danger";
    actionLabel?: string;
    onAction?: () => void;
  }) => void;
  enableBrowserNotifications: boolean;
}) {
  useEffect(() => {
    const dayStart = startOfDay(now);
    const dayEnd = addDays(dayStart, 1);

    const sessions = sessionsForRange(dayStart, dayEnd);
    const todayKey = dateKey(dayStart);

    const dailyKey = `uni_clases_daily_${todayKey}`;
    if (!lsGet(dailyKey)) {
      lsSet(dailyKey, "1");
      const count = sessions.length;
      const title =
        count > 0 ? `Hoy tenes ${count} clase(s)` : "Hoy no hay clases";
      pushToast({
        title,
        description:
          count > 0
            ? "Te vamos avisando si hay una clase en vivo o por comenzar."
            : "Igual podes usar el portal para apuntes y mensajes.",
        kind: count > 0 ? "ok" : "info",
      });
      if (enableBrowserNotifications) {
        notifyBrowser(title);
      }
    }

    const live = sessions.find((s) => now >= s.start && now <= s.end) ?? null;
    if (live) {
      const key = `uni_clases_live_${live.id}`;
      if (!lsGet(key)) {
        lsSet(key, "1");
        const title = `Clase en vivo: ${live.title}`;
        pushToast({
          title,
          description: "Ya esta en curso.",
          kind: "ok",
          actionLabel: live.liveUrl ? "Unirse" : undefined,
          onAction: live.liveUrl
            ? () => window.open(live.liveUrl!, "_blank", "noopener,noreferrer")
            : undefined,
        });
        if (enableBrowserNotifications) {
          notifyBrowser(title, "Ya esta en curso.");
        }
      }
      return;
    }

    const upcoming = sessions
      .filter((s) => s.start > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const next = upcoming[0] ?? null;
    if (!next) return;

    const mins = minutesBetween(now, next.start);
    if (mins <= 60 && mins > 10) {
      const key = `uni_clases_soon60_${next.id}`;
      if (!lsGet(key)) {
        lsSet(key, "1");
        const title = `En menos de 1 hora: ${next.title}`;
        pushToast({
          title,
          description: `Empieza a las ${new Intl.DateTimeFormat("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(next.start)}.`,
          kind: "warn",
        });
        if (enableBrowserNotifications) {
          notifyBrowser(title);
        }
      }
    }

    if (mins <= 10 && mins > 0) {
      const key = `uni_clases_soon10_${next.id}`;
      if (!lsGet(key)) {
        lsSet(key, "1");
        const title = `Por comenzar: ${next.title}`;
        pushToast({
          title,
          description: `En ${mins} min.`,
          kind: "warn",
          actionLabel: next.liveUrl ? "Abrir link" : undefined,
          onAction: next.liveUrl
            ? () => window.open(next.liveUrl!, "_blank", "noopener,noreferrer")
            : undefined,
        });
        if (enableBrowserNotifications) {
          notifyBrowser(title, `En ${mins} min.`);
        }
      }
    }
  }, [now, pushToast, enableBrowserNotifications]);
}

export function hasNotificationSupport() {
  return typeof Notification !== "undefined";
}

export function getNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported" as const;
  try {
    const res = await Notification.requestPermission();
    return res;
  } catch {
    return Notification.permission;
  }
}

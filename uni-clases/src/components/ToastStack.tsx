"use client";

import type { Toast } from "@/lib/types";
import { cx } from "./ui/cx";

const kindStyles: Record<Toast["kind"], string> = {
  // Mobile: use an opaque base so text remains readable without backdrop blur.
  // Desktop+: keep the tinted glass look.
  info: "border-white/18 bg-[#050f18]/96 sm:border-white/12 sm:bg-white/8",
  ok: "border-emerald-200/35 bg-[#050f18]/96 sm:border-emerald-200/20 sm:bg-emerald-200/10",
  warn: "border-amber-200/35 bg-[#050f18]/96 sm:border-amber-200/20 sm:bg-amber-200/10",
  danger: "border-rose-200/35 bg-[#050f18]/96 sm:border-rose-200/20 sm:bg-rose-200/10",
};

export default function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed left-4 right-4 top-4 z-50 space-y-3 sm:left-auto sm:right-4 sm:w-[420px]">
      {toasts.map((t, idx) => (
        <div
          key={t.id}
          className={cx(
            "u-fade-up rounded-2xl border p-4 shadow-[0_18px_60px_-34px_var(--shadow)] backdrop-blur-none sm:backdrop-blur",
            kindStyles[t.kind],
          )}
          style={{ animationDelay: `${Math.min(idx * 45, 180)}ms` }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium text-white">{t.title}</div>
              {t.description ? (
                <div className="mt-1 break-words text-sm text-white/70">
                  {t.description}
                </div>
              ) : null}
              {t.actionLabel && t.onAction ? (
                <button
                  className="mt-2 inline-flex text-sm font-medium text-[color:var(--accent)] hover:underline"
                  onClick={() => t.onAction?.()}
                  type="button"
                >
                  {t.actionLabel}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-white/4 px-2 py-1 text-xs text-white/70 hover:bg-white/8 hover:text-white"
              onClick={() => onDismiss(t.id)}
              aria-label="Cerrar"
            >
              Cerrar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

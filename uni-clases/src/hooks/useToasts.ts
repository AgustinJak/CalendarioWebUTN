"use client";

import { useCallback, useMemo, useState } from "react";
import type { Toast, ToastKind } from "@/lib/types";
import { randomId } from "@/lib/storage";

type PushToastInput = {
  title: string;
  description?: string;
  kind?: ToastKind;
  actionLabel?: string;
  onAction?: () => void;
  ttlMs?: number;
};

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({
      title,
      description,
      kind = "info",
      actionLabel,
      onAction,
      ttlMs = 10_000,
    }: PushToastInput) => {
      const id = randomId("toast");
      const createdAt = Date.now();
      setToasts((prev) => [
        { id, title, description, kind, createdAt, actionLabel, onAction },
        ...prev,
      ]);

      if (ttlMs > 0) {
        window.setTimeout(() => dismiss(id), ttlMs);
      }
    },
    [dismiss],
  );

  return useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);
}

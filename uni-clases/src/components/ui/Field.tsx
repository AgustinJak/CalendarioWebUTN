"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "./cx";

export function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("text-sm font-medium text-white/80", className)}>
      {children}
    </label>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "h-11 w-full rounded-xl border border-white/12 bg-white/6 px-3 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-white/18 focus:bg-white/7 focus:ring-2 focus:ring-[color:var(--accent)]/25",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        "min-h-28 w-full resize-y rounded-xl border border-white/12 bg-white/6 px-3 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-white/18 focus:bg-white/7 focus:ring-2 focus:ring-[color:var(--accent)]/25",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        "h-11 w-full appearance-none rounded-xl border border-white/12 bg-white/6 px-3 text-[15px] text-white outline-none transition focus:border-white/18 focus:bg-white/7 focus:ring-2 focus:ring-[color:var(--accent)]/25",
        className,
      )}
      {...props}
    />
  );
}


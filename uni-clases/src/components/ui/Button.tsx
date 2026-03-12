"use client";

import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "soft";
  tone?: "accent" | "neutral" | "danger";
  size?: "sm" | "md";
};

export default function Button({
  className,
  variant = "solid",
  tone = "neutral",
  size = "md",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium outline-none transition will-change-transform focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg2)] disabled:opacity-50 disabled:pointer-events-none active:translate-y-[1px]";

  const sizes =
    size === "sm"
      ? "h-9 px-3 text-sm"
      : "h-11 px-4 text-[15px] tracking-tight";

  const tones: Record<NonNullable<Props["tone"]>, string> = {
    neutral: "text-white",
    accent: "text-[#06121a]",
    danger: "text-white",
  };

  const variants: Record<NonNullable<Props["variant"]>, string> = {
    solid:
      tone === "accent"
        ? "bg-[color:var(--accent)] hover:brightness-[0.98]"
        : tone === "danger"
          ? "bg-[color:var(--danger)] hover:brightness-[0.98]"
          : "bg-white/14 hover:bg-white/18 border border-white/10",
    soft:
      tone === "accent"
        ? "bg-[color:var(--accent)]/18 text-white border border-white/12 hover:bg-[color:var(--accent)]/22"
        : tone === "danger"
          ? "bg-[color:var(--danger)]/16 text-white border border-white/10 hover:bg-[color:var(--danger)]/22"
          : "bg-white/8 text-white border border-white/10 hover:bg-white/11",
    ghost:
      "bg-transparent text-white/90 hover:bg-white/8 border border-transparent hover:border-white/10",
  };

  return (
    <button
      className={cx(base, sizes, tones[tone], variants[variant], className)}
      {...props}
    />
  );
}


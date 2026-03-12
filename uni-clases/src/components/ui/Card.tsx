import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "relative rounded-2xl border border-white/10 bg-white/6 shadow-[0_16px_60px_-28px_var(--shadow)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-5 pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="font-serif text-[19px] leading-tight tracking-tight text-white">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 text-sm text-white/65">{subtitle}</div>
        ) : null}
      </div>
      {right ? (
        <div className="w-full min-w-0 sm:w-auto sm:shrink-0">{right}</div>
      ) : null}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("px-5 pb-5", className)} {...props} />;
}

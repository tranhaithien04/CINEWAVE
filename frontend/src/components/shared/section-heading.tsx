import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-1">
        {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400">{eyebrow}</p> : null}
        <h2 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

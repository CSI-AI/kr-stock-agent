import type { ReactNode } from "react";

interface HomeSectionCardProps {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function HomeSectionCard({
  eyebrow,
  title,
  children,
  className = "",
}: HomeSectionCardProps) {
  return (
    <section
      className={`rounded-3xl border border-slate-800 bg-slate-900 p-6 ${className}`}
    >
      <div>
        {eyebrow ? <p className="text-sm text-slate-400">{eyebrow}</p> : null}
        <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}
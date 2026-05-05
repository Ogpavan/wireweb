import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

const Section = ({ id, eyebrow, title, description, children, className = "" }: SectionProps) => (
  <section id={id} className={`border-t border-border ${className}`}>
    <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-12">
        <header className="lg:col-span-4">
          {eyebrow && (
            <div className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h2 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </header>
        <div className="lg:col-span-8">{children}</div>
      </div>
    </div>
  </section>
);

export default Section;
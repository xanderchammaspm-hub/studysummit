import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Trophy, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import { SummitLogo } from "@/components/SummitLogo";

const TABS = [
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/achievements", label: "Achievements", icon: Trophy },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AccountShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="aurora" aria-hidden />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <SummitLogo size={34} />
            <span className="text-lg font-semibold tracking-tight gradient-text">Summit</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full purple-outline bg-surface/60 px-4 py-1.5 text-sm transition-transform hover:scale-[1.03]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="fade-in-up">
          <h1 className="text-3xl font-semibold tracking-tight gradient-text">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <nav className="mt-6 flex flex-wrap gap-1 rounded-full purple-outline bg-surface/50 p-1">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-all hover:text-foreground"
              activeProps={{
                className:
                  "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm bg-primary/25 text-foreground border border-primary/60",
              }}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 space-y-6">{children}</div>
      </main>
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="account-panel group relative overflow-hidden rounded-2xl purple-outline bg-card/60 p-6 backdrop-blur-xl fade-in-up">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-70"
      />
      {title && (
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="h-3.5 w-1 rounded-full bg-gradient-to-b from-primary to-yellow" />
            {title}
          </h2>
          {description && (
            <p className="mt-1.5 pl-3 text-xs text-muted-foreground/80">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}


import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Dumbbell,
  FileSignature,
  CalendarDays,
  Cake,
  UserCog,
  Settings,
  Search,
  Bell,
  Plus,
  Sparkles,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { UserRole } from "@/types";
import { createContext, useContext, useState, useEffect, type ReactNode, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { NotificationPanel } from "@/components/notification-panel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const allNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/prontuarios", label: "Prontuários", icon: ClipboardList },
  { to: "/exercicios", label: "Exercícios", icon: Dumbbell },
  { to: "/prescricoes", label: "Prescrições", icon: FileSignature },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/aniversarios", label: "Aniversários", icon: Cake },
  { to: "/usuarios", label: "Usuários", icon: UserCog, roles: [UserRole.ADMIN] },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

interface ShellContextType {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  setTitle: (t: string) => void;
  setSubtitle: (s?: string) => void;
  setActions: (a?: ReactNode) => void;
}

const ShellContext = createContext<ShellContextType | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProvider");
  return ctx;
}

function ShellProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState<string | undefined>();
  const [actions, setActions] = useState<ReactNode | undefined>();
  return (
    <ShellContext.Provider value={{ title, subtitle, actions, setTitle, setSubtitle, setActions }}>
      {children}
    </ShellContext.Provider>
  );
}

export function ShellTitle({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { setTitle, setSubtitle, setActions } = useShell();
  setTitle(title);
  setSubtitle(subtitle);
  setActions(actions);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { title, subtitle, actions } = useShell();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("maya_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("maya_sidebar_collapsed", String(collapsed));
    } catch {
      // localStorage may be unavailable in some environments
    }
  }, [collapsed]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "MY";

  const roleLabel =
    user?.role === UserRole.ADMIN
      ? "Administrador"
      : user?.role === UserRole.PROFESSIONAL
        ? "Profissional"
        : "Paciente";

  const items = allNav.filter((item) => {
    if ("roles" in item && (item as { roles?: string[] }).roles) {
      return user?.role === UserRole.ADMIN;
    }
    return true;
  });

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/auth/login" });
  };

  const sidebarContent = (isMobile = false) => (
    <>
      <div className={collapsed && !isMobile ? "px-3 pt-7 pb-6" : "px-6 pt-7 pb-6"}>
        <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold text-gold-foreground shadow-elevated">
            <span className="font-display text-xl font-semibold">M</span>
          </div>
          {(!collapsed || isMobile) && (
            <div className="leading-tight">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-sidebar-foreground/60">
                Clínica
              </p>
              <p className="font-display text-lg font-semibold">maya yamamoto</p>
              <p className="text-xs text-sidebar-foreground/70 -mt-0.5">rpg • fisioterapia</p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {(!collapsed || isMobile) && (
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
            Navegação
          </p>
        )}
        <ul className="space-y-1">
          {items.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            const navItem = (
              <Link
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition " +
                  (collapsed && !isMobile ? "justify-center " : "") +
                  (active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")
                }
              >
                <span
                  className={
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition " +
                    (active
                      ? "bg-gold text-gold-foreground"
                      : "bg-sidebar-accent/60 text-sidebar-foreground/80 group-hover:bg-sidebar-accent")
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>
                {(!collapsed || isMobile) && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
                  </>
                )}
              </Link>
            );
            if (collapsed && !isMobile) {
              return (
                <li key={item.to}>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
              );
            }
            return <li key={item.to}>{navItem}</li>;
          })}
        </ul>

        {(!collapsed || isMobile) && (
          <div className="mt-6 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4">
            <div className="flex items-center gap-2 text-gold">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Dica do dia</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-sidebar-foreground/80">
              Use o atalho <kbd className="rounded bg-sidebar px-1.5 py-0.5 text-[10px]">⌘K</kbd>{" "}
              para buscar pacientes em qualquer tela.
            </p>
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        {!collapsed || isMobile ? (
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold font-semibold text-gold-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{user?.name || "Usuário"}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              className="grid h-8 w-8 place-items-center rounded-lg text-sidebar-foreground/60 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="grid h-9 w-9 mx-auto place-items-center rounded-lg text-sidebar-foreground/60 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair ({user?.name || "Usuário"})</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {!isMobile && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mt-3 grid h-9 w-full place-items-center rounded-lg text-sidebar-foreground/60 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={
            "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 lg:flex " +
            (collapsed ? "w-16" : "w-72")
          }
        >
          {sidebarContent()}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-elevated">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebarContent(true)}
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="flex h-16 items-center gap-3 px-5 lg:px-8">
              <button
                onClick={() => setMobileOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Buscar paciente, prescrição ou exercício…"
                  className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-16 text-sm shadow-soft outline-none ring-0 transition focus:border-primary"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <NotificationPanel />
                <Link
                  to="/agenda"
                  className="hidden items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90 sm:inline-flex"
                >
                  <Plus className="h-4 w-4" />
                  Novo agendamento
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3 px-5 pb-5 lg:flex-row lg:items-end lg:justify-between lg:px-8">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
                  Maya RPG
                </p>
                <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          </header>

          <main className="px-5 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function AppShellProvider({ children }: { children: ReactNode }) {
  return <ShellProvider>{children}</ShellProvider>;
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <AppShellProvider>
      <AppShell>{children}</AppShell>
    </AppShellProvider>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={"rounded-2xl border border-border bg-card p-5 shadow-soft " + className}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "gold" | "success" | "warning" | "coral" | "sky";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    gold: "bg-gold/15 text-gold",
    success: "bg-success/15 text-success-foreground",
    warning: "bg-warning/20 text-warning-foreground",
    coral: "bg-coral/25 text-coral-foreground",
    sky: "bg-sky/40 text-sky-foreground",
  };
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium " +
        tones[tone]
      }
    >
      {children}
    </span>
  );
}

export const Button = forwardRef<
 HTMLButtonElement,
 {
 children: ReactNode;
 variant?: "primary" | "ghost" | "outline" | "gold" | "soft";
 className?: string;
 asChild?: boolean;
 } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, variant = "primary", className = "", asChild = false, ...rest }, ref) => {
 const variants: Record<string, string> = {
 primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-soft",
 gold: "bg-gold text-gold-foreground hover:opacity-90 shadow-soft",
 outline: "border border-border bg-card text-foreground hover:bg-muted",
 ghost: "text-foreground hover:bg-muted",
 soft: "bg-primary/10 text-primary hover:bg-primary/15",
 };
 const Comp = asChild ? Slot : "button";
 return (
 <Comp
 ref={ref}
 className={
 "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition disabled:opacity-50 " +
 variants[variant] +
 " " +
 className
 }
 {...rest}
 >
 {children}
 </Comp>
 );
});
Button.displayName = "Button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Kpi({
  icon: Icon,
  label,
  value,
  delta,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  delta?: string;
  tone?: "primary" | "sky" | "gold" | "coral";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    sky: "bg-sky-soft",
    gold: "bg-gold/15 text-gold",
    coral: "bg-coral/25 text-coral-foreground",
  };
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl">{value}</p>
          {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
        </div>
        <div className={"grid h-11 w-11 place-items-center rounded-xl " + tones[tone]}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export function QuickAction({
  icon: Icon,
  label,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-primary hover:bg-primary/5"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium">{label}</span>
      <span className="ml-auto text-muted-foreground transition group-hover:text-primary">
        <Plus className="h-4 w-4 rotate-45" />
      </span>
    </Link>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Stat({ label, value, small }: { label: string; value: ReactNode; small?: string }) {
  return (
    <div className="rounded-xl bg-muted/40 py-2 px-3 text-center">
      <p className="font-display text-lg">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {small && <p className="text-[10px] text-muted-foreground">{small}</p>}
    </div>
  );
}

export function Toggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={
          "relative h-6 w-11 rounded-full transition " + (checked ? "bg-primary" : "bg-muted")
        }
      >
        <span
          className={
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition " +
            (checked ? "translate-x-5" : "translate-x-0")
          }
        />
      </button>
    </div>
  );
}

export function PermCard({
  tone,
  label,
  children,
}: {
  tone: "gold" | "primary" | "sky";
  label: string;
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    gold: "bg-gold/15 text-gold",
    primary: "bg-primary/10 text-primary",
    sky: "bg-sky-soft",
  };
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <span
        className={
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium " +
          tones[tone]
        }
      >
        {label}
      </span>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

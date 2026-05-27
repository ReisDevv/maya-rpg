import { Outlet, Link, createRootRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Shell, ShellTitle } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">Maya RPG</p>
        <h1 className="font-display text-7xl font-semibold leading-tight">404</h1>
        <h2 className="mt-4 font-display text-xl">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !pathname.startsWith("/auth")) {
      navigate({ to: "/auth/login" });
    }
  }, [isLoading, isAuthenticated, pathname, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated && !pathname.startsWith("/auth")) {
    return null;
  }

  return <>{children}</>;
}

function AppShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return <Shell>{children}</Shell>;
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          <AppShellWrapper>
            <Outlet />
          </AppShellWrapper>
          <Toaster richColors position="top-right" />
        </AuthGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}

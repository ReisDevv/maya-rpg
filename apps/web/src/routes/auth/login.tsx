import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Login — Maya RPG" },
      { name: "description", content: "Acesse o painel da Clínica Maya RPG." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const redirect =
    (routerState.location.search as Record<string, string | undefined> | undefined)?.redirect ||
    "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Preencha todos os campos.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      await login(email, password);
      toast.success("Login realizado com sucesso!");
      navigate({ to: redirect });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao fazer login. Verifique suas credenciais.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white" />
          <div className="absolute bottom-20 right-20 h-48 w-48 rounded-full bg-white" />
        </div>
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-gold text-gold-foreground shadow-elevated">
            <span className="font-display text-3xl font-semibold">M</span>
          </div>
          <h1 className="font-display text-5xl font-semibold text-primary-foreground">maya</h1>
          <p className="font-display text-2xl text-primary-foreground/80">yamamoto</p>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-primary-foreground/60">
            rpg • fisioterapia
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-4 lg:w-1/2 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="lg:hidden mb-6 text-center">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-xl bg-gold text-gold-foreground shadow-elevated">
                <span className="font-display text-2xl font-semibold">M</span>
              </div>
              <h1 className="font-display text-3xl font-semibold">maya yamamoto</h1>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">rpg • fisioterapia</p>
            </div>
            <h2 className="font-display text-2xl font-semibold">Bem-Vindo de Volta!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Gerencie seus pacientes e planos de exercícios com segurança.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@clinicamaya.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="--------"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>

            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

            <Button
              type="submit"
              className="h-11 w-full rounded-full text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center">
              <a href="/auth/recover-password" className="text-sm text-primary hover:underline">
                Esqueceu sua senha?
              </a>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Acesso restrito para profissionais da Clínica Maya.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Cadastro — Maya RPG" },
      { name: "description", content: "Cadastre um novo profissional da clínica." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("Preencha todos os campos.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMessage("A senha deve conter ao menos uma letra maiúscula.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setErrorMessage("A senha deve conter ao menos uma letra minúscula.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setErrorMessage("A senha deve conter ao menos um número.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({ name, email, password });
      toast.success("Cadastro realizado com sucesso! Faça login.");
      navigate({ to: "/auth/login" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao cadastrar.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gold to-gold/80 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white" />
          <div className="absolute bottom-20 right-20 h-48 w-48 rounded-full bg-white" />
        </div>
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-white/20 shadow-elevated">
            <span className="font-display text-3xl font-semibold text-gold-foreground">M</span>
          </div>
          <h1 className="font-display text-5xl font-semibold text-gold-foreground">maya</h1>
          <p className="font-display text-2xl text-gold-foreground/80">yamamoto</p>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-gold-foreground/60">
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
            <h2 className="font-display text-2xl font-semibold">Cadastrar Novo Profissional</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Configure o acesso para novos fisioterapeutas ou equipe de apoio.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Profissional</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email Profissional"
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
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirmar Senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>

            <div className="text-center">
              <a href="/auth/login" className="text-sm text-primary hover:underline">
                Já tem conta? Faça login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/recover-password")({
  head: () => ({
    meta: [
      { title: "Recuperar Senha — Maya RPG" },
      { name: "description", content: "Recupere o acesso ao painel da Clínica Maya RPG." },
    ],
  }),
  component: RecoverPasswordPage,
});

type Step = "email" | "code" | "done";

function RecoverPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [email, setEmail] = useState("");
  const [requestId, setRequestId] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setErrorMessage("Informe seu e-mail."); return; }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await authService.requestPasswordResetCode(email);
      setRequestId(res.requestId);
      setStep("code");
      toast.success("Código enviado para seu e-mail!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar código.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) { setErrorMessage("Informe o código recebido."); return; }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      await authService.confirmPasswordResetCode(requestId, code, newPassword);
      setStep("done");
      toast.success("Senha alterada com sucesso!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código inválido ou expirado.";
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
            <h2 className="font-display text-2xl font-semibold">Recuperar Senha</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === "email" && "Informe seu e-mail para receber o código de recuperação."}
              {step === "code" && `Digite o código enviado para ${email} e crie uma nova senha.`}
              {step === "done" && "Senha alterada com sucesso!"}
            </p>
          </div>

          {step === "email" && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail cadastrado</Label>
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
              {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
              <Button type="submit" className="h-11 w-full rounded-full text-sm font-medium" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar Código"}
              </Button>
              <div className="text-center">
                <a href="/auth/login" className="text-sm text-primary hover:underline">
                  Lembrou a senha? Faça login
                </a>
              </div>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleConfirmCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de verificação</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="h-11 rounded-xl tracking-widest text-center text-lg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 rounded-xl"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
              <Button type="submit" className="h-11 w-full rounded-full text-sm font-medium" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Redefinir Senha"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full rounded-full"
                onClick={() => { setStep("email"); setErrorMessage(""); setCode(""); }}
              >
                Reenviar código
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Sua senha foi alterada com sucesso. Faça login com a nova senha.
                </p>
              </div>
              <Button className="h-11 w-full rounded-full" onClick={() => navigate({ to: "/auth/login" })}>
                Ir para o login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

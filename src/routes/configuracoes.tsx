import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, Button, Badge, ShellTitle } from "@/components/app-shell";
import { Mail, ShieldCheck, Download, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/utils";
import { lgpdService } from "@/services/lgpd.service";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/contexts/auth";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Maya RPG" },
      { name: "description", content: "Ajustes básicos do painel profissional da clínica." },
    ],
  }),
  component: ConfiguracoesPage,
});

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary";

type EmailStep = "idle" | "verify-current" | "request-new" | "confirm-new" | "done";

function EmailChangeWizard() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<EmailStep>("idle");
  const [requestId, setRequestId] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [newCode, setNewCode] = useState("");

  const requestCurrentMutation = useMutation({
    mutationFn: () => authService.requestCurrentEmailChangeCode(),
    onSuccess: (data) => {
      setRequestId(data.requestId);
      setStep("verify-current");
      toast.success("Código enviado para o e-mail atual");
    },
    onError: (err: unknown) => toast.error(extractApiError(err) ?? "Erro ao enviar código"),
  });

  const verifyCurrentMutation = useMutation({
    mutationFn: () => authService.verifyCurrentEmailChangeCode(requestId, currentCode),
    onSuccess: () => {
      setStep("request-new");
      toast.success("E-mail atual verificado");
    },
    onError: (err: unknown) => toast.error(extractApiError(err) ?? "Código inválido"),
  });

  const requestNewMutation = useMutation({
    mutationFn: () => authService.requestNewEmailChangeCode(requestId, newEmail, confirmEmail),
    onSuccess: () => {
      setStep("confirm-new");
      toast.success("Código enviado para o novo e-mail");
    },
    onError: (err: unknown) => toast.error(extractApiError(err) ?? "Erro ao enviar código"),
  });

  const confirmNewMutation = useMutation({
    mutationFn: () => authService.confirmNewEmailChangeCode(requestId, newCode),
    onSuccess: async () => {
      setStep("done");
      await refreshUser();
      toast.success("E-mail alterado com sucesso");
    },
    onError: (err: unknown) => toast.error(extractApiError(err) ?? "Código inválido"),
  });

  const reset = () => {
    setStep("idle");
    setRequestId("");
    setCurrentCode("");
    setNewEmail("");
    setConfirmEmail("");
    setNewCode("");
  };

  return (
    <Card>
      <div className="flex items-center gap-2 text-primary">
        <Mail className="h-4 w-4" />
        <h3 className="font-display text-lg">Troca segura de e-mail</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Processo em 4 etapas: verificamos o e-mail atual e depois o novo.
      </p>

      {step === "idle" && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              E-mail atual
            </label>
            <input className={inputCls} value={user?.email ?? ""} readOnly />
          </div>
          <div className="flex justify-end">
            <Button
              variant="gold"
              onClick={() => requestCurrentMutation.mutate()}
              disabled={requestCurrentMutation.isPending}
            >
              {requestCurrentMutation.isPending ? "Enviando..." : "Iniciar troca"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "verify-current" && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Digite o código enviado para <span className="font-medium text-foreground">{user?.email}</span>.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Código de verificação
            </label>
            <input
              className={inputCls}
              placeholder="000000"
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              maxLength={6}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>Cancelar</Button>
            <Button
              variant="gold"
              onClick={() => verifyCurrentMutation.mutate()}
              disabled={verifyCurrentMutation.isPending || !currentCode}
            >
              {verifyCurrentMutation.isPending ? "Verificando..." : "Verificar"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "request-new" && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Informe o novo e-mail desejado.</p>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Novo e-mail
            </label>
            <input
              className={inputCls}
              type="email"
              placeholder="novo@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Confirmar novo e-mail
            </label>
            <input
              className={inputCls}
              type="email"
              placeholder="novo@email.com"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>Cancelar</Button>
            <Button
              variant="gold"
              onClick={() => requestNewMutation.mutate()}
              disabled={requestNewMutation.isPending || !newEmail || !confirmEmail}
            >
              {requestNewMutation.isPending ? "Enviando..." : "Enviar código"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "confirm-new" && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Digite o código enviado para <span className="font-medium text-foreground">{newEmail}</span>.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Código de confirmação
            </label>
            <input
              className={inputCls}
              placeholder="000000"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              maxLength={6}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>Cancelar</Button>
            <Button
              variant="gold"
              onClick={() => confirmNewMutation.mutate()}
              disabled={confirmNewMutation.isPending || !newCode}
            >
              {confirmNewMutation.isPending ? "Confirmando..." : "Confirmar"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="mt-4 flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-success-foreground" />
          <p className="font-medium">E-mail alterado com sucesso!</p>
          <p className="text-xs text-muted-foreground">Seu novo e-mail é <span className="font-medium text-foreground">{newEmail}</span>.</p>
          <Button variant="outline" onClick={reset}>Fechar</Button>
        </div>
      )}
    </Card>
  );
}

function ConfiguracoesPage() {
  const exportDataMutation = useMutation({
    mutationFn: () => lgpdService.exportData(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meus-dados.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Exportação concluída");
    },
    onError: (err: unknown) => {
      toast.error(extractApiError(err) ?? "Erro ao exportar dados");
    },
  });

  const anonymizeMutation = useMutation({
    mutationFn: () => lgpdService.anonymizeData(),
    onSuccess: () => {
      toast.success("Solicitação de anonimização registrada");
    },
    onError: (err: unknown) => {
      toast.error(extractApiError(err) ?? "Erro ao solicitar anonimização");
    },
  });

  return (
    <>
      <ShellTitle
        title="Configurações"
        subtitle="Personalize a clínica, sua conta e preferências de privacidade."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <EmailChangeWizard />

        <Card>
          <div className="flex items-center gap-2 text-coral-foreground">
            <ShieldCheck className="h-4 w-4" />
            <h3 className="font-display text-lg">Privacidade & LGPD</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" /> Exportar dados
              </span>
              <Button
                variant="outline"
                onClick={() => exportDataMutation.mutate()}
                disabled={exportDataMutation.isPending}
              >
                {exportDataMutation.isPending ? "Exportando..." : "Exportar"}
              </Button>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-muted-foreground" /> Anonimizar dados
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    confirm(
                      "Tem certeza que deseja anonimizar seus dados? Esta ação é irreversível.",
                    )
                  )
                    anonymizeMutation.mutate();
                }}
                disabled={anonymizeMutation.isPending}
              >
                {anonymizeMutation.isPending ? "Anonimizando..." : "Anonimizar"}
              </Button>
            </li>
          </ul>
          <Badge tone="success">Conformidade LGPD ativa</Badge>
        </Card>
      </div>
    </>
  );
}

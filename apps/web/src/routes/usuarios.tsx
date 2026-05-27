import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Badge, Button, ShellTitle, PermCard } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Shield, UserCog, Mail, MoreHorizontal } from "lucide-react";
import { userService } from "@/services/user.service";
import { useAuth } from "@/contexts/auth";
import { UserRole } from "@/types";
import { toast } from "sonner";
import { extractApiError } from "@/lib/utils";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Maya RPG" },
      { name: "description", content: "Gestão de profissionais e administradores da clínica." },
    ],
  }),
  component: UsuariosPage,
});

function roleTone(role: string): "gold" | "primary" | "sky" {
  if (role === "ADMIN") return "gold";
  if (role === "PROFESSIONAL") return "primary";
  return "sky";
}

const roleLabelMap: Record<string, string> = {
  ADMIN: "Admin",
  PROFESSIONAL: "Profissional",
  PATIENT: "Paciente",
};

function UsuariosPage() {
  const { user: sessaoAtual } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = sessaoAtual?.role === UserRole.ADMIN;

  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoSenha, setNovoSenha] = useState("");
  const [novoPerfil, setNovoPerfil] = useState<string>(UserRole.PROFESSIONAL);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: usuariosData, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => userService.getAll({ page: 1, pageSize: 100 }),
    enabled: isAdmin,
  });

  const usuarios = usuariosData?.data ?? [];

  const createStaffMutation = useMutation({
    mutationFn: () =>
      userService.createStaff({
        name: novoNome,
        email: novoEmail,
        password: novoSenha,
        role: novoPerfil as UserRole.ADMIN | UserRole.PROFESSIONAL,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Profissional criado com sucesso");
      setDialogOpen(false);
      setNovoNome("");
      setNovoEmail("");
      setNovoSenha("");
      setNovoPerfil(UserRole.PROFESSIONAL);
    },
    onError: (err: unknown) => {
      toast.error(extractApiError(err) ?? "Erro ao criar profissional");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.updateStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Status atualizado");
    },
    onError: (err: unknown) => {
      toast.error(extractApiError(err) ?? "Erro ao atualizar status");
    },
  });

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <>
      <ShellTitle
        title="Usuários"
        subtitle="Gestão de profissionais, perfis e permissões."
        actions={
          isAdmin ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="primary">
                  <Plus className="h-4 w-4" /> Novo profissional
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Profissional</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      className="mt-1"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      className="mt-1"
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      className="mt-1"
                      value={novoSenha}
                      onChange={(e) => setNovoSenha(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Perfil</Label>
                    <Select value={novoPerfil} onValueChange={setNovoPerfil}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                        <SelectItem value={UserRole.PROFESSIONAL}>Profissional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => createStaffMutation.mutate()}
                    disabled={createStaffMutation.isPending}
                  >
                    {createStaffMutation.isPending ? "Criando..." : "Criar Profissional"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="space-y-5">
        <Card className="bg-gradient-hero">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gold text-xl font-semibold text-gold-foreground">
              {sessaoAtual ? initials(sessaoAtual.name) : "MY"}
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Sessão atual</p>
              <h3 className="font-display text-2xl">{sessaoAtual?.name ?? "—"}</h3>
              <p className="text-sm text-muted-foreground">{sessaoAtual?.email ?? ""}</p>
            </div>
            <Badge tone="gold">
              <Shield className="h-3 w-3" />{" "}
              {roleLabelMap[sessaoAtual?.role ?? ""] ?? sessaoAtual?.role}
            </Badge>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
              ))
            : usuarios.map((u) => (
                <Card key={u.id}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                      {initials(u.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    {isAdmin && u.id !== sessaoAtual?.id && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: u.id, isActive: !u.isActive })
                        }
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted transition"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {u.email}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <Badge tone={roleTone(u.role)}>
                      <UserCog className="h-3 w-3" /> {roleLabelMap[u.role] ?? u.role}
                    </Badge>
                    <Badge tone={u.isActive ? "success" : "neutral"}>
                      {u.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </Card>
              ))}
        </div>

        <Card>
          <h3 className="font-display text-lg">Perfis e permissões</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <PermCard tone="gold" label="ADMIN">
              Acesso total: equipe, configurações, financeiro e dados.
            </PermCard>
            <PermCard tone="primary" label="PROFESSIONAL">
              Pacientes, prontuários, prescrições e agenda.
            </PermCard>
            <PermCard tone="sky" label="PATIENT">
              Visualiza próprios atendimentos e prescrições.
            </PermCard>
          </div>
        </Card>
      </div>
    </>
  );
}

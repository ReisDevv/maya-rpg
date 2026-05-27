import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, EmptyState, ShellTitle } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Plus, Search, Pencil, Trash2, Eye, Filter } from "lucide-react";
import { patientService } from "@/services/patient.service";
import { PatientStatus } from "@/types";
import { toast } from "sonner";
import { extractApiError } from "@/lib/utils";

export const Route = createFileRoute("/pacientes")({
  head: () => ({
    meta: [
      { title: "Pacientes — Maya RPG" },
      {
        name: "description",
        content: "Gerencie pacientes ativos, inativos e pendentes da clínica.",
      },
    ],
  }),
  component: PacientesRouteComponent,
});

const filtros: { key: PatientStatus | undefined; label: string }[] = [
  { key: undefined, label: "Todos" },
  { key: PatientStatus.ACTIVE, label: "Ativos" },
  { key: PatientStatus.INACTIVE, label: "Inativos" },
  { key: PatientStatus.PENDING, label: "Pendentes" },
];

function PacientesRouteComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/pacientes") {
    return <Outlet />;
  }

  return <PacientesPage />;
}

function PacientesPage() {
  const [busca, setBusca] = useState("");
  const [debouncedBusca, setDebouncedBusca] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleBusca = useCallback((value: string) => {
    setBusca(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedBusca(value), 300);
  }, []);
  const [filtro, setFiltro] = useState<string>(filtros[0].label);
  const queryClient = useQueryClient();

  const activeFilter = filtros.find((f) => f.label === filtro) ?? filtros[0];

  const { data, isLoading } = useQuery({
    queryKey: ["patients", activeFilter.label, debouncedBusca],
    queryFn: () =>
      patientService.getAll(
        { page: 1, pageSize: 100, search: debouncedBusca || undefined },
        activeFilter.key,
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente excluído");
    },
    onError: (err: unknown) => toast.error(extractApiError(err) ?? "Erro ao excluir paciente"),
  });

  const pacientes = useMemo(() => data?.data ?? [], [data]);

  const lista = useMemo(() => {
    if (!busca) return pacientes;
    const q = busca.toLowerCase();
    return pacientes.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.cpf.includes(q) ||
        p.phone.includes(q),
    );
  }, [busca, pacientes]);

  return (
    <>
      <ShellTitle
        title="Pacientes"
        subtitle="Centralize cadastro, prontuários e prescrições da sua clínica."
        actions={
          <Button variant="primary" asChild>
            <Link to="/pacientes/novo">
              <Plus className="h-4 w-4" /> Novo paciente
            </Link>
          </Button>
        }
      />

      <div className="space-y-5">
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => handleBusca(e.target.value)}
                placeholder="Buscar por nome, e-mail, CPF ou telefone…"
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1">
              <Filter className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
              {filtros.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setFiltro(f.label)}
                  className={
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition " +
                    (filtro === f.label
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Nenhum paciente encontrado"
            description="Ajuste os filtros ou cadastre um novo paciente."
            action={
              <Button variant="primary" asChild>
                <Link to="/pacientes/novo">
                  <Plus className="h-4 w-4" /> Novo paciente
                </Link>
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Paciente</th>
                    <th className="px-5 py-3 font-medium">Contato</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lista.map((p) => (
                    <tr key={p.id} className="transition hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                            {p.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <Link
                              to="/pacientes/$id"
                              params={{ id: p.id }}
                              className="font-medium text-foreground hover:text-primary transition"
                            >
                              {p.fullName}
                            </Link>
                            <p className="text-xs text-muted-foreground">{p.cpf}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs">{p.email}</p>
                        <p className="text-xs text-muted-foreground">{p.phone}</p>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          status={
                            p.status === PatientStatus.ACTIVE
                              ? "Ativo"
                              : p.status === PatientStatus.INACTIVE
                                ? "Inativo"
                                : "Pendente"
                          }
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            to="/pacientes/$id"
                            params={{ id: p.id }}
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition"
                            title="Visualizar paciente"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to="/pacientes/$id/editar"
                            params={{ id: p.id }}
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-gold/15 hover:text-gold transition"
                            title="Editar paciente"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm("Excluir paciente?")) deleteMutation.mutate(p.id);
                            }}
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lista.length === 0 && (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Nenhum paciente encontrado.
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

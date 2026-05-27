import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, Badge, Button, ShellTitle, Stat, EmptyState } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Plus, FileSignature } from "lucide-react";
import { prescriptionService } from "@/services/prescription.service";
import { patientService } from "@/services/patient.service";
import { exerciseService } from "@/services/exercise.service";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/prescricoes")({
  head: () => ({
    meta: [
      { title: "Prescrições — Maya RPG" },
      { name: "description", content: "Planos de exercícios prescritos por paciente." },
    ],
  }),
  component: PrescricoesLayout,
});

function PrescricoesLayout() {
  const matchRoute = useMatchRoute();
  const isChild =
    matchRoute({ to: "/prescricoes/nova" }) ||
    matchRoute({ to: "/prescricoes/$id" });
  if (isChild) return <Outlet />;
  return <PrescricoesPage />;
}

function PrescricoesPage() {
  const navigate = useNavigate();
  const { data: prescricoesData, isLoading } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: () => prescriptionService.getAll({ page: 1, pageSize: 100 }),
  });

  const { data: pacientesData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientService.getAll({ page: 1, pageSize: 200 }),
  });

  const { data: exerciciosData } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => exerciseService.getAll({ page: 1, pageSize: 200 }),
  });

  const prescricoes = prescricoesData?.data ?? [];
  const pacientesMap = new Map((pacientesData?.data ?? []).map((p) => [p.id, p.fullName]));
  const exerciciosMap = new Map((exerciciosData?.data ?? []).map((e) => [e.id, e.title]));

  return (
    <>
      <ShellTitle
        title="Prescrições"
        subtitle="Planos de exercícios personalizados, organizados por paciente."
        actions={
          <Button variant="primary" asChild>
            <Link to="/prescricoes/nova">
              <Plus className="h-4 w-4" /> Nova prescrição
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : prescricoes.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="Nenhuma prescrição encontrada"
          description="Crie uma nova prescrição para começar."
          action={
            <Button variant="primary" asChild>
              <Link to="/prescricoes/nova">
                <Plus className="h-4 w-4" /> Nova prescrição
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {prescricoes.map((rx) => (
            <Card key={rx.id}>
              <div className="flex items-center justify-between">
                <Badge tone="primary">
                  <FileSignature className="h-3 w-3" /> Prescrição
                </Badge>
                <StatusBadge status={rx.isActive ? "Ativa" : "Inativa"} />
              </div>
              <h3 className="mt-2 font-display text-lg">{rx.title}</h3>
              <p className="text-sm text-muted-foreground">
                {pacientesMap.get(rx.patientId) ?? "Paciente"}
              </p>

              <div className="my-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center">
                <Stat label="Exercícios" value={rx.exercises.length} />
                <Stat
                  label="Início"
                  value={new Date(rx.startDate).toLocaleDateString("pt-BR")}
                  small
                />
                <Stat
                  label="Término"
                  value={rx.endDate ? new Date(rx.endDate).toLocaleDateString("pt-BR") : "—"}
                  small
                />
              </div>

              <ul className="space-y-1 text-sm">
                {rx.exercises.slice(0, 3).map((ex, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    <span className="truncate">
                      {exerciciosMap.get(ex.exerciseId) ?? ex.exerciseId}
                    </span>
                    {ex.sets && ex.repetitions && (
                      <span className="ml-auto text-xs">
                        {ex.sets}×{ex.repetitions}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/prescricoes/$id" params={{ id: rx.id }}>
                    Ver plano
                  </Link>
                </Button>
                <Button
                  variant="soft"
                  className="flex-1"
                  onClick={() =>
                    navigate({
                      to: "/prescricoes/nova",
                      state: { fromPrescription: rx },
                    })
                  }
                >
                  Renovar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

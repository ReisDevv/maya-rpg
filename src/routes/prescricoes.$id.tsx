import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { prescriptionService } from "@/services/prescription.service";
import { patientService } from "@/services/patient.service";
import { exerciseService } from "@/services/exercise.service";
import { Card, Badge, Button, ShellTitle, Stat, Field } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeft, FileSignature, CalendarDays, Dumbbell, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/prescricoes/$id")({
  head: () => ({
    meta: [
      { title: "Prescrição — Maya RPG" },
      { name: "description", content: "Detalhes do plano de exercícios." },
    ],
  }),
  loader: async ({ params }) => {
    try {
      return await prescriptionService.getById(params.id);
    } catch {
      throw notFound();
    }
  },
  component: PrescricaoDetalhe,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <p className="font-medium">Prescrição não encontrada</p>
      <Button asChild variant="outline">
        <Link to="/prescricoes">Voltar para prescrições</Link>
      </Button>
    </div>
  ),
});

export default function PrescricaoDetalhe() {
  const rx = Route.useLoaderData();
  const navigate = useNavigate();

  const { data: pacientesData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientService.getAll({ page: 1, pageSize: 200 }),
  });

  const { data: exerciciosData } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => exerciseService.getAll({ page: 1, pageSize: 200 }),
  });

  const pacientesMap = new Map((pacientesData?.data ?? []).map((p) => [p.id, p.fullName]));
  const exerciciosMap = new Map((exerciciosData?.data ?? []).map((e) => [e.id, e.title]));

  const patientName = pacientesMap.get(rx.patientId) ?? "Paciente";

  return (
    <>
      <ShellTitle
        title={rx.title}
        subtitle={`Prescrição para ${patientName}`}
        actions={
          <>
            {rx.isActive && (
              <Button
                variant="soft"
                onClick={() =>
                  navigate({
                    to: "/prescricoes/nova",
                    state: { fromPrescription: rx },
                  })
                }
              >
                <RefreshCw className="h-4 w-4" /> Renovar
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-5">
        <Button asChild variant="ghost" className="-ml-2">
          <Link to="/prescricoes">
            <ArrowLeft className="mr-1 h-4 w-4" /> Prescrições
          </Link>
        </Button>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <div className="flex items-center justify-between">
                <Badge tone="primary">
                  <FileSignature className="h-3 w-3" /> Prescrição
                </Badge>
                <StatusBadge status={rx.isActive ? "Ativa" : "Inativa"} />
              </div>
              <h2 className="mt-3 font-display text-2xl">{rx.title}</h2>
              <p className="text-sm text-muted-foreground">{patientName}</p>

              <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-muted/40 p-3 text-center">
                <Stat label="Exercícios" value={rx.exercises.length} />
                <Stat label="Início" value={format(new Date(rx.startDate), "dd/MM/yyyy")} small />
                <Stat
                  label="Término"
                  value={rx.endDate ? format(new Date(rx.endDate), "dd/MM/yyyy") : "—"}
                  small
                />
              </div>
            </Card>

            <Card>
              <h3 className="font-display text-lg">Exercícios prescritos</h3>
              <div className="mt-4 space-y-3">
                {rx.exercises
                  .sort((a, b) => a.order - b.order)
                  .map((ex, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-border p-3"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold font-semibold text-sm">
                        {ex.order}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">
                          {exerciciosMap.get(ex.exerciseId) ?? ex.exerciseId}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {ex.sets && <span>{ex.sets} séries</span>}
                          {ex.repetitions && <span>{ex.repetitions} reps</span>}
                          {ex.holdTimeSeconds && <span>{ex.holdTimeSeconds}s sustentação</span>}
                          {ex.frequency && <span>{ex.frequency}</span>}
                        </div>
                        {ex.notes && (
                          <p className="mt-1 text-xs text-muted-foreground">{ex.notes}</p>
                        )}
                      </div>
                      <Link
                        to="/exercicios/$id"
                        params={{ id: ex.exerciseId }}
                        className="text-xs text-primary hover:underline"
                      >
                        Ver exercício
                      </Link>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <h4 className="font-display text-sm">Informações</h4>
              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    Início:{" "}
                    {format(new Date(rx.startDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </li>
                {rx.endDate && (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      Término:{" "}
                      {format(new Date(rx.endDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </li>
                )}
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Dumbbell className="h-4 w-4" />
                  <span>
                    {rx.exercises.length} exercício{rx.exercises.length !== 1 ? "s" : ""}
                  </span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

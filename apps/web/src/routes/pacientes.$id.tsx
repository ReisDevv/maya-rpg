import { createFileRoute, Link, notFound, Outlet, useRouterState } from "@tanstack/react-router";
import { extractApiError } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, Button, ShellTitle } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  ArrowLeft,
  Bell,
  Calendar,
  ClipboardList,
  FilePlus,
  FileSignature,
  Mail,
  Pencil,
  Phone,
  Stethoscope,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { exerciseExecutionService } from "@/services/exercise-execution.service";
import { medicalRecordService } from "@/services/medical-record.service";
import { patientService } from "@/services/patient.service";
import { prescriptionService } from "@/services/prescription.service";
import { PatientStatus } from "@/types";
import { toast } from "sonner";
import { useState } from "react";

declare module "@tanstack/react-router" {
  interface HistoryState {
    patientId?: string;
  }
}

export const Route = createFileRoute("/pacientes/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do paciente — Maya RPG" },
      { name: "description", content: "Prontuário, prescrições e evolução do paciente." },
    ],
  }),
  loader: async ({ params }) => {
    try {
      return await patientService.getById(params.id);
    } catch {
      throw notFound();
    }
  },
  component: PacienteRouteComponent,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <p className="font-medium">Paciente não encontrado</p>
      <Button asChild variant="outline">
        <Link to="/pacientes">Voltar para pacientes</Link>
      </Button>
    </div>
  ),
});

const tabs = ["visao", "prontuario", "prescricoes", "evolucao"] as const;
const tabLabels: Record<(typeof tabs)[number], string> = {
  visao: "Visão Geral",
  prontuario: "Prontuário",
  prescricoes: "Prescrições",
  evolucao: "Evolução",
};

function statusLabel(status: PatientStatus) {
  if (status === PatientStatus.ACTIVE) return "Ativo";
  if (status === PatientStatus.INACTIVE) return "Inativo";
  return "Pendente";
}

function PacienteRouteComponent() {
  const params = Route.useParams();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== `/pacientes/${params.id}`) {
    return <Outlet />;
  }

  return <PacienteDetalhe />;
}

function PacienteDetalhe() {
  const patient = Route.useLoaderData();
  const params = Route.useParams();
  const [tab, setTab] = useState<(typeof tabs)[number]>("visao");

  const reminderMutation = useMutation({
    mutationFn: () => patientService.sendReminder(patient.id),
    onSuccess: (result) => {
      if (result.sent) {
        toast.success("Lembrete enviado com sucesso!");
      } else {
        toast.info(result.message);
      }
    },
    onError: (err: unknown) => {
      toast.error(extractApiError(err) ?? "Erro ao enviar lembrete. Tente novamente.");
    },
  });

  const { data: registros } = useQuery({
    queryKey: ["medical-records", params.id],
    queryFn: () => medicalRecordService.getByPatientId(params.id, { page: 1, pageSize: 50 }),
  });

  const { data: planos } = useQuery({
    queryKey: ["prescriptions-patient", params.id],
    queryFn: () => prescriptionService.getByPatientId(params.id, { page: 1, pageSize: 50 }),
  });

  const { data: painData, isLoading: painLoading } = useQuery({
    queryKey: ["pain-evolution", params.id],
    queryFn: () => dashboardService.getPainEvolution(params.id),
  });

  const { data: checkInsData, isLoading: checkInsLoading } = useQuery({
    queryKey: ["check-ins", params.id],
    queryFn: () => exerciseExecutionService.getByPatientId(params.id, { page: 1, pageSize: 20 }),
    enabled: tab === "evolucao",
  });

  const initials = patient.fullName
    .split(" ")
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <ShellTitle
        title={patient.fullName}
        subtitle={`${patient.email} • ${patient.phone}`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => reminderMutation.mutate()}
              disabled={reminderMutation.isPending}
            >
              <Bell className="h-4 w-4" />
              {reminderMutation.isPending ? "Enviando..." : "Disparar Lembrete"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/prescricoes/nova" state={{ patientId: patient.id }}>
                <FilePlus className="h-4 w-4" /> Nova Prescrição
              </Link>
            </Button>
            <Button variant="primary" asChild>
              <Link to="/pacientes/$id/editar" params={{ id: patient.id }}>
                <Pencil className="h-4 w-4" /> Editar Dados
              </Link>
            </Button>
          </>
        }
      />

      <div className="space-y-5">
        <Button asChild variant="ghost" className="-ml-2">
          <Link to="/pacientes">
            <ArrowLeft className="mr-1 h-4 w-4" /> Pacientes
          </Link>
        </Button>

        <Card>
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
              {initials}
            </div>
            <div>
              <StatusBadge status={statusLabel(patient.status)} />
              <p className="mt-1 text-sm text-muted-foreground">{patient.email}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-1 rounded-xl border border-border bg-card p-1">
            {tabs.map((currentTab) => (
              <button
                key={currentTab}
                onClick={() => setTab(currentTab)}
                className={
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition " +
                  (tab === currentTab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {tabLabels[currentTab]}
              </button>
            ))}
          </div>
        </Card>

        {tab === "visao" && (
          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <h4 className="font-display text-sm">Dados pessoais</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" /> {patient.email}
                </li>
                <li className="flex gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {patient.phone}
                </li>
                <li className="flex gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />{" "}
                  {new Date(patient.birthDate).toLocaleDateString("pt-BR")}
                </li>
              </ul>
              {patient.notes && (
                <p className="mt-4 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                  {patient.notes}
                </p>
              )}
            </Card>

            <Card>
              <h4 className="font-display text-sm">Ações rápidas</h4>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="soft" onClick={() => setTab("prontuario")}>
                  <ClipboardList className="h-4 w-4" /> Prontuário
                </Button>
                <Button variant="soft" asChild>
                  <Link to="/prescricoes/nova" state={{ patientId: patient.id }}>
                    <FileSignature className="h-4 w-4" /> Prescrição
                  </Link>
                </Button>
                <Button variant="soft" asChild>
                  <Link to="/agenda" state={{ patientId: patient.id }}>
                    <Calendar className="h-4 w-4" /> Agendar
                  </Link>
                </Button>
                <Button variant="soft" asChild>
                  <Link to="/prontuarios" state={{ patientId: patient.id }}>
                    <Stethoscope className="h-4 w-4" /> Avaliar
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {tab === "prontuario" &&
          (!registros?.data || registros.data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Sem registros de prontuário ainda.
            </div>
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-6">
              {registros.data.map((registro) => (
                <li key={registro.id} className="relative">
                  <span className="absolute -left-[33px] top-3 grid h-6 w-6 place-items-center rounded-full border-2 border-background bg-gold text-gold-foreground">
                    <FilePlus className="h-3 w-3" />
                  </span>
                  <Card>
                    <p className="text-xs text-muted-foreground">
                      {new Date(registro.date).toLocaleDateString("pt-BR")} • Dor:{" "}
                      {registro.painLevel ?? "—"}/10
                    </p>
                    <p className="mt-1 text-sm text-foreground">{registro.clinicalNotes}</p>
                    {registro.treatmentPlan && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Plano: {registro.treatmentPlan}
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ol>
          ))}

        {tab === "prescricoes" &&
          (!planos?.data || planos.data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Nenhuma prescrição cadastrada.
            </div>
          ) : (
            <div className="space-y-3">
              {planos.data.map((prescription) => (
                <Card key={prescription.id}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{prescription.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {prescription.exercises.length} exercícios • desde{" "}
                        {new Date(prescription.startDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <StatusBadge status={prescription.isActive ? "Ativa" : "Inativa"} />
                  </div>
                </Card>
              ))}
            </div>
          ))}

        {tab === "evolucao" && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center gap-2 text-primary">
                <Activity className="h-4 w-4" />
                <p className="text-sm font-medium">Evolução clínica — escala de dor</p>
              </div>
              {painLoading ? (
                <Skeleton className="mt-4 h-24 w-full" />
              ) : painData && painData.length > 0 ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Dor reduzida de {painData[0]?.painLevel ?? "—"} para{" "}
                    {painData[painData.length - 1]?.painLevel ?? "—"} nas últimas semanas.
                  </p>
                  <div className="mt-4 flex h-24 items-end gap-2">
                    {painData.map((entry: { painLevel: number; date: string }, index: number) => (
                      <div
                        key={`${entry.date}-${index}`}
                        className="flex-1 rounded-t-md bg-primary/30 transition-all"
                        style={{ height: `${(entry.painLevel ?? 0) * 10}%` }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">Escala de dor (sessões)</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Sem dados de evolução disponíveis. Os dados aparecerão aqui conforme o paciente
                  for avaliado.
                </p>
              )}
            </Card>

            <Card>
              <div className="flex items-center gap-2 text-primary">
                <ClipboardList className="h-4 w-4" />
                <p className="text-sm font-medium">Aderência — histórico de check-ins</p>
              </div>
              {checkInsLoading ? (
                <Skeleton className="mt-4 h-20 w-full" />
              ) : checkInsData && checkInsData.data.length > 0 ? (
                <ul className="mt-3 divide-y divide-border text-sm">
                  {checkInsData.data.map((ci) => (
                    <li key={ci.id} className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">
                        {new Date(ci.executedAt).toLocaleDateString("pt-BR")}
                      </span>
                      <span>
                        Dor: <strong>{ci.painLevel ?? "—"}/10</strong>
                        {ci.feelingLevel != null && (
                          <> · Bem-estar: <strong>{ci.feelingLevel}/5</strong></>
                        )}
                      </span>
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-medium " +
                          (ci.completed
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700")
                        }
                      >
                        {ci.completed ? "Concluído" : "Parcial"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhum check-in registrado ainda.
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

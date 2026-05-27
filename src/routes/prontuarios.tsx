import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth";
import { Card, Button, EmptyState, ShellTitle, Field } from "@/components/app-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, FileText, ClipboardList, User } from "lucide-react";
import { patientService } from "@/services/patient.service";
import { medicalRecordService } from "@/services/medical-record.service";
import { toast } from "sonner";
import { extractApiError } from "@/lib/utils";

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary";

export const Route = createFileRoute("/prontuarios")({
  head: () => ({
    meta: [
      { title: "Prontuários — Maya RPG" },
      { name: "description", content: "Histórico clínico e avaliações funcionais dos pacientes." },
    ],
  }),
  component: ProntuariosPage,
});

function ProntuariosPage() {
  const { user } = useAuth();
  const [pacienteId, setPacienteId] = useState<string | undefined>();
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: pacientesData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientService.getAll({ page: 1, pageSize: 200 }),
  });

  const { data: registrosData, isLoading: loadingRegistros } = useQuery({
    queryKey: ["medical-records", pacienteId],
    queryFn: () => medicalRecordService.getByPatientId(pacienteId!, { page: 1, pageSize: 50 }),
    enabled: !!pacienteId,
  });

  const pacientes = pacientesData?.data ?? [];
  const filteredPatients = pacientes.filter((p) =>
    p.fullName.toLowerCase().includes(q.toLowerCase()),
  );
  const registros = registrosData?.data ?? [];
  const paciente = pacientes.find((p) => p.id === pacienteId);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    chiefComplaint: "",
    clinicalNotes: "",
    painLevel: "",
    mobilityNotes: "",
    postureAssessment: "",
    treatmentPlan: "",
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!pacienteId) throw new Error("Selecione um paciente");
      return medicalRecordService.create({
        patientId: pacienteId,
        professionalId: user?.id ?? "",
        date: formData.date ? `${formData.date}T00:00:00.000Z` : new Date().toISOString(),
        chiefComplaint: formData.chiefComplaint || undefined,
        clinicalNotes: formData.clinicalNotes,
        painLevel: formData.painLevel ? Number(formData.painLevel) : undefined,
        mobilityNotes: formData.mobilityNotes || undefined,
        postureAssessment: formData.postureAssessment || undefined,
        treatmentPlan: formData.treatmentPlan || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records", pacienteId] });
      toast.success("Registro criado");
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        chiefComplaint: "",
        clinicalNotes: "",
        painLevel: "",
        mobilityNotes: "",
        postureAssessment: "",
        treatmentPlan: "",
      });
    },
    onError: (err: unknown) => toast.error(extractApiError(err) ?? "Erro ao criar registro"),
  });

  const handleOpenForm = () => {
    if (!pacienteId) {
      toast.error("Selecione um paciente primeiro");
      return;
    }
    setShowForm(true);
  };

  return (
    <>
      <ShellTitle
        title="Prontuários"
        subtitle="Histórico clínico organizado em linha do tempo."
        actions={
          <Button variant="primary" onClick={handleOpenForm}>
            <Plus className="h-4 w-4" /> Novo registro
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="p-0">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar paciente…"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary"
              />
            </div>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto p-2">
            {filteredPatients.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setPacienteId(p.id)}
                  className={
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition " +
                    (pacienteId === p.id ? "bg-primary/10 text-primary" : "hover:bg-muted")
                  }
                >
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-semibold">
                    {p.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div>
          {paciente && (
            <Card className="mb-4 bg-gradient-hero">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-card text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Paciente selecionado
                  </p>
                  <h3 className="font-display text-2xl">{paciente.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{paciente.email}</p>
                </div>
                <Button variant="gold" onClick={handleOpenForm}>
                  <Plus className="h-4 w-4" /> Novo registro
                </Button>
              </div>
            </Card>
          )}

          {showForm && pacienteId && (
            <Card className="mb-4 border-primary/30">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">Novo registro clínico</h3>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Data">
                  <input
                    type="date"
                    className={inputCls}
                    value={formData.date}
                    onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
                  />
                </Field>
                <Field label="Queixa principal">
                  <input
                    className={inputCls}
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData((f) => ({ ...f, chiefComplaint: e.target.value }))}
                    placeholder="Ex: Dor cervical"
                  />
                </Field>
                <Field label="Notas clínicas">
                  <input
                    className={inputCls}
                    value={formData.clinicalNotes}
                    onChange={(e) => setFormData((f) => ({ ...f, clinicalNotes: e.target.value }))}
                    placeholder="Avaliação e observações"
                  />
                </Field>
                <Field label="Dor (0-10)">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    className={inputCls}
                    value={formData.painLevel}
                    onChange={(e) => setFormData((f) => ({ ...f, painLevel: e.target.value }))}
                    placeholder="0-10"
                  />
                </Field>
                <Field label="Mobilidade">
                  <input
                    className={inputCls}
                    value={formData.mobilityNotes}
                    onChange={(e) => setFormData((f) => ({ ...f, mobilityNotes: e.target.value }))}
                    placeholder="Observações de mobilidade"
                  />
                </Field>
                <Field label="Postura">
                  <input
                    className={inputCls}
                    value={formData.postureAssessment}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, postureAssessment: e.target.value }))
                    }
                    placeholder="Avaliação postural"
                  />
                </Field>
                <Field label="Plano de tratamento">
                  <input
                    className={inputCls}
                    value={formData.treatmentPlan}
                    onChange={(e) => setFormData((f) => ({ ...f, treatmentPlan: e.target.value }))}
                    placeholder="Próximos passos"
                  />
                </Field>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !formData.clinicalNotes || !user}
                >
                  {createMutation.isPending ? "Salvando..." : "Salvar registro"}
                </Button>
              </div>
            </Card>
          )}

          {!pacienteId ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhum paciente selecionado"
              description="Escolha um paciente na lista à esquerda para ver o histórico de prontuários."
            />
          ) : loadingRegistros ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : registros.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhum prontuário ainda"
              description="Comece registrando a primeira sessão deste paciente. O histórico aparecerá em uma timeline aqui."
              action={
                <Button variant="primary" onClick={handleOpenForm}>
                  <Plus className="h-4 w-4" /> Criar primeiro registro
                </Button>
              }
            />
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-6">
              {registros.map((r) => (
                <li key={r.id} className="relative">
                  <span className="absolute -left-[33px] top-3 grid h-6 w-6 place-items-center rounded-full border-2 border-background bg-gold text-gold-foreground">
                    <FileText className="h-3 w-3" />
                  </span>
                  <Card>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.date).toLocaleDateString("pt-BR")} • Dor: {r.painLevel ?? "—"}
                        /10
                      </p>
                      <Button variant="ghost">Ver detalhes</Button>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{r.clinicalNotes}</p>
                    {r.treatmentPlan && (
                      <p className="mt-1 text-xs text-muted-foreground">Plano: {r.treatmentPlan}</p>
                    )}
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}

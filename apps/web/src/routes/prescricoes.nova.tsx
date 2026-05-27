import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, ShellTitle, Field } from "@/components/app-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { patientService } from "@/services/patient.service";
import { exerciseService } from "@/services/exercise.service";
import { prescriptionService } from "@/services/prescription.service";
import { toast } from "sonner";
import type { PrescriptionExercise, Prescription } from "@/types";
import { dateInputToUTC, extractApiError } from "@/lib/utils";

declare module "@tanstack/react-router" {
  interface HistoryState {
    fromPrescription?: Prescription;
    patientId?: string;
  }
}

export const Route = createFileRoute("/prescricoes/nova")({
  head: () => ({
    meta: [
      { title: "Nova Prescrição — Maya RPG" },
      { name: "description", content: "Crie uma nova prescrição de exercícios para um paciente." },
    ],
  }),
  component: NovaPrescricao,
});

type Linha = {
  id: number;
  exerciseId: string;
  sets: string;
  repetitions: string;
  holdTimeSeconds: string;
  frequency: string;
  notes: string;
};

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary";

function NovaPrescricao() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const routerState = useRouterState();
  const fromPrescription = routerState.location.state?.fromPrescription;
  const statePatientId = routerState.location.state?.patientId;

  const [pacienteId, setPacienteId] = useState<string>(
    statePatientId ?? fromPrescription?.patientId ?? "",
  );
  const [titulo, setTitulo] = useState(
    fromPrescription ? `${fromPrescription.title} (renovação)` : "",
  );
  const [dataInicio, setDataInicio] = useState("");
  const [dataTermino, setDataTermino] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>([
    {
      id: 1,
      exerciseId: "",
      sets: "3",
      repetitions: "12",
      holdTimeSeconds: "10",
      frequency: "Diária",
      notes: "",
    },
  ]);

  useEffect(() => {
    if (fromPrescription?.exercises?.length) {
      const renewed = fromPrescription.exercises.map((ex, i) => ({
        id: Date.now() + i,
        exerciseId: ex.exerciseId,
        sets: ex.sets ? String(ex.sets) : "",
        repetitions: ex.repetitions ? String(ex.repetitions) : "",
        holdTimeSeconds: ex.holdTimeSeconds ? String(ex.holdTimeSeconds) : "",
        frequency: ex.frequency || "Diária",
        notes: ex.notes || "",
      }));
      setLinhas(renewed);
    }
  }, [fromPrescription]);

  const { data: pacientesData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientService.getAll({ page: 1, pageSize: 200 }),
  });

  const { data: exerciciosData } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => exerciseService.getAll({ page: 1, pageSize: 200 }),
  });

  const pacientes = pacientesData?.data ?? [];
  const exercicios = exerciciosData?.data ?? [];

  const add = () =>
    setLinhas((l) => [
      ...l,
      {
        id: Date.now(),
        exerciseId: "",
        sets: "",
        repetitions: "",
        holdTimeSeconds: "",
        frequency: "Diária",
        notes: "",
      },
    ]);
  const remove = (id: number) => setLinhas((l) => l.filter((x) => x.id !== id));
  const update = (id: number, patch: Partial<Linha>) =>
    setLinhas((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const createMutation = useMutation({
    mutationFn: () => {
      const exercises: PrescriptionExercise[] = linhas
        .filter((l) => l.exerciseId)
        .map((l, i) => ({
          exerciseId: l.exerciseId,
          sets: l.sets ? Number(l.sets) : undefined,
          repetitions: l.repetitions ? Number(l.repetitions) : undefined,
          holdTimeSeconds: l.holdTimeSeconds ? Number(l.holdTimeSeconds) : undefined,
          frequency: l.frequency || "Diária",
          notes: l.notes || undefined,
          order: i + 1,
        }));

      return prescriptionService.create({
        patientId: pacienteId,
        title: titulo,
        startDate: dataInicio ? dateInputToUTC(dataInicio) : new Date().toISOString(),
        endDate: dataTermino ? dateInputToUTC(dataTermino) : undefined,
        isActive: true,
        exercises,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      toast.success("Prescrição salva");
      navigate({ to: "/prescricoes" });
    },
    onError: (err: unknown) => {
      const message = extractApiError(err);
      toast.error(message ?? "Erro ao salvar prescrição");
    },
  });

  const onSubmit = () => {
    if (!pacienteId || !titulo || !dataInicio) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (!linhas.some((l) => l.exerciseId)) {
      toast.error("Adicione ao menos um exercício");
      return;
    }
    createMutation.mutate();
  };

  return (
    <>
      <ShellTitle
        title={fromPrescription ? "Renovar Prescrição" : "Nova Prescrição"}
        subtitle="Monte um plano de exercícios para o paciente."
      />

      <div className="space-y-5">
        <Card>
          <h3 className="font-display text-lg">Dados da prescrição</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Paciente">
                <Select value={pacienteId} onValueChange={setPacienteId}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                    <SelectValue placeholder="Selecionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Título da Prescrição">
                <input
                  className={inputCls}
                  placeholder="Ex: Plano cervical inicial"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Data de Início">
              <input
                type="date"
                className={inputCls}
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </Field>
            <Field label="Data de Término (opcional)">
              <input
                type="date"
                className={inputCls}
                value={dataTermino}
                onChange={(e) => setDataTermino(e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">Exercícios Prescritos</h3>
            <Button variant="soft" onClick={add}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {linhas.map((l) => (
              <Card key={l.id} className="p-4">
                <div className="grid gap-3 md:grid-cols-6">
                  <div className="md:col-span-2">
                    <Field label="Exercício">
                      <Select
                        value={l.exerciseId}
                        onValueChange={(v) => update(l.id, { exerciseId: v })}
                      >
                        <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {exercicios.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Séries">
                    <input
                      className={inputCls}
                      value={l.sets}
                      onChange={(e) => update(l.id, { sets: e.target.value })}
                    />
                  </Field>
                  <Field label="Repetições">
                    <input
                      className={inputCls}
                      value={l.repetitions}
                      onChange={(e) => update(l.id, { repetitions: e.target.value })}
                    />
                  </Field>
                  <Field label="Sustentação (s)">
                    <input
                      className={inputCls}
                      value={l.holdTimeSeconds}
                      onChange={(e) => update(l.id, { holdTimeSeconds: e.target.value })}
                    />
                  </Field>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Field label="Frequência">
                        <input
                          className={inputCls}
                          value={l.frequency}
                          onChange={(e) => update(l.id, { frequency: e.target.value })}
                          placeholder="Diária / 3x semana"
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(l.id)}
                      className="mt-6 grid h-11 w-11 place-items-center rounded-xl border border-border text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <Field label="Observações">
                    <textarea
                      className={inputCls + " min-h-[70px]"}
                      value={l.notes}
                      onChange={(e) => update(l.id, { notes: e.target.value })}
                    />
                  </Field>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link to="/prescricoes">Cancelar</Link>
          </Button>
          <Button variant="primary" onClick={onSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Salvando..." : "Salvar Prescrição"}
          </Button>
        </div>
      </div>
    </>
  );
}

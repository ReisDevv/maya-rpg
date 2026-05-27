import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Badge, Button, ShellTitle } from "@/components/app-shell";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Clock, X } from "lucide-react";
import { appointmentService } from "@/services/appointment.service";
import { patientService } from "@/services/patient.service";
import { toast } from "sonner";
import type { ClinicAppointment, AppointmentType } from "@/types";
import { extractApiError } from "@/lib/utils";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Maya RPG" },
      {
        name: "description",
        content: "Agende pacientes por dia, horário, duração e intervalo de preparo.",
      },
    ],
  }),
  component: AgendaPage,
});

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i);
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setDate(d.getDate() - d.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
}

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary";

function AgendaPage() {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [open, setOpen] = useState(false);

  const [pacienteId, setPacienteId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [duracao, setDuracao] = useState(50);
  const [intervalo, setIntervalo] = useState(10);
  const [tipo, setTipo] = useState<AppointmentType | "">("");
  const [observacoes, setObservacoes] = useState("");

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const { start, end } = useMemo(() => {
    const s = new Date(weekStart);
    const e = new Date(weekStart);
    e.setDate(weekStart.getDate() + 7);
    return { start: s, end: e };
  }, [weekStart]);

  const { data: pacientesData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientService.getAll({ page: 1, pageSize: 200 }),
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", weekStart.toISOString()],
    queryFn: () => appointmentService.getAppointmentsForRange(start, end),
  });

  const pacientes = pacientesData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => {
      const [year, month, day] = data.split("-").map(Number);
      const [hour, minute] = hora.split(":").map(Number);
      const dateTimeUTC = new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString();
      return appointmentService.create({
        patientId: pacienteId,
        dateTime: dateTimeUTC,
        durationMinutes: duracao,
        bufferMinutes: intervalo,
        type: tipo as AppointmentType,
        notes: observacoes || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Paciente agendado");
      setOpen(false);
      setPacienteId("");
      setData("");
      setHora("");
      setTipo("");
      setObservacoes("");
    },
    onError: (err: unknown) => {
      const message = extractApiError(err);
      toast.error(message ?? "Erro ao agendar");
    },
  });

  const onSubmit = () => {
    if (!pacienteId || !data || !hora || !tipo) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    createMutation.mutate();
  };

  const weekAppointments = useMemo(() => {
    const map = new Map<string, ClinicAppointment[]>();
    (appointments ?? []).forEach((a) => {
      const d = new Date(a.dateTime);
      const iso = d.toISOString().slice(0, 10);
      const list = map.get(iso) ?? [];
      list.push(a);
      map.set(iso, list);
    });
    return map;
  }, [appointments]);

  const todayIso = new Date().toISOString().slice(0, 10);

  const shift = (n: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + n * 7);
    setWeekStart(d);
  };

  const weekApptCount = appointments?.length ?? 0;

  return (
    <>
      <ShellTitle
        title="Agenda"
        subtitle="Semana clínica. Clique em um horário para agendar uma sessão."
        actions={
          <>
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
              <button
                onClick={() => shift(-1)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setWeekStart(startOfWeek(new Date()))}
                className="px-3 text-xs font-medium"
              >
                Hoje
              </button>
              <button
                onClick={() => shift(1)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Button variant="primary" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Novo agendamento
            </Button>
          </>
        }
      />

      <div className="space-y-5">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-muted/30 px-5 py-3 text-sm font-medium">
            {weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })} —{" "}
            {days[6].toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>

          <div className="grid grid-cols-[64px_repeat(7,1fr)] overflow-x-auto">
            <div />
            {days.map((d) => {
              const iso = d.toISOString().slice(0, 10);
              const isToday = iso === todayIso;
              return (
                <div
                  key={iso}
                  className={
                    "border-l border-border px-2 py-3 text-center " +
                    (isToday ? "bg-primary/5" : "")
                  }
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {DAY_LABELS[d.getDay()]}
                  </p>
                  <p className={"font-display text-xl " + (isToday ? "text-primary" : "")}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}

            {HOURS.map((h) => (
              <div key={h} className="contents">
                <div className="border-t border-border px-2 py-1 text-right text-[10px] text-muted-foreground">
                  {String(h).padStart(2, "0")}:00
                </div>
                {days.map((d) => {
                  const iso = d.toISOString().slice(0, 10);
                  const dayAppts = weekAppointments.get(iso) ?? [];
                  const slot = dayAppts.find((a) => Number(new Date(a.dateTime).getHours()) === h);
                  return (
                    <div key={iso + h} className="relative h-16 border-l border-t border-border">
                      {slot && (() => {
                        const isPending = slot.status === "PENDING";
                        return (
                          <div
                            className="absolute inset-1 flex flex-col rounded-lg p-2 text-[11px] shadow-soft"
                            style={
                              isPending
                                ? { backgroundColor: "color-mix(in oklab, var(--gold) 18%, transparent)", color: "var(--gold)" }
                                : { backgroundColor: "color-mix(in oklab, var(--primary) 18%, transparent)", color: "var(--primary)" }
                            }
                          >
                            <span className="font-semibold">
                              {new Date(slot.dateTime).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              • {slot.type}
                            </span>
                            <span className="truncate" style={{ color: "var(--foreground)" }}>
                              {slot.patientName ?? "Paciente"}
                            </span>
                            {isPending && (
                              <span className="text-[10px] font-medium opacity-70">Aguardando</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="flex items-center gap-2 text-primary">
              <CalIcon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">Sessões na semana</p>
            </div>
            <p className="font-display text-3xl">{weekApptCount}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-gold">
              <Clock className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">Horários livres</p>
            </div>
            <p className="font-display text-3xl">{Math.max(0, HOURS.length * 7 - weekApptCount)}</p>
            <p className="text-xs text-muted-foreground">Próximos 7 dias</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-coral">Conflitos</p>
            <p className="font-display text-3xl">0</p>
            <p className="text-xs text-muted-foreground">Sem sobreposições</p>
          </Card>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 bg-foreground/30 backdrop-blur-sm"
          />
          <aside className="h-full w-full max-w-md overflow-y-auto bg-background shadow-elevated">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-display text-xl">Novo agendamento</h2>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-muted transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              className="space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Paciente
                </label>
                <select
                  className={inputCls}
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                >
                  <option value="">Selecionar paciente</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Data
                  </label>
                  <input
                    type="date"
                    className={inputCls}
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Hora
                  </label>
                  <input
                    type="time"
                    className={inputCls}
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Duração (min)
                  </label>
                  <input
                    type="number"
                    className={inputCls}
                    value={duracao}
                    onChange={(e) => setDuracao(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Intervalo (min)
                  </label>
                  <input
                    type="number"
                    className={inputCls}
                    value={intervalo}
                    onChange={(e) => setIntervalo(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tipo
                </label>
                <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="">RPG, Avaliação...</option>
                  <option value="RPG">RPG</option>
                  <option value="AVALIACAO">Avaliação</option>
                  <option value="FISIO_ORTOPEDICA">Fisio Ortopédica</option>
                  <option value="RETORNO">Retorno</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Observações
                </label>
                <textarea
                  className={inputCls + " min-h-[100px]"}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Agendando..." : "Confirmar"}
                </Button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}

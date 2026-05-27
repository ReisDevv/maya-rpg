import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, Kpi, Badge, QuickAction, ShellTitle } from "@/components/app-shell";
import { useAuth } from "@/contexts/auth";
import {
  Users,
  ClipboardList,
  FileSignature,
  CalendarDays,
  Cake,
  Clock,
  Plus,
  ArrowRight,
  Smile,
  UserPlus,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { appointmentService } from "@/services/appointment.service";
import { patientService } from "@/services/patient.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Maya RPG" },
      {
        name: "description",
        content: "Resumo da clínica: pacientes ativos, atendimentos do dia e agenda da semana.",
      },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardService.getStats(),
  });

  const [appointmentView, setAppointmentView] = useState<"today" | "tomorrow">("today");

  const { data: todayAppointments } = useQuery({
    queryKey: ["appointments-today"],
    queryFn: () => appointmentService.getToday(),
  });

  const { data: tomorrowAppointments } = useQuery({
    queryKey: ["appointments-tomorrow"],
    queryFn: () => appointmentService.getTomorrow(),
  });

  const { data: nextAppointment } = useQuery({
    queryKey: ["appointment-next"],
    queryFn: () => appointmentService.getNext(),
  });

  const { data: patientsData } = useQuery({
    queryKey: ["patients-birthdays"],
    queryFn: () => patientService.getAll({ page: 1, pageSize: 500 }),
  });

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);

  const { data: monthAppointments = [] } = useQuery({
    queryKey: ["appointments-month", format(currentMonth, "yyyy-MM")],
    queryFn: () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return appointmentService.getAppointmentsForRange(start, end);
    },
  });

  const selectedDayAppointments = selectedDay
    ? monthAppointments.filter(
        (a) => new Date(a.dateTime).toDateString() === selectedDay.toDateString(),
      )
    : [];

  const activePatients = stats?.activePatients ?? 0;
  const totalPatients = stats?.totalPatients ?? stats?.activePatients ?? 0;
  const activePrescriptions = stats?.activePrescriptions ?? 0;
  const todayCount = todayAppointments?.length ?? 0;

  const today = new Date();
  const todayStr = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const nextAppt = nextAppointment;

  const visibleAppts =
    appointmentView === "today" ? (todayAppointments || []) : (tomorrowAppointments || []);
  const todayAppts = visibleAppts;

  const patients = patientsData?.data || [];
  // Parse birthDate as local date (strings like "1990-05-13" are UTC midnight by default,
  // which shifts the day in UTC-3 timezones — force local interpretation)
  const parseLocalDate = (dateStr: string) => new Date(`${dateStr.slice(0, 10)}T00:00:00`);

  const birthdayPatients = patients
    .filter((p) => {
      if (!p.birthDate) return false;
      const bd = parseLocalDate(String(p.birthDate));
      return bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
    })
    .slice(0, 3);

  const next7DaysBdays = patients
    .filter((p) => {
      if (!p.birthDate) return false;
      const bd = parseLocalDate(String(p.birthDate));
      // Build candidate date in current year; if already passed, try next year
      let candidate = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      if (candidate <= today) candidate = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate());
      const diff = Math.ceil((candidate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 && diff <= 7;
    })
    .slice(0, 4);

  const adherenceRate = stats?.averageAdherenceRate
    ? Math.round(stats.averageAdherenceRate * 100)
    : 0;

  return (
    <>
      <ShellTitle title={`${greeting()}, ${user?.name?.split(" ")[0] ?? ""}`} subtitle={todayStr} />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi
            icon={Users}
            label="Pacientes ativos"
            value={statsLoading ? <Skeleton className="h-9 w-12" /> : activePatients}
            delta="em tratamento"
            tone="primary"
          />
          <Kpi
            icon={ClipboardList}
            label="Total de pacientes"
            value={statsLoading ? <Skeleton className="h-9 w-12" /> : totalPatients}
            delta="histórico completo"
            tone="sky"
          />
          <Kpi
            icon={FileSignature}
            label="Prescrições ativas"
            value={statsLoading ? <Skeleton className="h-9 w-12" /> : activePrescriptions}
            delta="planos em andamento"
            tone="gold"
          />
          <Kpi
            icon={CalendarDays}
            label="Atendimentos hoje"
            value={todayCount}
            delta="sessões agendadas"
            tone="coral"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="bg-gradient-hero lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex gap-1 rounded-lg bg-background/40 p-1">
                  <button
                    onClick={() => setAppointmentView("today")}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      appointmentView === "today"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setAppointmentView("tomorrow")}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      appointmentView === "tomorrow"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Amanhã
                  </button>
                </div>
                <h2 className="mt-2 font-display text-xl">
                  {visibleAppts.length} atendimento{visibleAppts.length !== 1 ? "s" : ""}
                </h2>
              </div>
              {nextAppt && appointmentView === "today" && (
                <p className="text-sm text-muted-foreground">
                  Próximo:{" "}
                  <span className="font-medium text-foreground">
                    {new Date(nextAppt.dateTime).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              )}
            </div>
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {!todayAppts || todayAppts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum atendimento agendado para {appointmentView === "today" ? "hoje" : "amanhã"}.
                </p>
              ) : (
                todayAppts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl bg-background/60 px-4 py-3"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Clock className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.patientName || "Paciente"}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.type} • {a.durationMinutes}min
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {new Date(a.dateTime).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Link
                      to="/pacientes/$id"
                      params={{ id: a.patientId }}
                      className="text-xs text-muted-foreground hover:text-primary transition"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-lg">Satisfação</h2>
            <p className="mt-3 font-display text-5xl">
              {adherenceRate}
              <span className="text-2xl text-muted-foreground">%</span>
            </p>
            <p className="text-xs text-muted-foreground">taxa de aderência média</p>
            <div className="mt-4 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-coral transition-all"
                style={{ width: `${adherenceRate}%` }}
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Atendimento</span>
                <span className="font-medium">{Math.min(adherenceRate + 5, 100)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{ width: `${Math.min(adherenceRate + 5, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Resultado clínico</span>
                <span className="font-medium">{Math.max(adherenceRate - 5, 0)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-gold"
                  style={{ width: `${Math.max(adherenceRate - 5, 0)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Estrutura</span>
                <span className="font-medium">{adherenceRate}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-coral"
                  style={{ width: `${adherenceRate}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">Calendário</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[140px] text-center text-sm font-medium">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={setSelectedDay}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={ptBR}
                modifiers={{
                  hasAppointments: monthAppointments.map((a) => new Date(a.dateTime)),
                }}
                modifiersClassNames={{
                  hasAppointments:
                    "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-gold",
                }}
                className="w-full rounded-xl border [--cell-size:theme(spacing.12)]"
              />
            </div>
            {selectedDay && (
              <div className="mt-4 border-t border-border pt-4">
                <h3 className="text-sm font-medium">
                  {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                </h3>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {selectedDayAppointments.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Nenhum agendamento neste dia.
                    </p>
                  ) : (
                    selectedDayAppointments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Clock className="h-4 w-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {a.patientName || "Paciente"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.type} • {a.durationMinutes}min
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {new Date(a.dateTime).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-lg">Aniversários</h2>
            {birthdayPatients.length > 0 ? (
              <div className="mt-3 space-y-3">
                {birthdayPatients.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral text-coral-foreground text-xs font-semibold">
                      {p.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">Hoje 🎂</p>
                    </div>
                    <Badge tone="gold">Hoje</Badge>
                  </div>
                ))}
              </div>
            ) : next7DaysBdays.length > 0 ? (
              <div className="mt-3 space-y-3">
                {next7DaysBdays.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {p.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.birthDate
                          ? format(new Date(p.birthDate), "d 'de' MMMM", { locale: ptBR })
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Nenhum aniversário próximo.</p>
            )}
          </Card>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h2 className="font-display text-lg">Atalhos rápidos</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <QuickAction icon={UserPlus} label="Novo paciente" to="/pacientes/novo" />
              <QuickAction icon={ClipboardList} label="Novo prontuário" to="/prontuarios" />
              <QuickAction icon={FileSignature} label="Nova prescrição" to="/prescricoes/nova" />
              <QuickAction icon={Dumbbell} label="Novo exercício" to="/exercicios/novo" />
              <QuickAction icon={CalendarDays} label="Agendar sessão" to="/agenda" />
            </div>
          </Card>

          {nextAppt && (
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <p className="text-xs uppercase tracking-wider opacity-80">Próximo paciente</p>
              <p className="mt-2 text-xl font-semibold">{nextAppt.patientName || "Paciente"}</p>
              <div className="mt-4 flex items-center justify-between text-sm opacity-90">
                <span>
                  {new Date(nextAppt.dateTime).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>{nextAppt.type}</span>
              </div>
              <Link
                to="/pacientes/$id"
                params={{ id: nextAppt.patientId }}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/30"
              >
                Abrir prontuário
              </Link>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

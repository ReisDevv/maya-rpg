import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Badge, ShellTitle } from "@/components/app-shell";
import { Cake, ChevronLeft, ChevronRight, Gift } from "lucide-react";
import { patientService } from "@/services/patient.service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/aniversarios")({
  head: () => ({
    meta: [
      { title: "Aniversários — Maya RPG" },
      { name: "description", content: "Aniversariantes do dia, da semana e calendário do mês." },
    ],
  }),
  component: AniversariosPage,
});

function AniversariosPage() {
  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));
  const today = useMemo(() => new Date(todayStr + "T12:00:00"), [todayStr]);
  const [month, setMonth] = useState(today.getMonth());
  const year = today.getFullYear();

  const { data: pacientesData, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientService.getAll({ page: 1, pageSize: 500 }),
  });

  const pacientes = useMemo(() => pacientesData?.data ?? [], [pacientesData]);

  const monthName = new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todays = useMemo(
    () =>
      pacientes.filter((p) => {
        if (!p.birthDate) return false;
        const b = new Date(p.birthDate);
        return b.getDate() === today.getDate() && b.getMonth() === today.getMonth();
      }),
    [pacientes, today],
  );

  const next7 = useMemo(
    () =>
      pacientes.filter((p) => {
        if (!p.birthDate) return false;
        const b = new Date(p.birthDate);
        const ref = new Date(year, today.getMonth(), today.getDate());
        const cmp = new Date(year, b.getMonth(), b.getDate());
        const diff = (cmp.getTime() - ref.getTime()) / 86400000;
        return diff > 0 && diff <= 7;
      }),
    [pacientes, today, year],
  );

  const inMonth = useMemo(
    () => pacientes.filter((p) => p.birthDate && new Date(p.birthDate).getMonth() === month),
    [pacientes, month],
  );

  return (
    <>
      <ShellTitle title="Aniversários" subtitle="Celebre quem faz parte da clínica." />

      <div className="space-y-5">
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="bg-gradient-hero">
                <div className="flex items-center gap-2 text-coral">
                  <Cake className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">Hoje</p>
                </div>
                <h2 className="mt-1 font-display text-2xl">
                  {todays.length} aniversariante{todays.length === 1 ? "" : "s"}
                </h2>
                <ul className="mt-4 space-y-3">
                  {todays.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum aniversário hoje.</p>
                  )}
                  {todays.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-xl bg-card p-3">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-coral text-coral-foreground">
                        <Gift className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{p.fullName}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                      <Badge tone="gold">Hoje</Badge>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Próximos 7 dias
                </p>
                <h2 className="mt-1 font-display text-2xl">{next7.length} próximos</h2>
                <ul className="mt-4 space-y-2">
                  {next7.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum aniversário nos próximos 7 dias.
                    </p>
                  )}
                  {next7.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 border-b border-border py-2 last:border-0"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {p.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{p.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.birthDate
                            ? format(new Date(p.birthDate), "d 'de' MMMM", { locale: ptBR })
                            : ""}
                        </p>
                      </div>
                      <Badge tone="sky">enviar mensagem</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-xl">Calendário de {monthName}</h3>
                <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
                  <button
                    onClick={() => setMonth((m) => (m + 11) % 12)}
                    className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs font-medium capitalize">{monthName}</span>
                  <button
                    onClick={() => setMonth((m) => (m + 1) % 12)}
                    className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <div key={i} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={"b" + i} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const has = inMonth.filter((p) => new Date(p.birthDate).getDate() === day);
                  const isToday = today.getDate() === day && today.getMonth() === month;
                  return (
                    <div
                      key={day}
                      className={
                        "relative aspect-square rounded-xl border p-1.5 text-left transition " +
                        (has.length > 0
                          ? "border-gold bg-gold/10"
                          : "border-border bg-card hover:bg-muted/40") +
                        (isToday ? " ring-2 ring-primary" : "")
                      }
                    >
                      <span
                        className={
                          "text-xs font-medium " +
                          (has.length > 0 ? "text-gold" : "text-muted-foreground")
                        }
                      >
                        {day}
                      </span>
                      {has.length > 0 && (
                        <div className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-gold text-[10px] font-semibold text-gold-foreground">
                          {has.length}
                        </div>
                      )}
                      {has[0] && (
                        <p className="mt-1 truncate text-[9px] text-foreground">
                          {has[0].fullName.split(" ")[0]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
}

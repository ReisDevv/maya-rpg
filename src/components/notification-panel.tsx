import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, X, CalendarDays, Clock } from "lucide-react";
import { notificationService } from "@/services/notification.service";
import { appointmentService } from "@/services/appointment.service";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 5000,
  });

  const count = notifications.length;

  const handleStatusChange = async (appointmentId: string, status: "CONFIRMED" | "CANCELLED") => {
    try {
      await appointmentService.updateStatus(appointmentId, status);
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-today"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-next"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(status === "CONFIRMED" ? "Consulta confirmada" : "Consulta recusada");
    } catch {
      toast.error("Erro ao atualizar status do agendamento");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
          {count > 0 && (
            <p className="text-xs text-muted-foreground">
              {count} solicitação{count !== 1 ? "ões" : ""} pendente{count !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">Nenhuma notificação pendente</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const appt = n.appointment;
                const dateStr = appt.dateTime
                  ? format(new Date(appt.dateTime), "dd/MM/yyyy", { locale: ptBR })
                  : "";
                const timeStr = appt.dateTime
                  ? format(new Date(appt.dateTime), "HH:mm", { locale: ptBR })
                  : "";
                return (
                  <li key={n.id} className="px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-gold">
                      Solicitação de agendamento
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {appt.patientName || "Paciente"}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeStr}
                      </span>
                      {appt.type && <span>{appt.type}</span>}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleStatusChange(n.appointment.id, "CONFIRMED")}
                        className="inline-flex h-7 items-center gap-1 rounded-full bg-success/15 px-3 text-xs font-medium text-success-foreground transition hover:bg-success/25"
                      >
                        <Check className="h-3 w-3" /> Aceitar
                      </button>
                      <button
                        onClick={() => handleStatusChange(n.appointment.id, "CANCELLED")}
                        className="inline-flex h-7 items-center gap-1 rounded-full bg-destructive/10 px-3 text-xs font-medium text-destructive transition hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" /> Recusar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

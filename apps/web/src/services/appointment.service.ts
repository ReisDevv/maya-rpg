import { api } from "./api";
import type { ClinicAppointment, AppointmentPayload } from "@/types";

export const appointmentService = {
  async getAppointmentsForRange(start: Date, end: Date): Promise<ClinicAppointment[]> {
    const { data: response } = await api.get<ClinicAppointment[] | { data: ClinicAppointment[] }>(
      "appointments",
      {
        params: {
          page: 1,
          pageSize: 200,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      },
    );

    const appointments = Array.isArray(response) ? response : response?.data || [];

    const normalized = appointments
      .filter((a) => a.status !== "CANCELLED")
      .map((a) => ({
        ...a,
        patientName: a.patientName || a.patient?.fullName || "Paciente não informado",
        patientEmail: a.patientEmail || a.patient?.email,
        durationMinutes: a.durationMinutes ?? 50,
        bufferMinutes: a.bufferMinutes ?? 10,
      }));

    const startTime = start.getTime();
    const endTime = end.getTime();
    const filtered = normalized.filter((a) => {
      const time = new Date(a.dateTime).getTime();
      return time >= startTime && time < endTime;
    });

    return filtered.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  },

  async getToday(): Promise<ClinicAppointment[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return this.getAppointmentsForRange(start, end);
  },

  async getTomorrow(): Promise<ClinicAppointment[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return this.getAppointmentsForRange(start, end);
  },

  async getNext(): Promise<ClinicAppointment | null> {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setDate(now.getDate() + 30);
    const appointments = await this.getAppointmentsForRange(now, nextMonth);
    return appointments.find((a) => a.status === "CONFIRMED" || a.status === "PENDING") ?? null;
  },

  async create(payload: AppointmentPayload): Promise<ClinicAppointment> {
    const { data } = await api.post<ClinicAppointment>("appointments", payload);
    return data;
  },

  async updateStatus(id: string, status: ClinicAppointment["status"]): Promise<ClinicAppointment> {
    const { data } = await api.patch<ClinicAppointment>(`appointments/${id}`, { status });
    return data;
  },

  async getAvailability(date: string): Promise<{
    date: string;
    availableSlots: number;
    occupiedSlots: number;
    isFull: boolean;
    operatingHours: { open: string; close: string };
    slots?: { time: string; available: boolean; appointmentId: string | null }[];
  }> {
    try {
      const { data } = await api.get<{
        date: string;
        availableSlots: number;
        occupiedSlots: number;
        isFull: boolean;
        operatingHours: { open: string; close: string };
        slots?: { time: string; available: boolean; appointmentId: string | null }[];
      }>("appointments/availability", { params: { date } });
      return data;
    } catch {
      return this.calculateAvailabilityClientSide(date);
    }
  },

  async calculateAvailabilityClientSide(date: string): Promise<{
    date: string;
    availableSlots: number;
    occupiedSlots: number;
    isFull: boolean;
    operatingHours: { open: string; close: string };
    slots: { time: string; available: boolean; appointmentId: string | null }[];
  }> {
    const open = 8;
    const close = 18;
    const totalSlots = close - open;
    const start = new Date(date + "T00:00:00Z");
    const end = new Date(date + "T23:59:59Z");
    const appointments = await this.getAppointmentsForRange(start, end);
    const occupiedMap = new Map<number, string>();
    appointments
      .filter((a) => a.status === "CONFIRMED" || a.status === "PENDING")
      .forEach((a) => {
        const hour = new Date(a.dateTime).getHours();
        occupiedMap.set(hour, a.id);
      });

    const slots: { time: string; available: boolean; appointmentId: string | null }[] = [];
    let occupiedSlots = 0;
    for (let h = open; h < close; h++) {
      const time = `${String(h).padStart(2, "0")}:00`;
      const appointmentId = occupiedMap.get(h) ?? null;
      const available = !occupiedMap.has(h);
      if (!available) occupiedSlots++;
      slots.push({ time, available, appointmentId });
    }

    return {
      date,
      availableSlots: Math.max(0, totalSlots - occupiedSlots),
      occupiedSlots,
      isFull: occupiedSlots >= totalSlots,
      operatingHours: { open: "08:00", close: "18:00" },
      slots,
    };
  },
};

import { api } from "./api";

export interface PendingAppointmentNotification {
  id: string;
  type: "APPOINTMENT_REQUEST";
  createdAt: string;
  appointment: {
    id: string;
    patientId: string;
    patientName: string;
    dateTime: string;
    type: string;
    status: string;
  };
}

export const notificationService = {
  async getNotifications(): Promise<PendingAppointmentNotification[]> {
    const { data } = await api.get<PendingAppointmentNotification[]>("appointments/pending-requests");
    return Array.isArray(data) ? data : [];
  },
};

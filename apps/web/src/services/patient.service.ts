import { api, buildPaginatedParams } from "./api";
import type { PaginatedRequest, PaginatedResponse, Patient } from "@/types";
import { PatientStatus } from "@/types";

export type PatientPayload = Pick<
  Patient,
  "fullName" | "email" | "phone" | "birthDate" | "cpf" | "status" | "notes"
>;

export const patientService = {
  async getAll(
    params: PaginatedRequest,
    status?: PatientStatus,
  ): Promise<PaginatedResponse<Patient>> {
    const queryParams: Record<string, string | number> = buildPaginatedParams(params);
    if (status) queryParams["status"] = status;
    const { data } = await api.get<PaginatedResponse<Patient>>("patients", { params: queryParams });
    return data;
  },

  async getById(id: string): Promise<Patient> {
    const { data } = await api.get<Patient>(`patients/${id}`);
    return data;
  },

  async create(patient: PatientPayload): Promise<Patient> {
    const { data } = await api.post<Patient>("patients", patient);
    return data;
  },

  async update(id: string, patient: Partial<PatientPayload>): Promise<Patient> {
    const { data } = await api.patch<Patient>(`patients/${id}`, patient);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`patients/${id}`);
  },

  async sendReminder(id: string): Promise<{ sent: boolean; message: string }> {
    const { data } = await api.post<{ sent: boolean; message: string }>(`patients/${id}/reminders`);
    return data;
  },
};

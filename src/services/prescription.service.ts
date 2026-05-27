import { api, buildPaginatedParams } from "./api";
import type { PaginatedRequest, PaginatedResponse, Prescription } from "@/types";

export const prescriptionService = {
  async getAll(params: PaginatedRequest): Promise<PaginatedResponse<Prescription>> {
    const queryParams = buildPaginatedParams(params);
    const { data } = await api.get<PaginatedResponse<Prescription>>("prescriptions", {
      params: queryParams,
    });
    return data;
  },

  async getByPatientId(
    patientId: string,
    params: PaginatedRequest,
  ): Promise<PaginatedResponse<Prescription>> {
    const queryParams = buildPaginatedParams(params);
    const { data } = await api.get<PaginatedResponse<Prescription>>(
      `prescriptions/patient/${patientId}`,
      {
        params: queryParams,
      },
    );
    return data;
  },

  async getById(id: string): Promise<Prescription> {
    const { data } = await api.get<Prescription>(`prescriptions/${id}`);
    return data;
  },

  async create(
    prescription: Omit<Prescription, "id" | "createdAt" | "updatedAt" | "professionalId">,
  ): Promise<Prescription> {
    const { data } = await api.post<Prescription>("prescriptions", prescription);
    return data;
  },

  async update(id: string, prescription: Partial<Prescription>): Promise<Prescription> {
    const { data } = await api.patch<Prescription>(`prescriptions/${id}`, prescription);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`prescriptions/${id}`);
  },

  async deactivate(id: string): Promise<void> {
    await api.patch(`prescriptions/${id}/deactivate`, {});
  },
};

import { api, buildPaginatedParams } from "./api";
import type { PaginatedRequest, PaginatedResponse, MedicalRecord } from "@/types";

export const medicalRecordService = {
  async getByPatientId(
    patientId: string,
    params: PaginatedRequest,
  ): Promise<PaginatedResponse<MedicalRecord>> {
    const queryParams = buildPaginatedParams(params);
    const { data } = await api.get<PaginatedResponse<MedicalRecord>>(
      `medical-records/patient/${patientId}`,
      {
        params: queryParams,
      },
    );
    return data;
  },

  async getById(id: string): Promise<MedicalRecord> {
    const { data } = await api.get<MedicalRecord>(`medical-records/${id}`);
    return data;
  },

  async create(
    record: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt">,
  ): Promise<MedicalRecord> {
    const { data } = await api.post<MedicalRecord>("medical-records", record);
    return data;
  },

  async update(id: string, record: Partial<MedicalRecord>): Promise<MedicalRecord> {
    const { data } = await api.patch<MedicalRecord>(`medical-records/${id}`, record);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`medical-records/${id}`);
  },
};

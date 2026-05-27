import { api, buildPaginatedParams } from "./api";
import type { PaginatedRequest, PaginatedResponse, ExerciseExecution } from "@/types";

export const exerciseExecutionService = {
  async getByPatientId(
    patientId: string,
    params: PaginatedRequest,
  ): Promise<PaginatedResponse<ExerciseExecution>> {
    const queryParams = buildPaginatedParams(params);
    const { data } = await api.get<PaginatedResponse<ExerciseExecution>>(
      `check-ins/patient/${patientId}`,
      {
        params: queryParams,
      },
    );
    return data;
  },
};

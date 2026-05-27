import { api, buildPaginatedParams } from "./api";
import type { PaginatedRequest, PaginatedResponse, Exercise } from "@/types";
import { ExerciseCategory } from "@/types";

export const exerciseService = {
  async getAll(
    params: PaginatedRequest,
    category?: ExerciseCategory,
  ): Promise<PaginatedResponse<Exercise>> {
    const queryParams: Record<string, string | number> = buildPaginatedParams(params);
    if (category) queryParams["category"] = category;
    const { data } = await api.get<PaginatedResponse<Exercise>>("exercises", {
      params: queryParams,
    });
    return data;
  },

  async getById(id: string): Promise<Exercise> {
    const { data } = await api.get<Exercise>(`exercises/${id}`);
    return data;
  },

  async create(exercise: Omit<Exercise, "id" | "createdAt" | "updatedAt">): Promise<Exercise> {
    const { data } = await api.post<Exercise>("exercises", exercise);
    return data;
  },

  async update(id: string, exercise: Partial<Exercise>): Promise<Exercise> {
    const { data } = await api.patch<Exercise>(`exercises/${id}`, exercise);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`exercises/${id}`);
  },
};

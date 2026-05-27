import { api, buildPaginatedParams } from "./api";
import type { PaginatedRequest, PaginatedResponse, User, CreateStaffPayload } from "@/types";
import { UserRole } from "@/types";

export const userService = {
  async createStaff(payload: CreateStaffPayload): Promise<User> {
    const { data } = await api.post<User>("auth/staff", payload);
    return data;
  },

  async getAll(
    params: PaginatedRequest,
    role?: UserRole,
    isActive?: boolean,
  ): Promise<PaginatedResponse<User>> {
    const queryParams: Record<string, string | number | boolean> = buildPaginatedParams(params);
    if (role) queryParams["role"] = role;
    if (isActive !== undefined) queryParams["isActive"] = isActive;
    const { data } = await api.get<PaginatedResponse<User>>("users", { params: queryParams });
    return data;
  },

  async updateStatus(id: string, isActive: boolean): Promise<User> {
    const { data } = await api.patch<User>(`users/${id}/status`, { isActive });
    return data;
  },

};

import { api } from "./api";
import type { DashboardStats, PainEvolutionData } from "@/types";

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>("dashboard/stats");
    return data;
  },

  async getPainEvolution(patientId: string): Promise<PainEvolutionData[]> {
    const { data } = await api.get<PainEvolutionData[]>(`dashboard/evolution/${patientId}`);
    return data;
  },
};

import { api } from "./api";

export const lgpdService = {
  async exportData(): Promise<Blob> {
    const response = await api.get("/me/lgpd/export", {
      responseType: "blob",
    });
    return response.data;
  },

  async anonymizeData(): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>("/me/lgpd/anonymize", {});
    return data;
  },
};

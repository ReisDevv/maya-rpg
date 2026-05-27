import { api } from "./api";
import { env } from "@/lib/env";

export const mediaService = {
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<{ url: string }>("upload", formData);
    return data;
  },

  async uploadMultiple(files: FileList): Promise<{ urls: string[] }> {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    const { data } = await api.post<{ urls: string[] }>("upload/multiple", formData);
    return data;
  },
};

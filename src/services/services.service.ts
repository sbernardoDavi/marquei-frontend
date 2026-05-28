import { api } from "./api";
import type { Service } from "../types";

export const servicesService = {
  async getServices(): Promise<Service[]> {
    const response = await api.get<Service[]>("/services");
    return response.data;
  },

  async getServiceById(id: string): Promise<Service> {
    const response = await api.get<Service>(`/services/${id}`);
    return response.data;
  },

  async createService(data: Omit<Service, "id">): Promise<Service> {
    const response = await api.post<Service>("/services", data);
    return response.data;
  },

  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const response = await api.patch<Service>(`/services/${id}`, data);
    return response.data;
  },

  async deleteService(id: string): Promise<void> {
    await api.delete(`/services/${id}`);
  },
};

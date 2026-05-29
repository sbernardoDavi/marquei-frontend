import { api } from "./api";
import type { Client } from "../types";

export const clientsService = {
  async getClients(): Promise<Client[]> {
    const response = await api.get<Client[]>("/clients");
    return response.data;
  },

  async getClientById(id: string): Promise<Client> {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  async createClient(data: { userId: string; phone: string }): Promise<Client> {
    const response = await api.post<Client>("/clients", data);
    return response.data;
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const response = await api.patch<Client>(`/clients/${id}`, data);
    return response.data;
  },

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};

import { api } from "./api";
import type { Professional, WorkSchedule } from "../types";

export const professionalsService = {
  async getProfessionals(): Promise<Professional[]> {
    const response = await api.get<Professional[]>("/professionals");
    return response.data;
  },

  async getProfessionalById(id: string): Promise<Professional> {
    const response = await api.get<Professional>(`/professionals/${id}`);
    return response.data;
  },

  async createProfessional(data: {
    userId: string;
    serviceIds: string[];
  }): Promise<Professional> {
    const response = await api.post<Professional>("/professionals", data);
    return response.data;
  },

  async updateProfessional(
    id: string,
    data: { serviceIds?: string[] },
  ): Promise<Professional> {
    const response = await api.patch<Professional>(
      `/professionals/${id}`,
      data,
    );
    return response.data;
  },

  async deleteProfessional(id: string): Promise<void> {
    await api.delete(`/professionals/${id}`);
  },

  async getWorkSchedules(professionalId: string): Promise<WorkSchedule[]> {
    const response = await api.get<WorkSchedule[]>(
      `/professionals/${professionalId}/work-schedules`,
    );
    return response.data;
  },

  async createWorkSchedule(
    professionalId: string,
    data: { dayOfWeek: string; startTime: string; endTime: string },
  ): Promise<WorkSchedule> {
    const response = await api.post<WorkSchedule>(
      `/professionals/${professionalId}/work-schedules`,
      data,
    );
    return response.data;
  },

  async deleteWorkSchedule(
    professionalId: string,
    scheduleId: string,
  ): Promise<void> {
    await api.delete(
      `/professionals/${professionalId}/work-schedules/${scheduleId}`,
    );
  },
};

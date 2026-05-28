import { api } from "./api";
import type {
  Appointment,
  AvailableSlot,
  AvailableSlotsRequest,
  CreateAppointmentRequest,
  PaginatedResponse,
  PaginationParams,
  RescheduleAppointmentRequest,
} from "../types";

export const appointmentsService = {
  async getAppointments(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Appointment>> {
    const response = await api.get<PaginatedResponse<Appointment>>(
      "/appointments",
      { params },
    );
    return response.data;
  },

  async getAppointmentById(id: string): Promise<Appointment> {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  async createAppointment(
    data: CreateAppointmentRequest,
  ): Promise<Appointment> {
    const response = await api.post<Appointment>("/appointments", data);
    return response.data;
  },

  async getAvailableSlots(
    data: AvailableSlotsRequest,
  ): Promise<AvailableSlot[]> {
    const response = await api.post<AvailableSlot[]>(
      "/appointments/available-slots",
      data,
    );
    return response.data;
  },

  async updateStatus(id: string, status: string): Promise<Appointment> {
    const response = await api.patch<Appointment>(
      `/appointments/${id}/status`,
      { status },
    );
    return response.data;
  },

  async reschedule(
    id: string,
    data: RescheduleAppointmentRequest,
  ): Promise<Appointment> {
    const response = await api.patch<Appointment>(
      `/appointments/${id}/reschedule`,
      data,
    );
    return response.data;
  },

  async deleteAppointment(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },
};

import { api } from "./api";
import type { Notification } from "../types";

export const notificationsService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>("/notifications");
    return response.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch("/notifications/read-all");
  },
};

import { api } from "./api";
import type {
  DashboardMetrics,
  OccupancyData,
  RevenueData,
  PopularService,
} from "../types";

export const dashboardService = {
  async getMetrics(
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardMetrics> {
    const params = { startDate, endDate };
    const response = await api.get<DashboardMetrics>("/dashboard/metrics", {
      params,
    });
    return response.data;
  },

  async getOccupancy(professionalId?: string): Promise<OccupancyData[]> {
    const params = professionalId ? { professionalId } : {};
    const response = await api.get<OccupancyData[]>("/dashboard/occupancy", {
      params,
    });
    return response.data;
  },

  async getRevenue(
    groupBy: "day" | "week" | "month" = "day",
  ): Promise<RevenueData[]> {
    const response = await api.get<RevenueData[]>("/dashboard/revenue", {
      params: { groupBy },
    });
    return response.data;
  },

  async getPopularServices(limit: number = 10): Promise<PopularService[]> {
    const response = await api.get<PopularService[]>(
      "/dashboard/popular-services",
      {
        params: { limit },
      },
    );
    return response.data;
  },
};

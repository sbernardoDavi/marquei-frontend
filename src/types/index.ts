// User Types
export type UserRole = "GESTOR" | "PROFISSIONAL" | "CLIENTE";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Work Schedule Types
export type DayOfWeek =
  | "SEGUNDA"
  | "TERCA"
  | "QUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SABADO"
  | "DOMINGO";

export interface WorkSchedule {
  id: string;
  professionalId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  createdAt?: string;
  updatedAt?: string;
}

// Professional Types
export interface Professional {
  id: string;
  userId: string;
  user: User;
  workSchedules: WorkSchedule[];
  services: Service[];
  createdAt?: string;
  updatedAt?: string;
}

// Client Types
export interface Client {
  id: string;
  userId: string;
  user: User;
  createdAt?: string;
  updatedAt?: string;
}

// Appointment Types
export type AppointmentStatus =
  | "AGENDADO"
  | "REALIZADO"
  | "NO_SHOW"
  | "CANCELADO";

export interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  status: AppointmentStatus;
  client: Client;
  professional: Professional;
  service: Service;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
}

export interface AvailableSlotsRequest {
  professionalId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
}

export interface CreateAppointmentRequest {
  clientId: string;
  professionalId: string;
  serviceId: string;
  startTime: string; // ISO 8601
}

export interface RescheduleAppointmentRequest {
  startTime: string; // ISO 8601
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  sent: boolean;
  sentAt: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

// Dashboard Types
export interface DashboardMetrics {
  totalAppointments: number;
  completedAppointments: number;
  noShowRate: number;
  totalRevenue: number;
  estimatedRevenue: number;
}

export interface OccupancyData {
  professionalId: string;
  professionalName: string;
  occupancyRate: number;
  totalSlots: number;
  bookedSlots: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  appointments: number;
}

export interface PopularService {
  serviceId: string;
  serviceName: string;
  count: number;
  revenue: number;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Import Types
export interface ImportJob {
  id: string;
  type: "clients" | "appointments";
  status: "pending" | "processing" | "completed" | "failed";
  fileName: string;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  createdAt: string;
  updatedAt: string;
}

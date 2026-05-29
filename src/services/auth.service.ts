import { api } from "./api";
import type { AuthResponse, LoginCredentials, User } from "../types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  async register(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: string;
  }) {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  async updateUser(
    userId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    },
  ): Promise<User> {
    const response = await api.patch<User>(`auth/users/${userId}`, data);
    return response.data;
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
  },

  saveAuth(authData: AuthResponse) {
    localStorage.setItem("access_token", authData.access_token);
    localStorage.setItem("user", JSON.stringify(authData.user));
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  getStoredToken(): string | null {
    return localStorage.getItem("access_token");
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  },
};

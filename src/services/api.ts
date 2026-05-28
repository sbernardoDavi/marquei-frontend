import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de requisição para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor de resposta para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só redirecionar para login se o usuário estiver autenticado e o token for inválido
    // Não redirecionar em erros da página de login
    if (error.response?.status === 401 && error.config?.url !== "/auth/login") {
      const token = localStorage.getItem("access_token");
      if (token) {
        // Token expirado ou inválido - só redirecionar se o usuário estava logado
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";
import { PrivateRoute } from "./components/PrivateRoute";
import { Layout } from "./components/layout/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Appointments } from "./pages/Appointments";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />

              <Route
                path="dashboard"
                element={
                  <PrivateRoute allowedRoles={["GESTOR"]}>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="agendamentos"
                element={
                  <PrivateRoute
                    allowedRoles={["GESTOR", "PROFISSIONAL", "CLIENTE"]}
                  >
                    <Appointments />
                  </PrivateRoute>
                }
              />

              <Route
                path="agenda"
                element={
                  <PrivateRoute allowedRoles={["PROFISSIONAL"]}>
                    <Appointments />
                  </PrivateRoute>
                }
              />
            </Route>

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

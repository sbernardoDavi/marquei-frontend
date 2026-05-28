import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { formatCurrency, formatPercentage } from "../utils/formatters";
import { Calendar, DollarSign, Users, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => dashboardService.getMetrics(),
  });

  const { data: occupancy, isLoading: occupancyLoading } = useQuery({
    queryKey: ["dashboard-occupancy"],
    queryFn: () => dashboardService.getOccupancy(),
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["dashboard-revenue"],
    queryFn: () => dashboardService.getRevenue("day"),
  });

  const { data: popularServices, isLoading: servicesLoading } = useQuery({
    queryKey: ["dashboard-popular-services"],
    queryFn: () => dashboardService.getPopularServices(5),
  });

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Agendamentos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.totalAppointments || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Agendamentos Realizados</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.completedAppointments || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de No-Show</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatPercentage(metrics?.noShowRate || 0)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Faturamento Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(metrics?.totalRevenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Ocupação por Profissional</CardTitle>
          </CardHeader>
          <CardContent>
            {occupancyLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Carregando...
              </div>
            ) : occupancy && occupancy.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={occupancy}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="professionalName" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Bar dataKey="occupancyRate" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Services Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Mais Procurados</CardTitle>
          </CardHeader>
          <CardContent>
            {servicesLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Carregando...
              </div>
            ) : popularServices && popularServices.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={popularServices}
                    dataKey="count"
                    nameKey="serviceName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {popularServices.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Faturamento ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Carregando...
            </div>
          ) : revenue && revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

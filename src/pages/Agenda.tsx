import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsService } from "../services/appointments.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { statusMap } from "../utils/formatters";
import { toast } from "sonner";
import { Calendar, Clock, User, Scissors } from "lucide-react";
import { cn } from "../utils/cn";
import type { Appointment } from "../types";
import { PeriodFilter } from "../components/appointments/PeriodFilter";

export function Agenda() {
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Inicializa o estado diretamente com a lógica de 7 dias padrão
  const [selectedPeriod, setSelectedPeriod] = useState<
    "7" | "15" | "30" | "custom"
  >("7");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 7);
    return today.toISOString().split("T")[0];
  });

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", "professional", startDate, endDate],
    queryFn: () => {
      const params: any = {
        page: 1,
        limit: 100,
        sortBy: "startTime",
        sortOrder: "asc",
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      return appointmentsService.getAppointments(params);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Status atualizado com sucesso!");
      setShowStatusModal(false);
      setSelectedAppointment(null);
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const handleStatusChange = (status: string) => {
    if (selectedAppointment) {
      updateStatusMutation.mutate({ id: selectedAppointment.id, status });
    }
  };

  // Atualiza os estados de controle superiores
  const handlePeriodChange = (
    period: "7" | "15" | "30" | "custom",
    newStartDate: string,
    newEndDate: string,
  ) => {
    setSelectedPeriod(period);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando agenda...</div>
      </div>
    );
  }

  const appointments = data?.data || [];

  const appointmentsByDate = appointments.reduce(
    (acc, appointment) => {
      const date = new Date(appointment.startTime).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(appointment);
      return acc;
    },
    {} as Record<string, Appointment[]>,
  );

  const sortedDates = Object.keys(appointmentsByDate).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minha Agenda</h1>
          <p className="text-gray-600 mt-1">Seus agendamentos</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Passando os estados necessários para o controle do filtro */}
          <PeriodFilter
            selectedPeriod={selectedPeriod}
            customStartDate={startDate}
            customEndDate={endDate}
            onPeriodChange={handlePeriodChange}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-3xl font-bold text-blue-600">
              {appointments.length}
            </p>
          </div>
        </Card>
        <Card className="bg-yellow-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">Agendados</p>
            <p className="text-3xl font-bold text-yellow-600">
              {appointments.filter((a) => a.status === "AGENDADO").length}
            </p>
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">Realizados</p>
            <p className="text-3xl font-bold text-green-600">
              {appointments.filter((a) => a.status === "REALIZADO").length}
            </p>
          </div>
        </Card>
        <Card className="bg-red-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">No-Show</p>
            <p className="text-3xl font-bold text-red-600">
              {appointments.filter((a) => a.status === "NO_SHOW").length}
            </p>
          </div>
        </Card>
      </div>

      {/* Appointments Timeline */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">
                Nenhum agendamento encontrado no período selecionado
              </p>
            </div>
          </Card>
        ) : (
          sortedDates.map((date) => {
            const dateAppointments = appointmentsByDate[date];
            const dateObj = new Date(date + "T00:00:00");
            const isToday = date === new Date().toISOString().split("T")[0];

            return (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "px-4 py-2 rounded-lg",
                      isToday
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-900",
                    )}
                  >
                    <p className="text-sm font-medium">
                      {dateObj.toLocaleDateString("pt-BR", { weekday: "long" })}
                    </p>
                    <p className="text-lg font-bold">
                      {dateObj.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-500">
                    {dateAppointments.length}{" "}
                    {dateAppointments.length === 1
                      ? "agendamento"
                      : "agendamentos"}
                  </span>
                </div>

                <div className="space-y-3">
                  {dateAppointments.map((appointment) => {
                    const startTime = new Date(appointment.startTime);
                    const isPast = startTime < new Date();
                    const isUpcoming =
                      !isPast && appointment.status === "AGENDADO";

                    return (
                      <Card
                        key={appointment.id}
                        className={cn(
                          "hover:shadow-lg transition-shadow",
                          isUpcoming && "border-l-4 border-l-primary-500",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <Clock size={20} className="text-primary-600" />
                                {startTime.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <span
                                className={cn(
                                  "px-3 py-1 rounded-full text-sm font-medium",
                                  statusMap[appointment.status]?.color,
                                )}
                              >
                                {statusMap[appointment.status]?.label}
                              </span>
                              {isUpcoming && (
                                <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                                  Próximo
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-2 text-gray-700">
                                <User size={18} className="text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Cliente
                                  </p>
                                  <p className="font-medium">
                                    {appointment.client.user.name}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-gray-700">
                                <Scissors size={18} className="text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Serviço
                                  </p>
                                  <p className="font-medium">
                                    {appointment.service.name}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-gray-700">
                                <Clock size={18} className="text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Duração
                                  </p>
                                  <p className="font-medium">
                                    {appointment.service.durationMinutes} min
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {appointment.status === "AGENDADO" && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowStatusModal(true);
                                }}
                              >
                                Alterar Status
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedAppointment(null);
        }}
        title="Alterar Status do Agendamento"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Selecione o novo status para o agendamento:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {["REALIZADO", "NO_SHOW", "CANCELADO"].map((status) => (
              <Button
                key={status}
                variant="secondary"
                onClick={() => handleStatusChange(status)}
                className={cn(
                  "h-20 flex flex-col items-center justify-center",
                  selectedAppointment?.status === status &&
                    "ring-2 ring-primary-500",
                )}
              >
                <span className="text-lg font-semibold">
                  {statusMap[status]?.label}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

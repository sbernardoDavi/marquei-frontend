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

export function Agenda() {
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", "professional", selectedDate],
    queryFn: () =>
      appointmentsService.getAppointments({
        page: 1,
        limit: 100,
        sortBy: "startTime",
        sortOrder: "asc",
      }),
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando agenda...</div>
      </div>
    );
  }

  // Filtrar agendamentos do profissional atual e data selecionada
  const appointments = (data?.data || []).filter((appointment) => {
    const appointmentDate = new Date(appointment.startTime)
      .toISOString()
      .split("T")[0];
    return appointmentDate === selectedDate;
  });

  const today = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === today;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minha Agenda</h1>
          <p className="text-gray-600 mt-1">
            {isToday ? "Seus agendamentos de hoje" : "Seus agendamentos"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">
                {isToday
                  ? "Você não tem agendamentos para hoje"
                  : "Nenhum agendamento nesta data"}
              </p>
            </div>
          </Card>
        ) : (
          appointments.map((appointment) => {
            const startTime = new Date(appointment.startTime);
            const isPast = startTime < new Date();
            const isUpcoming = !isPast && appointment.status === "AGENDADO";

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
                    {/* Time and Status */}
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

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <User size={18} className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Cliente</p>
                          <p className="font-medium">
                            {appointment.client.user.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Scissors size={18} className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Serviço</p>
                          <p className="font-medium">
                            {appointment.service.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock size={18} className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Duração</p>
                          <p className="font-medium">
                            {appointment.service.durationMinutes} min
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
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

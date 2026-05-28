import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsService } from "../services/appointments.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { formatDateTime, statusMap } from "../utils/formatters";
import { useAuth } from "../contexts/AuthContext";
import type { Appointment } from "../types";
import { toast } from "sonner";
import { Calendar, User, Scissors, Plus } from "lucide-react";
import { cn } from "../utils/cn";

export function Appointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", page],
    queryFn: () =>
      appointmentsService.getAppointments({
        page,
        limit: 10,
        sortBy: "startTime",
        sortOrder: "desc",
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

  const deleteAppointmentMutation = useMutation({
    mutationFn: appointmentsService.deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento cancelado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao cancelar agendamento");
    },
  });

  const handleStatusChange = (status: string) => {
    if (selectedAppointment) {
      updateStatusMutation.mutate({ id: selectedAppointment.id, status });
    }
  };

  const handleCancelAppointment = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
      deleteAppointmentMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando agendamentos...</div>
      </div>
    );
  }

  const appointments = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os agendamentos</p>
        </div>
        {user?.role === "CLIENTE" && (
          <Button>
            <Plus size={20} className="mr-2" />
            Novo Agendamento
          </Button>
        )}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">Nenhum agendamento encontrado</p>
            </div>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium",
                        statusMap[appointment.status]?.color,
                      )}
                    >
                      {statusMap[appointment.status]?.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      #{appointment.id.substring(0, 8)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Data/Hora</p>
                        <p className="font-medium">
                          {formatDateTime(appointment.startTime)}
                        </p>
                      </div>
                    </div>

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
                      <User size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Profissional</p>
                        <p className="font-medium">
                          {appointment.professional.user.name}
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
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  {(user?.role === "GESTOR" ||
                    user?.role === "PROFISSIONAL") && (
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
                  )}
                  {appointment.status === "AGENDADO" && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleCancelAppointment(appointment.id)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {page} de {meta.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page === meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

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
            {["AGENDADO", "REALIZADO", "NO_SHOW", "CANCELADO"].map((status) => (
              <Button
                key={status}
                variant="secondary"
                onClick={() => handleStatusChange(status)}
                className={cn(
                  selectedAppointment?.status === status &&
                    "ring-2 ring-primary-500",
                )}
              >
                {statusMap[status]?.label}
              </Button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

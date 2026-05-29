import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsService } from "../services/appointments.service";
import { professionalsService } from "../services/professionals.service";
import { servicesService } from "../services/services.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import {
  formatDateTime,
  statusMap,
  formatCurrency,
  formatDuration,
} from "../utils/formatters";
import { useAuth } from "../contexts/AuthContext";
import type { Appointment } from "../types";
import { toast } from "sonner";
import { Calendar, User, Scissors, Plus, Clock } from "lucide-react";
import { cn } from "../utils/cn";

export function Appointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [page, setPage] = useState(1);

  // Estado do formulário de novo agendamento
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", page, user?.id, user?.role],
    queryFn: () => {
      const params = {
        page,
        limit: 10,
        sortBy: "startTime",
        sortOrder: "desc" as const,
      };

      // Cliente usa endpoint específico
      if (user?.role === "CLIENTE") {
        return appointmentsService.getMyAppointments(params);
      }

      // Gestor e Profissional usam endpoint geral
      return appointmentsService.getAppointments(params);
    },
  });

  // Queries para novo agendamento
  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: professionalsService.getProfessionals,
    enabled: showNewAppointmentModal,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: servicesService.getServices,
    enabled: showNewAppointmentModal,
  });

  const { data: availableSlots = [], isLoading: loadingSlots } = useQuery({
    queryKey: [
      "available-slots",
      selectedProfessionalId,
      selectedServiceId,
      selectedDate,
    ],
    queryFn: () =>
      appointmentsService.getAvailableSlots({
        professionalId: selectedProfessionalId,
        serviceId: selectedServiceId,
        date: selectedDate,
      }),
    enabled: !!(selectedProfessionalId && selectedServiceId && selectedDate),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: appointmentsService.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
      handleCloseNewAppointmentModal();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Erro ao criar agendamento";
      toast.error(message);
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

  const handleOpenNewAppointmentModal = () => {
    setSelectedProfessionalId("");
    setSelectedServiceId("");
    setSelectedDate("");
    setSelectedTimeSlot("");
    setShowNewAppointmentModal(true);
  };

  const handleCloseNewAppointmentModal = () => {
    setShowNewAppointmentModal(false);
    setSelectedProfessionalId("");
    setSelectedServiceId("");
    setSelectedDate("");
    setSelectedTimeSlot("");
  };

  const handleCreateAppointment = () => {
    if (
      !user ||
      !selectedProfessionalId ||
      !selectedServiceId ||
      !selectedTimeSlot
    ) {
      toast.error("Preencha todos os campos");
      return;
    }

    createAppointmentMutation.mutate({
      clientId: user.id,
      professionalId: selectedProfessionalId,
      serviceId: selectedServiceId,
      startTime: selectedTimeSlot,
    });
  };

  // Obter detalhes do profissional e serviço selecionados
  const selectedProfessional = professionals.find(
    (p) => p.id === selectedProfessionalId,
  );
  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Extrair serviços do profissional (pode vir como array direto ou dentro de relacionamento)
  const professionalServices =
    selectedProfessional?.services?.map((item: any) => {
      // Se o serviço vier dentro de um objeto 'service', extrair
      return item.service || item;
    }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando agendamentos...</div>
      </div>
    );
  }

  const appointments = data?.data || [];
  const meta = data?.meta;

  // Mensagens personalizadas por role
  const getEmptyMessage = () => {
    if (user?.role === "CLIENTE") {
      return "Você ainda não tem agendamentos";
    }
    return "Nenhum agendamento encontrado";
  };

  const getPageTitle = () => {
    if (user?.role === "CLIENTE") {
      return "Meus Agendamentos";
    }
    if (user?.role === "PROFISSIONAL") {
      return "Meus Atendimentos";
    }
    return "Agendamentos";
  };

  const getPageDescription = () => {
    if (user?.role === "CLIENTE") {
      return "Visualize e gerencie seus agendamentos";
    }
    if (user?.role === "PROFISSIONAL") {
      return "Gerencie seus atendimentos";
    }
    return "Gerencie todos os agendamentos";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600 mt-1">{getPageDescription()}</p>
        </div>
        {user?.role === "CLIENTE" && (
          <Button onClick={handleOpenNewAppointmentModal}>
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
              <p className="text-gray-500">{getEmptyMessage()}</p>
              {user?.role === "CLIENTE" && (
                <Button
                  onClick={handleOpenNewAppointmentModal}
                  className="mt-4"
                >
                  <Plus size={20} className="mr-2" />
                  Fazer meu primeiro agendamento
                </Button>
              )}
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

                    {appointment.client && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <User size={18} className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Cliente</p>
                          <p className="font-medium text-green-700">
                            {appointment.client.user.name}
                          </p>
                        </div>
                      </div>
                    )}

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
                <div
                  className="flex gap-2 ml-4"
                  style={{ flexDirection: "column", gap: "1rem" }}
                >
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

      {/* New Appointment Modal */}
      <Modal
        isOpen={showNewAppointmentModal}
        onClose={handleCloseNewAppointmentModal}
        title="Novo Agendamento"
        size="lg"
      >
        <div className="space-y-6">
          {/* Step 1: Select Professional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Selecione o Profissional
            </label>
            <Select
              options={[
                { value: "", label: "Selecione um profissional" },
                ...professionals.map((p) => ({
                  value: p.id,
                  label: p.user.name,
                })),
              ]}
              value={selectedProfessionalId}
              onChange={(e) => {
                setSelectedProfessionalId(e.target.value);
                setSelectedServiceId("");
                setSelectedDate("");
                setSelectedTimeSlot("");
              }}
            />
          </div>

          {/* Step 2: Select Service */}
          {selectedProfessionalId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2. Selecione o Serviço
              </label>
              {professionalServices.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Este profissional não tem serviços cadastrados
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {professionalServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedServiceId(service.id);
                        setSelectedDate("");
                        setSelectedTimeSlot("");
                      }}
                      className={cn(
                        "p-4 border-2 rounded-lg text-left transition-all hover:border-primary-500",
                        selectedServiceId === service.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {service.name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDuration(service.durationMinutes)}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-primary-600">
                          {formatCurrency(service.price)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Date */}
          {selectedServiceId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3. Selecione a Data
              </label>
              <Input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTimeSlot("");
                }}
              />
            </div>
          )}

          {/* Step 4: Select Time Slot */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4. Selecione o Horário
              </label>
              {loadingSlots ? (
                <p className="text-sm text-gray-500">
                  Carregando horários disponíveis...
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhum horário disponível para esta data
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      onClick={() => setSelectedTimeSlot(slot.startTime)}
                      className={cn(
                        "p-3 border-2 rounded-lg text-center transition-all hover:border-primary-500",
                        selectedTimeSlot === slot.startTime
                          ? "border-primary-500 bg-primary-50 font-semibold"
                          : "border-gray-200",
                      )}
                    >
                      <Clock size={16} className="mx-auto mb-1 text-gray-600" />
                      <p className="text-sm">
                        {new Date(slot.startTime).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {selectedTimeSlot && selectedService && selectedProfessional && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">
                Resumo do Agendamento
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Profissional:</span>
                  <span className="font-medium">
                    {selectedProfessional.user.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Serviço:</span>
                  <span className="font-medium">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium">
                    {new Date(selectedDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Horário:</span>
                  <span className="font-medium">
                    {new Date(selectedTimeSlot).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(selectedService.price)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseNewAppointmentModal}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateAppointment}
              className="flex-1"
              disabled={!selectedTimeSlot}
              isLoading={createAppointmentMutation.isPending}
            >
              Confirmar Agendamento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

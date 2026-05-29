import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsService } from "../services/appointments.service";
import { professionalsService } from "../services/professionals.service";
import { servicesService } from "../services/services.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Drawer } from "../components/ui/Drawer";
import { Select } from "../components/ui/Select";
import {
  formatDateTime,
  statusMap,
  formatCurrency,
  formatDuration,
} from "../utils/formatters";
import { useAuth } from "../contexts/AuthContext";
import type { Appointment } from "../types";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronDown,
  Edit2,
} from "lucide-react";
import { cn } from "../utils/cn";
import { AppointmentCard } from "../components/appointments/AppointmentCard";
import { DateTimeSelector } from "../components/appointments/DateTimeSelector";

export function Appointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [page, setPage] = useState(1);

  // Estado do formulário de novo agendamento
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  // Estados para controlar seções expandidas
  const [expandedStep, setExpandedStep] = useState<number>(1);

  // Função para gerar todos os horários possíveis (8h às 20h, intervalos de 30min)
  const generateAllTimeSlots = (date: string) => {
    const slots = [];
    const [year, month, day] = date.split("-");

    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 20 && minute === 30) break;
        const isoString = `${year}-${month}-${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
        slots.push(isoString);
      }
    }
    return slots;
  };

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", page, user?.id, user?.role],
    queryFn: () => {
      const params = {
        page,
        limit: 10,
        sortBy: "startTime",
        sortOrder: "desc" as const,
      };

      if (user?.role === "CLIENTE") {
        return appointmentsService.getMyAppointments(params);
      }
      return appointmentsService.getAppointments(params);
    },
  });

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

  const {
    data: availableSlots = [],
    isLoading: loadingSlots,
    error: slotsError,
  } = useQuery({
    queryKey: [
      "available-slots",
      selectedProfessionalId,
      selectedServiceId,
      selectedDate,
    ],
    queryFn: async () => {
      const result = await appointmentsService.getAvailableSlots({
        professionalId: selectedProfessionalId,
        serviceId: selectedServiceId,
        date: selectedDate,
      });
      return result;
    },
    enabled: !!(selectedProfessionalId && selectedServiceId && selectedDate),
    retry: 1,
  });

  const {
    data: rescheduleSlotsData = [],
    isLoading: loadingRescheduleSlots,
    error: rescheduleSlotsError,
  } = useQuery({
    queryKey: [
      "reschedule-slots",
      selectedAppointment?.professional.id,
      selectedAppointment?.service.id,
      selectedDate,
    ],
    queryFn: async () => {
      if (!selectedAppointment) return [];
      const result = await appointmentsService.getAvailableSlots({
        professionalId: selectedAppointment.professional.id,
        serviceId: selectedAppointment.service.id,
        date: selectedDate,
      });
      return result;
    },
    enabled: !!(selectedAppointment && selectedDate && showRescheduleModal),
    retry: 1,
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

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, newStartTime }: { id: string; newStartTime: string }) =>
      appointmentsService.reschedule(id, { newStartTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento remarcado com sucesso!");
      handleCloseRescheduleModal();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Erro ao remarcar agendamento";
      toast.error(message);
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

  const handleOpenRescheduleModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate("");
    setSelectedTimeSlot("");
    setExpandedStep(1);
    setShowRescheduleModal(true);
  };

  const handleCloseRescheduleModal = () => {
    setShowRescheduleModal(false);
    setSelectedAppointment(null);
    setSelectedDate("");
    setSelectedTimeSlot("");
    setExpandedStep(1);
  };

  const handleReschedule = () => {
    if (!selectedAppointment || !selectedTimeSlot) {
      toast.error("Selecione uma nova data e horário");
      return;
    }

    rescheduleMutation.mutate({
      id: selectedAppointment.id,
      newStartTime: selectedTimeSlot,
    });
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
    setExpandedStep(1);
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

  const selectedProfessional = professionals.find(
    (p) => p.id === selectedProfessionalId,
  );
  const selectedService = services.find((s) => s.id === selectedServiceId);

  const professionalServices =
    selectedProfessional?.services?.map((item: any) => {
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

  const getEmptyMessage = () => {
    if (user?.role === "CLIENTE") {
      return "Você ainda não tem agendamentos";
    }
    return "Nenhum agendamento encontrado";
  };

  const getPageTitle = () => {
    if (user?.role === "CLIENTE") return "Meus Agendamentos";
    if (user?.role === "PROFISSIONAL") return "Meus Atendimentos";
    return "Agendamentos";
  };

  const getPageDescription = () => {
    if (user?.role === "CLIENTE")
      return "Visualize e gerencie seus agendamentos";
    if (user?.role === "PROFISSIONAL") return "Gerencie seus atendimentos";
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
              <CalendarIcon className="mx-auto text-gray-400 mb-4" size={48} />
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
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              userRole={user?.role}
              onChangeStatus={(apt) => {
                setSelectedAppointment(apt);
                setShowStatusModal(true);
              }}
              onReschedule={handleOpenRescheduleModal}
              onCancel={handleCancelAppointment}
            />
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

      {/* New Appointment Drawer */}
      <Drawer
        isOpen={showNewAppointmentModal}
        onClose={handleCloseNewAppointmentModal}
        title="Novo Agendamento"
        size="xl"
      >
        <div className="flex flex-col min-h-full">
          <div className="flex-1 space-y-4">
            {/* Step 1: Select Professional */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedStep(expandedStep === 1 ? 0 : 1)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-semibold text-sm">
                    1
                  </span>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      Selecione o Profissional
                    </p>
                    {selectedProfessionalId && selectedProfessional && (
                      <p className="text-sm text-gray-600">
                        {selectedProfessional.user.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedProfessionalId && (
                    <Edit2 size={16} className="text-gray-400" />
                  )}
                  <ChevronDown
                    size={20}
                    className={cn(
                      "text-gray-400 transition-transform",
                      expandedStep === 1 && "transform rotate-180",
                    )}
                  />
                </div>
              </button>
              {expandedStep === 1 && (
                <div className="p-4">
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
                      if (e.target.value) {
                        setExpandedStep(2);
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Step 2: Select Service */}
            {selectedProfessionalId && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedStep(expandedStep === 2 ? 0 : 2)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-semibold text-sm">
                      2
                    </span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        Selecione o Serviço
                      </p>
                      {selectedServiceId && selectedService && (
                        <p className="text-sm text-gray-600">
                          {selectedService.name} -{" "}
                          {formatCurrency(selectedService.price)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedServiceId && (
                      <Edit2 size={16} className="text-gray-400" />
                    )}
                    <ChevronDown
                      size={20}
                      className={cn(
                        "text-gray-400 transition-transform",
                        expandedStep === 2 && "transform rotate-180",
                      )}
                    />
                  </div>
                </button>
                {expandedStep === 2 && (
                  <div className="p-4">
                    {professionalServices.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Este profissional não tem serviços cadastrados
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {professionalServices.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => {
                              setSelectedServiceId(service.id);
                              setSelectedDate("");
                              setSelectedTimeSlot("");
                              setExpandedStep(3);
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
              </div>
            )}

            {/* Steps 3 & 4: Date and Time */}
            {selectedServiceId && (
              <DateTimeSelector
                selectedDate={selectedDate}
                selectedTimeSlot={selectedTimeSlot}
                expandedStep={expandedStep - 2}
                availableSlots={availableSlots}
                loadingSlots={loadingSlots}
                slotsError={slotsError}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTimeSlot("");
                  setExpandedStep(4);
                }}
                onTimeSelect={(time) => {
                  setSelectedTimeSlot(time);
                  setExpandedStep(0);
                }}
                onStepToggle={(step) =>
                  setExpandedStep(expandedStep === step + 2 ? 0 : step + 2)
                }
                generateAllTimeSlots={generateAllTimeSlots}
              />
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
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                        "pt-BR",
                      )}
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
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 pb-6 px-6 mt-auto border-t border-gray-200 bg-white">
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
      </Drawer>

      {/* Reschedule Appointment Drawer */}
      <Drawer
        isOpen={showRescheduleModal}
        onClose={handleCloseRescheduleModal}
        title="Remarcar Agendamento"
        size="xl"
      >
        <div className="flex flex-col min-h-full">
          <div className="flex-1 space-y-4">
            {/* Current Appointment Info */}
            {selectedAppointment && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Agendamento Atual
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">Profissional:</span>{" "}
                    {selectedAppointment.professional.user.name}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Serviço:</span>{" "}
                    {selectedAppointment.service.name}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Data/Hora:</span>{" "}
                    {formatDateTime(selectedAppointment.startTime)}
                  </p>
                </div>
              </div>
            )}

            {/* Date and Time Selector */}
            <DateTimeSelector
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              expandedStep={expandedStep}
              availableSlots={rescheduleSlotsData}
              loadingSlots={loadingRescheduleSlots}
              slotsError={rescheduleSlotsError}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setSelectedTimeSlot("");
                setExpandedStep(2);
              }}
              onTimeSelect={(time) => {
                setSelectedTimeSlot(time);
                setExpandedStep(0);
              }}
              onStepToggle={(step) =>
                setExpandedStep(expandedStep === step ? 0 : step)
              }
              generateAllTimeSlots={generateAllTimeSlots}
            />

            {/* Summary */}
            {selectedTimeSlot && selectedAppointment && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Novo Agendamento
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                        "pt-BR",
                      )}
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
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 pb-6 px-6 mt-auto border-t border-gray-200 bg-white">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseRescheduleModal}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleReschedule}
              className="flex-1"
              disabled={!selectedTimeSlot}
              isLoading={rescheduleMutation.isPending}
            >
              Confirmar Remarcação
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

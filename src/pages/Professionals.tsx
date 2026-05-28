import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { professionalsService } from "../services/professionals.service";
import { servicesService } from "../services/services.service";
import { authService } from "../services/auth.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Briefcase, Trash2, Clock, Calendar } from "lucide-react";
import { dayOfWeekMap } from "../utils/formatters";
import type { Professional, DayOfWeek } from "../types";

const professionalSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  serviceIds: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
});

const workScheduleSchema = z.object({
  dayOfWeek: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato inválido (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato inválido (HH:MM)"),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;
type WorkScheduleFormData = z.infer<typeof workScheduleSchema>;

export function Professionals() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals"],
    queryFn: professionalsService.getProfessionals,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: servicesService.getServices,
  });

  const {
    register: registerProfessional,
    handleSubmit: handleSubmitProfessional,
    reset: resetProfessional,
    formState: { errors: professionalErrors },
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
  });

  const {
    register: registerSchedule,
    handleSubmit: handleSubmitSchedule,
    reset: resetSchedule,
    formState: { errors: scheduleErrors },
  } = useForm<WorkScheduleFormData>({
    resolver: zodResolver(workScheduleSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProfessionalFormData) => {
      const userResponse = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      return professionalsService.createProfessional({
        userId: userResponse.user.id,
        serviceIds: data.serviceIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional criado com sucesso!");
      handleCloseModal();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Erro ao criar profissional";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: professionalsService.deleteProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir profissional");
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: ({
      professionalId,
      data,
    }: {
      professionalId: string;
      data: WorkScheduleFormData;
    }) => professionalsService.createWorkSchedule(professionalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Horário adicionado com sucesso!");
      resetSchedule();
    },
    onError: () => {
      toast.error("Erro ao adicionar horário");
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: ({
      professionalId,
      scheduleId,
    }: {
      professionalId: string;
      scheduleId: string;
    }) => professionalsService.deleteWorkSchedule(professionalId, scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Horário removido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover horário");
    },
  });

  const handleOpenModal = () => {
    resetProfessional({
      name: "",
      email: "",
      phone: "",
      password: "",
      serviceIds: [],
    });
    setSelectedServices([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetProfessional();
    setSelectedServices([]);
  };

  const handleOpenScheduleModal = (professional: Professional) => {
    setSelectedProfessional(professional);
    resetSchedule({
      dayOfWeek: "SEGUNDA",
      startTime: "09:00",
      endTime: "18:00",
    });
    setShowScheduleModal(true);
  };

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false);
    setSelectedProfessional(null);
    resetSchedule();
  };

  const onSubmitProfessional = (data: ProfessionalFormData) => {
    createMutation.mutate({ ...data, serviceIds: selectedServices });
  };

  const onSubmitSchedule = (data: WorkScheduleFormData) => {
    if (selectedProfessional) {
      createScheduleMutation.mutate({
        professionalId: selectedProfessional.id,
        data,
      });
    }
  };

  const handleDeleteSchedule = (professionalId: string, scheduleId: string) => {
    if (confirm("Tem certeza que deseja remover este horário?")) {
      deleteScheduleMutation.mutate({ professionalId, scheduleId });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este profissional?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando profissionais...</div>
      </div>
    );
  }

  const daysOfWeek: { value: DayOfWeek; label: string }[] = [
    { value: "SEGUNDA", label: "Segunda-feira" },
    { value: "TERCA", label: "Terça-feira" },
    { value: "QUARTA", label: "Quarta-feira" },
    { value: "QUINTA", label: "Quinta-feira" },
    { value: "SEXTA", label: "Sexta-feira" },
    { value: "SABADO", label: "Sábado" },
    { value: "DOMINGO", label: "Domingo" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profissionais</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os profissionais e suas jornadas
          </p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus size={20} className="mr-2" />
          Novo Profissional
        </Button>
      </div>

      {/* Professionals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {professionals.length === 0 ? (
          <Card className="col-span-full">
            <div className="text-center py-12">
              <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">Nenhum profissional cadastrado</p>
            </div>
          </Card>
        ) : (
          professionals.map((professional) => (
            <Card
              key={professional.id}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Briefcase className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {professional.user.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {professional.user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(professional.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                {/* Services */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Serviços:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {professional.services.map((service) => (
                      <span
                        key={service.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Work Schedule */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Jornada de Trabalho:
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenScheduleModal(professional)}
                    >
                      <Plus size={16} className="mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  {professional.workSchedules.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Nenhum horário definido
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {professional.workSchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="font-medium">
                              {dayOfWeekMap[schedule.dayOfWeek]}
                            </span>
                            <Clock size={14} className="text-gray-400 ml-2" />
                            <span>
                              {schedule.startTime} - {schedule.endTime}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleDeleteSchedule(professional.id, schedule.id)
                            }
                            className="text-danger-500 hover:text-danger-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Professional Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Novo Profissional"
        size="lg"
      >
        <form
          onSubmit={handleSubmitProfessional(onSubmitProfessional)}
          className="space-y-4"
        >
          <Input
            label="Nome Completo"
            placeholder="Carlos Silva"
            error={professionalErrors.name?.message}
            {...registerProfessional("name")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="carlos@email.com"
              error={professionalErrors.email?.message}
              {...registerProfessional("email")}
            />

            <Input
              label="Telefone (opcional)"
              type="tel"
              placeholder="(11) 99999-9999"
              error={professionalErrors.phone?.message}
              {...registerProfessional("phone")}
            />
          </div>

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            error={professionalErrors.password?.message}
            {...registerProfessional("password")}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serviços que realiza *
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-lg">
              {services.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">{service.name}</span>
                </label>
              ))}
            </div>
            {professionalErrors.serviceIds && (
              <p className="mt-1 text-sm text-danger-500">
                {professionalErrors.serviceIds.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={createMutation.isPending}
            >
              Criar Profissional
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Work Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={handleCloseScheduleModal}
        title="Adicionar Horário de Trabalho"
      >
        <form
          onSubmit={handleSubmitSchedule(onSubmitSchedule)}
          className="space-y-4"
        >
          <Select
            label="Dia da Semana"
            options={daysOfWeek}
            error={scheduleErrors.dayOfWeek?.message}
            {...registerSchedule("dayOfWeek")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Horário Início"
              type="time"
              error={scheduleErrors.startTime?.message}
              {...registerSchedule("startTime")}
            />

            <Input
              label="Horário Fim"
              type="time"
              error={scheduleErrors.endTime?.message}
              {...registerSchedule("endTime")}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseScheduleModal}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={createScheduleMutation.isPending}
            >
              Adicionar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

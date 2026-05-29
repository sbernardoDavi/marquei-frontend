import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { professionalsService } from "../services/professionals.service";
import { servicesService } from "../services/services.service";
import { authService } from "../services/auth.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import {
  WorkScheduleManager,
  type WorkSchedule,
} from "../components/WorkScheduleManager";
import { ProfessionalCard } from "../components/professionals/ProfessionalCard";
import { ProfessionalForm } from "../components/professionals/ProfessionalForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Users } from "lucide-react";

const professionalSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  serviceIds: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

const editProfessionalSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .optional()
    .or(z.literal("")),
  serviceIds: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
});

type EditProfessionalFormData = z.infer<typeof editProfessionalSchema>;

export function Professionals() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals"],
    queryFn: professionalsService.getProfessionals,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: servicesService.getServices,
  });

  const form = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      serviceIds: [],
    },
  });

  const editForm = useForm<EditProfessionalFormData>({
    resolver: zodResolver(editProfessionalSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      serviceIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (
      data: ProfessionalFormData & { workSchedules: WorkSchedule[] },
    ) => {
      // Primeiro criar o usuário
      const user = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: "PROFISSIONAL",
      });

      // Depois criar o profissional vinculado ao usuário
      const professional = await professionalsService.createProfessional({
        userId: user.user.id,
        serviceIds: data.serviceIds,
      });

      // Por fim, adicionar os horários de trabalho
      if (data.workSchedules.length > 0) {
        await Promise.all(
          data.workSchedules.map((schedule) =>
            professionalsService.createWorkSchedule(professional.id, schedule),
          ),
        );
      }

      return professional;
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

  const updateMutation = useMutation({
    mutationFn: async (
      data: EditProfessionalFormData & {
        userId: string;
        professionalId: string;
      },
    ) => {
      const { userId, professionalId, email, name, password, serviceIds } =
        data;

      // 1. Atualizar o usuário (email, nome e senha se fornecida)
      const userUpdateData: {
        name: string;
        email: string;
        password?: string;
      } = {
        name,
        email,
      };

      // Adicionar senha apenas se foi fornecida
      if (password && password.trim() !== "") {
        userUpdateData.password = password;
      }

      await authService.updateUser(userId, userUpdateData);

      // 2. Atualizar o profissional (nome e serviços)
      await professionalsService.updateProfessional(professionalId, {
        name,
        serviceIds,
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional atualizado com sucesso!");
      handleCloseEditModal();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Erro ao atualizar profissional";
      toast.error(message);
    },
  });

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const newServices = prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId];

      form.setValue("serviceIds", newServices);
      editForm.setValue("serviceIds", newServices);
      return newServices;
    });
  };

  const handleOpenModal = () => {
    form.reset();
    setSelectedServices([]);
    setWorkSchedules([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    form.reset();
    setSelectedServices([]);
    setWorkSchedules([]);
  };

  const handleOpenEditModal = (professional: any) => {
    setSelectedProfessional(professional);

    const serviceIds =
      professional.services?.map((item: any) => {
        const service = item.service || item;
        return service.id;
      }) || [];

    setSelectedServices(serviceIds);

    editForm.reset({
      name: professional.user.name,
      email: professional.user.email,
      password: "",
      serviceIds: serviceIds,
    });

    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedProfessional(null);
    editForm.reset();
    setSelectedServices([]);
  };

  const onSubmit = (data: ProfessionalFormData) => {
    createMutation.mutate({
      ...data,
      workSchedules,
    });
  };

  const onEditSubmit = (data: EditProfessionalFormData) => {
    if (!selectedProfessional) return;

    updateMutation.mutate({
      ...data,
      userId: selectedProfessional.user.id,
      professionalId: selectedProfessional.id,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando profissionais...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profissionais</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os profissionais da sua equipe
          </p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus size={20} className="mr-2" />
          Novo Profissional
        </Button>
      </div>

      {/* Professionals List */}
      <div className="space-y-4">
        {professionals.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">Nenhum profissional cadastrado</p>
              <Button onClick={handleOpenModal} className="mt-4">
                <Plus size={20} className="mr-2" />
                Cadastrar primeiro profissional
              </Button>
            </div>
          </Card>
        ) : (
          professionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
              onEdit={handleOpenEditModal}
            />
          ))
        )}
      </div>

      {/* Create Professional Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Novo Profissional"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <ProfessionalForm
            form={form}
            services={services}
            selectedServices={selectedServices}
            onToggleService={toggleService}
          />

          {/* Work Schedules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jornada de Trabalho
            </label>
            <WorkScheduleManager
              schedules={workSchedules}
              onSchedulesChange={setWorkSchedules}
            />
          </div>

          {/* Actions */}
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

      {/* Edit Professional Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Editar Profissional"
      >
        <form
          onSubmit={editForm.handleSubmit(onEditSubmit)}
          className="space-y-4"
        >
          <ProfessionalForm
            form={editForm}
            isEditMode={true}
            services={services}
            selectedServices={selectedServices}
            onToggleService={toggleService}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseEditModal}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={updateMutation.isPending}
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

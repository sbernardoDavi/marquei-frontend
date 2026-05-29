import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { professionalsService } from "../services/professionals.service";
import { servicesService } from "../services/services.service";
import { authService } from "../services/auth.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Drawer } from "../components/ui/Drawer";
import {
  WorkScheduleManager,
  type WorkSchedule,
} from "../components/WorkScheduleManager";
import { ProfessionalFormSteps } from "../components/professionals/ProfessionalFormSteps";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Users,
  Mail,
  Phone,
  User,
  Trash2,
  Calendar,
  Edit,
  Briefcase,
} from "lucide-react";
import { formatDate, phoneMask } from "../utils/formatters";

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
  const [showDrawer, setShowDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [expandedStep, setExpandedStep] = useState<number>(1);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals"],
    queryFn: professionalsService.getProfessionals,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: servicesService.getServices,
    enabled: showDrawer || showEditDrawer,
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
      handleCloseDrawer();
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
      handleCloseEditDrawer();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Erro ao atualizar profissional";
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

  const handleOpenDrawer = () => {
    form.reset();
    setSelectedServices([]);
    setWorkSchedules([]);
    setExpandedStep(1);
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    form.reset();
    setSelectedServices([]);
    setWorkSchedules([]);
    setExpandedStep(1);
  };

  const handleOpenEditDrawer = (professional: any) => {
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

    setExpandedStep(1);
    setShowEditDrawer(true);
  };

  const handleCloseEditDrawer = () => {
    setShowEditDrawer(false);
    setSelectedProfessional(null);
    editForm.reset();
    setSelectedServices([]);
    setExpandedStep(1);
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

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este profissional?")) {
      deleteMutation.mutate(id);
    }
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
        <Button onClick={handleOpenDrawer}>
          <Plus size={20} className="mr-2" />
          Novo Profissional
        </Button>
      </div>

      {/* Professionals Table */}
      <Card>
        {professionals.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">Nenhum profissional cadastrado</p>
            <Button onClick={handleOpenDrawer} className="mt-4">
              <Plus size={20} className="mr-2" />
              Cadastrar primeiro profissional
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Telefone
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Serviços
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Cadastro
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((professional) => (
                  <tr
                    key={professional.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="text-primary-600" size={20} />
                        </div>
                        <span className="font-medium text-gray-900">
                          {professional.user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={16} />
                        <span>{professional.user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone size={16} />
                        <span>
                          {professional.user.phone
                            ? phoneMask(professional.user.phone)
                            : "Não registrado"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {professional.services &&
                          professional.services.length > 0 ? (
                            professional.services
                              .slice(0, 2)
                              .map((item: any) => {
                                const service = item.service || item;
                                return (
                                  <span
                                    key={service.id}
                                    className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium"
                                  >
                                    {service.name}
                                  </span>
                                );
                              })
                          ) : (
                            <span className="text-sm text-gray-500">
                              Nenhum
                            </span>
                          )}
                          {professional.services &&
                            professional.services.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{professional.services.length - 2}
                              </span>
                            )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>
                          {professional.createdAt
                            ? formatDate(professional.createdAt)
                            : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditDrawer(professional)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(professional.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Professional Drawer */}
      <Drawer
        isOpen={showDrawer}
        onClose={handleCloseDrawer}
        title="Novo Profissional"
        size="xl"
      >
        <div className="flex flex-col min-h-full">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 space-y-4">
              <ProfessionalFormSteps
                form={form}
                services={services}
                selectedServices={selectedServices}
                onToggleService={toggleService}
                expandedStep={expandedStep}
                onStepToggle={setExpandedStep}
              />

              {/* Work Schedules */}
              {selectedServices.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jornada de Trabalho (opcional)
                  </label>
                  <WorkScheduleManager
                    schedules={workSchedules}
                    onSchedulesChange={setWorkSchedules}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 pb-6 px-6 mt-auto border-t border-gray-200 bg-white">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseDrawer}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={createMutation.isPending}
                disabled={selectedServices.length === 0}
              >
                Criar Profissional
              </Button>
            </div>
          </form>
        </div>
      </Drawer>

      {/* Edit Professional Drawer */}
      <Drawer
        isOpen={showEditDrawer}
        onClose={handleCloseEditDrawer}
        title="Editar Profissional"
        size="xl"
      >
        <div className="flex flex-col min-h-full">
          <form
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 space-y-4">
              <ProfessionalFormSteps
                form={editForm}
                isEditMode={true}
                services={services}
                selectedServices={selectedServices}
                onToggleService={toggleService}
                expandedStep={expandedStep}
                onStepToggle={setExpandedStep}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 pb-6 px-6 mt-auto border-t border-gray-200 bg-white">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseEditDrawer}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={updateMutation.isPending}
                disabled={selectedServices.length === 0}
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      </Drawer>
    </div>
  );
}

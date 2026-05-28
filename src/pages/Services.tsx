import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesService } from "../services/services.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Scissors } from "lucide-react";
import { formatCurrency, formatDuration } from "../utils/formatters";
import type { Service } from "../types";

const serviceSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  durationMinutes: z.coerce.number().min(1, "Duração deve ser maior que 0"),
  price: z.coerce.number().min(0, "Preço deve ser maior ou igual a 0"),
  description: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export function Services() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: servicesService.getServices,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  const createMutation = useMutation({
    mutationFn: servicesService.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço criado com sucesso!");
      handleCloseModal();
    },
    onError: () => {
      toast.error("Erro ao criar serviço");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      servicesService.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço atualizado com sucesso!");
      handleCloseModal();
    },
    onError: () => {
      toast.error("Erro ao atualizar serviço");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: servicesService.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir serviço");
    },
  });

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      reset({
        name: service.name,
        durationMinutes: service.durationMinutes,
        price: service.price,
        description: service.description || "",
      });
    } else {
      setEditingService(null);
      reset({
        name: "",
        durationMinutes: 0,
        price: 0,
        description: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    reset();
  };

  const onSubmit = (data: ServiceFormData) => {
    const serviceData = {
      name: data.name,
      durationMinutes: data.durationMinutes,
      price: data.price,
      description: data.description,
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: serviceData });
    } else {
      createMutation.mutate(serviceData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando serviços...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-600 mt-1">Gerencie os serviços oferecidos</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={20} className="mr-2" />
          Novo Serviço
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <Card className="col-span-full">
            <div className="text-center py-12">
              <Scissors className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">Nenhum serviço cadastrado</p>
            </div>
          </Card>
        ) : (
          services.map((service) => (
            <Card
              key={service.id}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Scissors className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDuration(service.durationMinutes)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {service.description && (
                  <p className="text-sm text-gray-600">{service.description}</p>
                )}

                {/* Price */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(service.price)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenModal(service)}
                    className="flex-1"
                  >
                    <Pencil size={16} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingService ? "Editar Serviço" : "Novo Serviço"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome do Serviço"
            placeholder="Ex: Corte de Cabelo"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duração (minutos)"
              type="number"
              placeholder="60"
              error={errors.durationMinutes?.message}
              {...register("durationMinutes")}
            />

            <Input
              label="Preço (R$)"
              type="number"
              step="0.01"
              placeholder="50.00"
              error={errors.price?.message}
              {...register("price")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              rows={3}
              placeholder="Descrição do serviço..."
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-danger-500">
                {errors.description.message}
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
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingService ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsService } from "../services/clients.service";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PhoneInput } from "../components/ui/PhoneInput";
import { Modal } from "../components/ui/Modal";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Mail, Phone, User, Trash2, Calendar } from "lucide-react";
import { formatDate } from "../utils/formatters";
import { authService } from "../services/auth.service";
import { phoneMask } from "../utils/formatters";

const clientSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido").optional(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type ClientFormData = z.infer<typeof clientSchema>;

export function Clients() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: clientsService.getClients,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      // Primeiro criar o usuário
      const userResponse = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: "CLIENTE",
      });
      // Depois criar o cliente
      return clientsService.createClient({
        userId: userResponse.user.id,
        phone: data.phone,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente criado com sucesso!");
      handleCloseModal();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Erro ao criar cliente";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: clientsService.deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir cliente");
    },
  });

  const handleOpenModal = () => {
    reset({
      name: "",
      email: "",
      phone: "",
      password: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = (data: ClientFormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando clientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Gerencie os clientes cadastrados</p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus size={20} className="mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Clients Table */}
      <Card>
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">Nenhum cliente cadastrado</p>
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
                    Cadastro
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="text-primary-600" size={20} />
                        </div>
                        <span className="font-medium text-gray-900">
                          {client.user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={16} />
                        <span>{client.user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone size={16} />
                        <span>
                          {phoneMask(client.phone) || "Não registrado"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>
                          {client.createdAt
                            ? formatDate(client.createdAt)
                            : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title="Novo Cliente">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome Completo"
            placeholder="João Silva"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Email"
            type="email"
            placeholder="joao@email.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                label="Telefone (opcional)"
                error={errors.phone?.message}
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

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
              Criar Cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

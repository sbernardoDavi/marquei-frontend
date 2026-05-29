import { type UseFormReturn } from "react-hook-form";
import { Input } from "../ui/Input";
import { cn } from "../../utils/cn";

interface ProfessionalFormProps {
  form: UseFormReturn<any>;
  isEditMode?: boolean;
  services: any[];
  selectedServices: string[];
  onToggleService: (serviceId: string) => void;
}

export function ProfessionalForm({
  form,
  isEditMode = false,
  services,
  selectedServices,
  onToggleService,
}: ProfessionalFormProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome Completo
        </label>
        <Input
          {...register("name", { required: "Nome é obrigatório" })}
          placeholder="Digite o nome completo"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">
            {String(errors.name.message)}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <Input
          type="email"
          {...register("email", {
            required: "Email é obrigatório",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Email inválido",
            },
          })}
          placeholder="email@exemplo.com"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">
            {String(errors.email.message)}
          </p>
        )}
      </div>

      {/* Telefone */}
      {/* <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telefone
        </label>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              value={field.value}
              onChange={field.onChange}
              placeholder="(00) 00000-0000"
            />
          )}
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">
            {String(errors.phone.message)}
          </p>
        )}
      </div> */}

      {/* Senha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Senha {isEditMode && "(deixe em branco para manter a atual)"}
        </label>
        <Input
          type="password"
          {...register("password", {
            required: isEditMode ? false : "Senha é obrigatória",
            minLength: {
              value: 6,
              message: "Senha deve ter no mínimo 6 caracteres",
            },
          })}
          placeholder="Digite a senha"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">
            {String(errors.password.message)}
          </p>
        )}
      </div>

      {/* Serviços */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Serviços que Realiza
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onToggleService(service.id)}
              className={cn(
                "p-3 border-2 rounded-lg text-left transition-all",
                selectedServices.includes(service.id)
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <p className="font-medium text-sm">{service.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {service.durationMinutes} min
              </p>
            </button>
          ))}
        </div>
        {errors.serviceIds && (
          <p className="text-red-500 text-sm mt-1">
            {String(errors.serviceIds.message)}
          </p>
        )}
      </div>
    </div>
  );
}

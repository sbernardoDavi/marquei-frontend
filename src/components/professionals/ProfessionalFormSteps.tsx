import { type UseFormReturn } from "react-hook-form";
import { Input } from "../ui/Input";
import { cn } from "../../utils/cn";
import { ChevronDown, Edit2 } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

interface ProfessionalFormStepsProps {
  form: UseFormReturn<any>;
  isEditMode?: boolean;
  services: any[];
  selectedServices: string[];
  onToggleService: (serviceId: string) => void;
  expandedStep: number;
  onStepToggle: (step: number) => void;
}

export function ProfessionalFormSteps({
  form,
  isEditMode = false,
  services,
  selectedServices,
  onToggleService,
  expandedStep,
  onStepToggle,
}: ProfessionalFormStepsProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = form;

  const name = watch("name");
  const email = watch("email");

  return (
    <div className="space-y-4">
      {/* Step 1: Dados Pessoais */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => onStepToggle(1)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-semibold text-sm">
              1
            </span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Dados Pessoais</p>
              {name && (
                <p className="text-sm text-gray-600">
                  {name} - {email}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {name && <Edit2 size={16} className="text-gray-400" />}
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
          <div className="p-4 space-y-4">
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

            {name && email && (
              <Button
                type="button"
                onClick={() => onStepToggle(2)}
                className="w-full"
              >
                Continuar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Serviços */}
      {name && email && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => onStepToggle(2)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-semibold text-sm">
                2
              </span>
              <div className="text-left">
                <p className="font-medium text-gray-900">
                  Serviços que Realiza
                </p>
                {selectedServices.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {selectedServices.length} serviço(s) selecionado(s)
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedServices.length > 0 && (
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
              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
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
                      {service.durationMinutes} min •{" "}
                      {formatCurrency(service.price)}
                    </p>
                  </button>
                ))}
              </div>
              {errors.serviceIds && (
                <p className="text-red-500 text-sm mt-2">
                  {String(errors.serviceIds.message)}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Adicionar import do Button
import { Button } from "../ui/Button";

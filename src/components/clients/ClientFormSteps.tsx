import { type UseFormReturn, Controller } from "react-hook-form";
import { Input } from "../ui/Input";
import { PhoneInput } from "../ui/PhoneInput";
import { cn } from "../../utils/cn";
import { ChevronDown, Edit2 } from "lucide-react";
import { Button } from "../ui/Button";

interface ClientFormStepsProps {
  form: UseFormReturn<any>;
  isEditMode?: boolean;
  expandedStep: number;
  onStepToggle: (step: number) => void;
}

export function ClientFormSteps({
  form,
  isEditMode = false,
  expandedStep,
  onStepToggle,
}: ClientFormStepsProps) {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = form;

  const name = watch("name");
  const email = watch("email");
  const phone = watch("phone");

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
                {...register("name", {
                  required: "Nome é obrigatório",
                  minLength: {
                    value: 3,
                    message: "Nome deve ter no mínimo 3 caracteres",
                  },
                })}
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

      {/* Step 2: Contato e Senha */}
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
                <p className="font-medium text-gray-900">Contato e Senha</p>
                {phone && (
                  <p className="text-sm text-gray-600">Telefone: {phone}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {phone && <Edit2 size={16} className="text-gray-400" />}
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
            <div className="p-4 space-y-4">
              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone (opcional)
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

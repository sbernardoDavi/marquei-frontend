import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useState, useEffect } from "react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirecionar baseado no role após login bem-sucedido
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "GESTOR":
          navigate("/dashboard", { replace: true });
          break;
        case "PROFISSIONAL":
          navigate("/agenda", { replace: true });
          break;
        case "CLIENTE":
          navigate("/agendamentos", { replace: true });
          break;
      }
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login({
        email: data.email,
        password: data.password,
      });
      // Redirecionamento será feito pelo useEffect quando user for atualizado
    } catch (error) {
      // Error is handled in AuthContext with toast
      // Não fazer nada aqui, apenas manter o usuário na página de login
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Marquei</h1>
          <p className="text-gray-600 mt-2">Sistema de Agendamento Online</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Entrar
          </Button>
        </form>

        {/* Test Credentials */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Credenciais de Teste:
          </p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <strong>Gestor:</strong> gestor@marquei.com / 123456
            </p>
            <p>
              <strong>Profissional:</strong> carlos@marquei.com / 123456
            </p>
            <p>
              <strong>Cliente:</strong> maria@cliente.com / 123456
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

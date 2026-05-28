import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatDate = (
  date: string | Date,
  pattern: string = "dd/MM/yyyy",
): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: ptBR });
};

export const formatTime = (time: string): string => {
  return time.substring(0, 5); // "09:00:00" -> "09:00"
};

export const formatDateTime = (dateTime: string): string => {
  return formatDate(dateTime, "dd/MM/yyyy 'às' HH:mm");
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const dayOfWeekMap: Record<string, string> = {
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

export const statusMap: Record<string, { label: string; color: string }> = {
  AGENDADO: { label: "Agendado", color: "bg-blue-100 text-blue-800" },
  REALIZADO: { label: "Realizado", color: "bg-green-100 text-green-800" },
  NO_SHOW: { label: "Não Compareceu", color: "bg-red-100 text-red-800" },
  CANCELADO: { label: "Cancelado", color: "bg-gray-100 text-gray-800" },
};

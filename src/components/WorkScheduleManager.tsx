import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Clock, Calendar, Trash2 } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { dayOfWeekMap } from "../utils/formatters";
import type { DayOfWeek } from "../types";

const workScheduleSchema = z.object({
  dayOfWeek: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato inválido (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato inválido (HH:MM)"),
});

type WorkScheduleFormData = z.infer<typeof workScheduleSchema>;

export interface WorkSchedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface WorkScheduleManagerProps {
  schedules: WorkSchedule[];
  onSchedulesChange: (schedules: WorkSchedule[]) => void;
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

export function WorkScheduleManager({
  schedules,
  onSchedulesChange,
}: WorkScheduleManagerProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkScheduleFormData>({
    resolver: zodResolver(workScheduleSchema),
    defaultValues: {
      dayOfWeek: "SEGUNDA",
      startTime: "09:00",
      endTime: "18:00",
    },
  });

  const addSchedule = (data: WorkScheduleFormData) => {
    if (!data.dayOfWeek || !data.startTime || !data.endTime) {
      return;
    }

    // Verificar se já existe horário para este dia
    const dayExists = schedules.some((s) => s.dayOfWeek === data.dayOfWeek);

    if (dayExists) {
      toast.error("Já existe um horário para este dia da semana");
      return;
    }

    // Adicionar novo horário
    onSchedulesChange([
      ...schedules,
      {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    ]);

    toast.success("Horário adicionado!");

    // Resetar formulário
    reset({
      dayOfWeek: "SEGUNDA",
      startTime: "09:00",
      endTime: "18:00",
    });
  };

  const removeSchedule = (dayOfWeek: string) => {
    onSchedulesChange(schedules.filter((s) => s.dayOfWeek !== dayOfWeek));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Jornada de Trabalho (opcional)
        </label>
      </div>

      {/* Formulário inline para adicionar horário */}
      <div className="p-3 bg-gray-50 rounded-lg space-y-3 mb-3">
        <Select
          label="Dia da Semana"
          options={daysOfWeek}
          error={errors.dayOfWeek?.message}
          {...register("dayOfWeek")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Início"
            type="time"
            error={errors.startTime?.message}
            {...register("startTime")}
          />
          <Input
            label="Fim"
            type="time"
            error={errors.endTime?.message}
            {...register("endTime")}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleSubmit(addSchedule)}
          className="w-full"
        >
          <Plus size={16} className="mr-1" />
          Adicionar Horário
        </Button>
      </div>

      {/* Lista de horários adicionados */}
      {schedules.length > 0 && (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div
              key={schedule.dayOfWeek}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-gray-400" />
                <span className="font-medium">
                  {dayOfWeekMap[schedule.dayOfWeek as DayOfWeek]}
                </span>
                <Clock size={14} className="text-gray-400 ml-2" />
                <span>
                  {schedule.startTime} - {schedule.endTime}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeSchedule(schedule.dayOfWeek)}
                className="text-danger-500 hover:text-danger-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

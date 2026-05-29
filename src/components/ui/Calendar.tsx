import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

interface CalendarProps {
  selectedDate?: string;
  onSelectDate: (date: string) => void;
  minDate?: string;
}

export function Calendar({
  selectedDate,
  onSelectDate,
  minDate,
}: CalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Obter primeiro dia do mês e total de dias
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Criar array de dias para exibir
  const calendarDays: Array<{
    day: number;
    isCurrentMonth: boolean;
    date: string;
  }> = [];

  // Dias do mês anterior
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarDays.push({ day, isCurrentMonth: false, date: dateStr });
  }

  // Dias do mês atual
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarDays.push({ day, isCurrentMonth: true, date: dateStr });
  }

  // Dias do próximo mês para completar a grade
  const remainingDays = 42 - calendarDays.length; // 6 semanas * 7 dias
  for (let day = 1; day <= remainingDays; day++) {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarDays.push({ day, isCurrentMonth: false, date: dateStr });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isDateDisabled = (dateStr: string) => {
    if (!minDate) return false;
    return dateStr < minDate;
  };

  const isToday = (dateStr: string) => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return dateStr === todayStr;
  };

  const isSelected = (dateStr: string) => {
    return dateStr === selectedDate;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 max-w-xs mx-auto">
      {/* Header com navegação de mês */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-600" />
        </button>
        <h3 className="text-sm font-semibold text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Nomes dos dias da semana */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayInfo, index) => {
          const disabled = isDateDisabled(dayInfo.date);
          const today = isToday(dayInfo.date);
          const selected = isSelected(dayInfo.date);

          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (!disabled && dayInfo.isCurrentMonth) {
                  onSelectDate(dayInfo.date);
                }
              }}
              disabled={disabled}
              className={cn(
                "aspect-square p-1.5 text-sm rounded-lg transition-all",
                "hover:bg-gray-100",
                !dayInfo.isCurrentMonth && "text-gray-300",
                dayInfo.isCurrentMonth && !disabled && "text-gray-900",
                disabled &&
                  "text-gray-300 cursor-not-allowed hover:bg-transparent",
                today &&
                  !selected &&
                  "bg-blue-50 font-semibold text-primary-600",
                selected &&
                  "bg-primary-600 text-white font-semibold hover:bg-primary-700",
              )}
            >
              {dayInfo.day}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-50 border border-primary-200"></div>
          <span>Hoje</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary-600"></div>
          <span>Selecionado</span>
        </div>
      </div>
    </div>
  );
}

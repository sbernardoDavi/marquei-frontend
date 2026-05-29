import { useState } from "react";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";
import { RangeCalendar } from "../ui/RangeCalendar";
import { Modal } from "../ui/Modal";

interface PeriodFilterProps {
  // Agora o pai diz qual é o período selecionado atualmente
  selectedPeriod: string;
  onPeriodChange: (
    period: "7" | "15" | "30" | "custom",
    startDate: string,
    endDate: string,
  ) => void;
  customStartDate: string;
  customEndDate: string;
}

type PeriodOption = "7" | "15" | "30" | "custom";

export function PeriodFilter({
  selectedPeriod,
  onPeriodChange,
  customStartDate: parentStart,
  customEndDate: parentEnd,
}: PeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [localStartDate, setLocalStartDate] = useState("");
  const [localEndDate, setLocalEndDate] = useState("");

  const periodOptions = [
    { value: "7" as PeriodOption, label: "Próximos 7 Dias" },
    { value: "15" as PeriodOption, label: "Próximos 15 Dias" },
    { value: "30" as PeriodOption, label: "Próximos 30 Dias" },
    { value: "custom" as PeriodOption, label: "Escolher Dias" },
  ];

  const getDateRange = (days: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = today.toISOString().split("T")[0];

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    return {
      startDate,
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const handlePeriodSelect = (period: PeriodOption) => {
    setIsOpen(false);

    if (period === "custom") {
      setLocalStartDate("");
      setLocalEndDate("");
      setShowCustomModal(true);
    } else {
      const days = parseInt(period);
      const { startDate, endDate } = getDateRange(days);
      onPeriodChange(period, startDate, endDate);
    }
  };

  const handleCustomDateApply = () => {
    if (!localStartDate || !localEndDate) return;

    if (localStartDate > localEndDate) {
      alert("A data inicial não pode ser maior que a data final");
      return;
    }

    onPeriodChange("custom", localStartDate, localEndDate);
    setShowCustomModal(false);
  };

  const handleCalendarDateSelect = (date: string) => {
    if (!localStartDate || (localStartDate && localEndDate)) {
      setLocalStartDate(date);
      setLocalEndDate("");
    } else {
      if (date < localStartDate) {
        setLocalEndDate(localStartDate);
        setLocalStartDate(date);
      } else {
        setLocalEndDate(date);
      }
    }
  };

  const getSelectedLabel = () => {
    if (selectedPeriod === "custom" && parentStart && parentEnd) {
      const start = new Date(parentStart + "T00:00:00").toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "2-digit" },
      );
      const end = new Date(parentEnd + "T00:00:00").toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "2-digit" },
      );
      return `${start} - ${end}`;
    }
    return periodOptions.find((opt) => opt.value === selectedPeriod)?.label;
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg",
            "hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          )}
        >
          <CalendarIcon size={18} className="text-gray-500" />
          <span>{getSelectedLabel()}</span>
          <ChevronDown
            size={16}
            className={cn(
              "text-gray-500 transition-transform",
              isOpen && "transform rotate-180",
            )}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePeriodSelect(option.value)}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors",
                    selectedPeriod === option.value &&
                      "bg-primary-50 text-primary-700 font-medium",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Escolher Período"
      >
        <div className="space-y-6">
          <RangeCalendar
            startDate={localStartDate}
            endDate={localEndDate}
            onSelectDate={handleCalendarDateSelect}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCustomDateApply}
              disabled={!localStartDate || !localEndDate}
              className={cn(
                "flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg transition-colors",
                "hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              Aplicar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

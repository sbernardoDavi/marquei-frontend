import { ChevronDown, Edit2, Clock } from "lucide-react";
import { Calendar } from "../ui/Calendar";
import { cn } from "../../utils/cn";
import type { AvailableSlot } from "../../types";

interface DateTimeSelectorProps {
  selectedDate: string;
  selectedTimeSlot: string;
  expandedStep: number;
  availableSlots: AvailableSlot[];
  loadingSlots: boolean;
  slotsError: any;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onStepToggle: (step: number) => void;
  generateAllTimeSlots: (date: string) => string[];
  minDate?: string;
}

export function DateTimeSelector({
  selectedDate,
  selectedTimeSlot,
  expandedStep,
  availableSlots,
  loadingSlots,
  slotsError,
  onDateSelect,
  onTimeSelect,
  onStepToggle,
  generateAllTimeSlots,
  minDate,
}: DateTimeSelectorProps) {
  return (
    <>
      {/* Step: Select Date */}
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
              <p className="font-medium text-gray-900">Selecione a Data</p>
              {selectedDate && (
                <p className="text-sm text-gray-600">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "pt-BR",
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedDate && <Edit2 size={16} className="text-gray-400" />}
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
          <div className="p-4">
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={onDateSelect}
              minDate={minDate || new Date().toISOString().split("T")[0]}
            />
          </div>
        )}
      </div>

      {/* Step: Select Time Slot */}
      {selectedDate && (
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
                <p className="font-medium text-gray-900">Selecione o Horário</p>
                {selectedTimeSlot && (
                  <p className="text-sm text-gray-600">
                    {new Date(selectedTimeSlot).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedTimeSlot && (
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
              {loadingSlots ? (
                <p className="text-sm text-gray-500">
                  Carregando horários disponíveis...
                </p>
              ) : slotsError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    Erro ao carregar horários disponíveis. Tente novamente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {generateAllTimeSlots(selectedDate).map((slotTime) => {
                    const isAvailable =
                      Array.isArray(availableSlots) &&
                      availableSlots.some(
                        (slot) => slot.startTime === slotTime,
                      );

                    return (
                      <button
                        key={slotTime}
                        onClick={() => {
                          if (isAvailable) {
                            onTimeSelect(slotTime);
                          }
                        }}
                        disabled={!isAvailable}
                        className={cn(
                          "p-3 border-2 rounded-lg text-center transition-all",
                          selectedTimeSlot === slotTime
                            ? "border-primary-500 bg-primary-50 font-semibold"
                            : isAvailable
                              ? "border-gray-200 hover:border-primary-500 cursor-pointer"
                              : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-50",
                        )}
                      >
                        <Clock
                          size={16}
                          className={cn(
                            "mx-auto mb-1",
                            isAvailable ? "text-gray-600" : "text-gray-400",
                          )}
                        />
                        <p
                          className={cn(
                            "text-sm",
                            isAvailable
                              ? "text-gray-900"
                              : "text-gray-400 line-through",
                          )}
                        >
                          {new Date(slotTime).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

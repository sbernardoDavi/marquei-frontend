import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Calendar, User, Scissors } from "lucide-react";
import { formatDateTime, statusMap } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import type { Appointment } from "../../types";

interface AppointmentCardProps {
  appointment: Appointment;
  userRole?: string;
  onChangeStatus?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (id: string) => void;
}

export function AppointmentCard({
  appointment,
  userRole,
  onChangeStatus,
  onReschedule,
  onCancel,
}: AppointmentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                statusMap[appointment.status]?.color,
              )}
            >
              {statusMap[appointment.status]?.label}
            </span>
            <span className="text-sm text-gray-500">
              #{appointment.id.substring(0, 8)}
            </span>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Data/Hora</p>
                <p className="font-medium">
                  {formatDateTime(appointment.startTime)}
                </p>
              </div>
            </div>

            {appointment.client && (
              <div className="flex items-center gap-2 text-gray-700">
                <User size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-medium text-green-700">
                    {appointment.client.user.name}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-700">
              <User size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Profissional</p>
                <p className="font-medium">
                  {appointment.professional.user.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Scissors size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Serviço</p>
                <p className="font-medium">{appointment.service.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex gap-2 ml-4"
          style={{ flexDirection: "column", gap: "1rem" }}
        >
          {(userRole === "GESTOR" || userRole === "PROFISSIONAL") &&
            onChangeStatus && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onChangeStatus(appointment)}
              >
                Alterar Status
              </Button>
            )}
          {appointment.status === "AGENDADO" && (
            <>
              {onReschedule && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onReschedule(appointment)}
                >
                  Remarcar
                </Button>
              )}
              {onCancel && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => onCancel(appointment.id)}
                >
                  Cancelar
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { User, Mail, Phone, Briefcase, Edit } from "lucide-react";
import { phoneMask } from "../../utils/formatters";

interface ProfessionalCardProps {
  professional: any;
  onEdit: (professional: any) => void;
}

export function ProfessionalCard({
  professional,
  onEdit,
}: ProfessionalCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <User size={24} className="text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {professional.user.name}
              </h3>
              <span className="text-sm text-gray-500">Profissional</span>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={16} className="text-gray-400" />
              <span className="text-sm">{professional.user.email}</span>
            </div>
            {professional.user.phone && (
              <div className="flex items-center gap-2 text-gray-700">
                <Phone size={16} className="text-gray-400" />
                <span className="text-sm">
                  {phoneMask(professional.user.phone)}
                </span>
              </div>
            )}
          </div>

          {/* Services */}
          {professional.services && professional.services.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  Serviços:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {professional.services.map((item: any) => {
                  const service = item.service || item;
                  return (
                    <span
                      key={service.id}
                      className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium"
                    >
                      {service.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onEdit(professional)}
        >
          <Edit size={16} className="mr-1" />
          Editar
        </Button>
      </div>
    </Card>
  );
}

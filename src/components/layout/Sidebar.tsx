import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Briefcase,
  Scissors,
  FileText,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../utils/cn";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    to: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["GESTOR"],
  },
  {
    to: "/agenda",
    icon: Calendar,
    label: "Agenda",
    roles: ["PROFISSIONAL"],
  },
  {
    to: "/agendamentos",
    icon: Calendar,
    label: "Agendamentos",
    roles: ["GESTOR", "CLIENTE"],
  },
  {
    to: "/servicos",
    icon: Scissors,
    label: "Serviços",
    roles: ["GESTOR"],
  },
  {
    to: "/profissionais",
    icon: Briefcase,
    label: "Profissionais",
    roles: ["GESTOR"],
  },
  {
    to: "/clientes",
    icon: Users,
    label: "Clientes",
    roles: ["GESTOR"],
  },
  {
    to: "/importacao",
    icon: FileText,
    label: "Importação",
    roles: ["GESTOR"],
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || ""),
  );

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-primary-400">Marquei</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white",
                    )
                  }
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="mb-3">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary-600">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

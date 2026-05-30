import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Kanban, Headset } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pipeline", label: "Pipeline (Leads)", icon: Kanban },
  { to: "/suporte", label: "Suporte", icon: Headset },
] as const;

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="flex h-full w-full flex-col bg-[#0a0a0a] border-r border-[#141414] px-3 py-5">
      <div className="px-2 pb-7 mb-2 border-b border-[#1a1a1a] flex items-center">
        <Logo variant="icon" className="h-20 w-auto object-contain mx-auto" />
      </div>

      <div className="px-2 mt-2 mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#444]">
          Menu
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => onNavigate?.()}
              className={[
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-[rgba(128,215,248,0.08)] text-[#80d7f8]"
                  : "text-[#666] hover:bg-white/[0.04] hover:text-[#ccc]",
              ].join(" ")}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[#80d7f8]" />
              )}
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-3 mt-3 border-t border-[#1a1a1a]">
        <button
          type="button"
          onClick={async () => {
            await signOut();
            onNavigate?.();
            navigate({ to: "/login" });
          }}
          className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-[9px] text-sm font-medium text-[#555] transition-colors duration-150 hover:bg-white/[0.04] hover:text-[#ef4444]"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { PageHeader } from "./PageHeader";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout({
  title,
  children,
  showFilters = true,
}: {
  title: string;
  children: ReactNode;
  showFilters?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-5 w-5 rounded-full border-2 border-[#80d7f8]/20 border-t-[#80d7f8] animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden md:flex md:w-[220px] md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar mobile — drawer overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-[240px] bg-[#0a0a0a] border-r border-[#141414] flex flex-col">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 z-20 text-[#555] hover:text-white transition-colors"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar mobile */}
        <div className="flex md:hidden items-center justify-between h-14 px-4 border-b border-[#141414] bg-black/80 backdrop-blur-xl flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#666] hover:text-white transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold tracking-wide">
            <span className="text-[#80d7f8]">L</span>UMIX - GABRIEL
          </span>
          <div className="w-5" />
        </div>

        <PageHeader title={title} showFilters={showFilters} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

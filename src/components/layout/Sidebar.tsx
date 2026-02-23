// src/components/layout/Sidebar.tsx - RESPONSIVO

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, FileText, Search, Settings, Menu, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard',   label: 'Painel',         icon: LayoutDashboard },
  { id: 'pipeline',    label: 'Pipeline',        icon: Users },
  { id: 'scripts',     label: 'Roteiros',        icon: FileText },
  { id: 'prospecting', label: 'Prospecção',      icon: Search },
  { id: 'settings',    label: 'Configurações',   icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setMobileOpen(false);
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-xl">⚡</span>
          </div>
          <div>
            <h1 className="font-bold text-xl">Click Fácil</h1>
            <p className="text-xs text-muted-foreground">CRM de Prospecção</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-6 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Versão 2.0</p>
          <p className="flex items-center gap-1">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Sistema Online
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── DESKTOP: sidebar fixa ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-card border-r border-border p-6 flex-col z-30">
        <NavContent />
      </aside>

      {/* ── MOBILE: botão hambúrguer ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center px-4 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-muted"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">⚡</span>
          </div>
          <span className="font-bold">Click Fácil</span>
        </div>
      </div>

      {/* ── MOBILE: drawer overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* fundo escuro */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* painel lateral */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-card p-6 flex flex-col shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileText, ShoppingBag, MessageCircle,
  Cpu, LogOut, ChevronLeft, ChevronRight, ExternalLink, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';

const NAV_ITEMS = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/recipes',      icon: BookOpen,        label: 'Receitas' },
  { to: '/admin/blog',         icon: FileText,        label: 'Blog' },
  { to: '/admin/products',     icon: ShoppingBag,     label: 'Produtos' },
  { to: '/admin/comments',     icon: MessageCircle,   label: 'Comentários' },
  { to: '/admin/ai-settings',  icon: Cpu,             label: 'Config. IA' },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-700/50 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">DC</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-white text-sm leading-tight truncate">Delícias Culinárias</p>
            <p className="text-xs text-gray-400 leading-tight">Painel Admin</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Visit site link */}
      <div className="px-3 pb-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Ver site' : undefined}
        >
          <ExternalLink size={18} className="shrink-0" />
          {!collapsed && <span>Ver site</span>}
        </a>
      </div>

      {/* User / logout */}
      <div className="border-t border-gray-700/50 p-3 shrink-0">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-primary text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{user?.email || 'Admin'}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0 ${
              collapsed ? 'mt-2' : ''
            }`}
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block border-t border-gray-700/50 p-2 shrink-0">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-center py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-gray-900 transition-all duration-300 shrink-0 ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={22} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">DC</span>
            </div>
            <span className="font-semibold text-gray-800 text-sm">Admin</span>
          </div>
        </div>

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

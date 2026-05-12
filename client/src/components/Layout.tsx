import React, { useState } from 'react';
import { Menu, X, BarChart3, Users, LogOut, UserMinus, RefreshCcw } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { supabase } from '../lib/supabase'; // Ajuste o caminho se necessário

interface LayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'efetivo' | 'afastamentos' | 'rotatividade' | 'medidas';
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/' },
    { id: 'efetivo', label: 'Efetivo', icon: Users, href: '/efetivo' },
    { id: 'afastamentos', label: 'Afastamentos', icon: UserMinus, href: '/afastamentos' },
    { id: 'rotatividade', label: 'Rotatividade', icon: RefreshCcw, href: '/rotatividade' },
    { id: 'medidas', label: 'Medidas Disciplinares', icon: Users, href: '/medidas' },
  ];

  return (
    <div className="flex h-screen bg-[#f4f7fe]">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-[#2b3674] text-white transition-all duration-300 flex flex-col shadow-lg`}
      >
        <div className="p-6 flex items-center justify-between border-b border-blue-700">
          {sidebarOpen && <h1 className="text-xl font-bold">HR Gestão</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <Link key={item.id} href={item.href}>
                <a
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-700">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-300 hover:bg-red-900/30 transition-colors font-medium"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <h2 className="text-2xl font-bold text-[#2b3674]">
            {menuItems.find(item => item.id === currentPage)?.label || 'Sistema'}
          </h2>
        </div>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

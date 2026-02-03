'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Wrench,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Zap,
  Bell,
  Search,
  User,
  BarChart3,
  Tags,
  Truck,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { cn, getInitials } from '@/lib/utils';
import { serviceOrdersApi } from '@/lib/api';

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/pdv', icon: ShoppingCart, label: 'PDV' },
  { href: '/dashboard/vendas', icon: BarChart3, label: 'Vendas' },
  { href: '/dashboard/produtos', icon: Package, label: 'Produtos' },
  { href: '/dashboard/categorias', icon: Tags, label: 'Categorias' },
  { href: '/dashboard/fornecedores', icon: Truck, label: 'Fornecedores' },
  { href: '/dashboard/clientes', icon: Users, label: 'Clientes' },
  { href: '/dashboard/ordens-servico', icon: Wrench, label: 'Ordens de Serviço' },
  { href: '/dashboard/financeiro', icon: DollarSign, label: 'Financeiro' },
  { href: '/dashboard/notas', icon: FileText, label: 'Notas/Recibos' },
  { href: '/dashboard/relatorios', icon: BarChart3, label: 'Relatórios' },
  { href: '/dashboard/usuarios', icon: User, label: 'Usuários' },
  { href: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isHydrated, isValidating, isAuthenticated } = useAuthHydration();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch overdue service orders count
  const { data: overdueData } = useQuery({
    queryKey: ['service-orders-overdue'],
    queryFn: () => serviceOrdersApi.getOverdueCount().then((res) => res.data),
    refetchInterval: 60000, // Refetch every minute
  });

  const overdueCount = overdueData?.count || 0;

  useEffect(() => {
    // Só redireciona após a hydration completa
    if (isHydrated && !isValidating && !isAuthenticated) {
      router.push('/login');
    }
  }, [isHydrated, isValidating, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Loading durante hydration
  if (!isHydrated || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">SmartFlux</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'sidebar-link',
                  isActive && 'sidebar-link-active'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
              {user?.name ? getInitials(user.name) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 w-72">
                <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos, clientes..."
                  className="bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder-slate-500 dark:placeholder-slate-400 outline-none w-full"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {overdueCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {overdueCount > 99 ? '99+' : overdueCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setNotificationsOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-soft-lg z-50"
                      >
                        <div className="p-4">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                            Notificações
                          </h3>
                          {overdueCount > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800">
                                <div className="w-8 h-8 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center">
                                  <Wrench className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-danger-900 dark:text-danger-100">
                                    Ordens de Serviço em Atraso
                                  </p>
                                  <p className="text-xs text-danger-700 dark:text-danger-300">
                                    {overdueCount} {overdueCount === 1 ? 'ordem' : 'ordens'} de serviço {overdueCount === 1 ? 'está' : 'estão'} atrasada{overdueCount === 1 ? '' : 's'}
                                  </p>
                                </div>
                              </div>
                              <Link
                                href="/dashboard/ordens-servico"
                                onClick={() => setNotificationsOpen(false)}
                                className="block w-full text-center py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                Ver Ordens de Serviço
                              </Link>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Bell className="w-6 h-6 text-green-600 dark:text-green-400" />
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Nenhuma notificação pendente
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{user?.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-soft-lg z-50"
                      >
                        <div className="p-2">
                          <Link
                            href="/dashboard/perfil"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <User className="w-4 h-4" />
                            Meu Perfil
                          </Link>
                          <Link
                            href="/dashboard/configuracoes"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Configurações
                          </Link>
                          <hr className="my-2 border-slate-200 dark:border-slate-800" />
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2.5 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg w-full transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sair
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

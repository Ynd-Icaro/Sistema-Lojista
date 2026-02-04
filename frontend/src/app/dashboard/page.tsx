'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  Wrench,
  DollarSign,
  ArrowRight,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { dashboardApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils';

export default function DashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardApi.getOverview(),
  });

  const { data: salesChart } = useQuery({
    queryKey: ['dashboard-sales-chart'],
    queryFn: () => dashboardApi.getSalesChart(7),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['dashboard-top-products'],
    queryFn: () => dashboardApi.getTopProducts(5),
  });

  const { data: recentSales } = useQuery({
    queryKey: ['dashboard-recent-sales'],
    queryFn: () => dashboardApi.getRecentSales(5),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: () => dashboardApi.getLowStock(5),
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ['dashboard-pending-orders'],
    queryFn: () => dashboardApi.getPendingOrders(5),
  });

  const { data: financial } = useQuery({
    queryKey: ['dashboard-financial'],
    queryFn: () => dashboardApi.getFinancial(),
  });

  const stats = [
    {
      label: 'Vendas Hoje',
      value: formatCurrency(overview?.today?.revenue || 0),
      subValue: `${overview?.today?.sales || 0} vendas`,
      icon: ShoppingCart,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Receita do Mês',
      value: formatCurrency(overview?.thisMonth?.revenue || 0),
      subValue: overview?.thisMonth?.revenueGrowth > 0 
        ? `+${overview?.thisMonth?.revenueGrowth}%` 
        : `${overview?.thisMonth?.revenueGrowth}%`,
      icon: overview?.thisMonth?.revenueGrowth >= 0 ? TrendingUp : TrendingDown,
      color: overview?.thisMonth?.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: overview?.thisMonth?.revenueGrowth >= 0 
        ? 'bg-green-100 dark:bg-green-900/30' 
        : 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Produtos',
      value: overview?.totals?.products || 0,
      subValue: `${overview?.totals?.lowStock || 0} com estoque baixo`,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Clientes',
      value: overview?.totals?.customers || 0,
      subValue: `+${overview?.thisMonth?.newCustomers || 0} este mês`,
      icon: Users,
      color: 'text-primary-500',
      bgColor: 'bg-primary-100 dark:bg-primary-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Visão geral do seu negócio</p>
        </div>
        
        <Link
          href="/dashboard/pdv"
          className="btn-primary"
        >
          <ShoppingCart className="w-5 h-5" />
          Abrir PDV
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {loadingOverview ? '...' : stat.value}
                </p>
                <p className={`text-sm mt-1 ${stat.color}`}>
                  {loadingOverview ? '...' : stat.subValue}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Vendas (últimos 7 dias)
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart || []}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top products chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Produtos Mais Vendidos
            </h2>
            <Link href="/dashboard/produtos" className="text-sm text-primary-600 hover:text-primary-500 flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Financial summary and alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-success-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Resumo Financeiro
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">Receitas</span>
              <span className="text-success-600 dark:text-success-400 font-semibold">
                {formatCurrency(financial?.income || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">Despesas</span>
              <span className="text-danger-600 dark:text-danger-400 font-semibold">
                {formatCurrency(financial?.expense || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">Saldo</span>
              <span className={`font-semibold ${
                (financial?.balance || 0) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
              }`}>
                {formatCurrency(financial?.balance || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Pendentes ({financial?.pending?.count || 0})
              </span>
              <span className="text-warning-600 dark:text-warning-400 font-semibold">
                {formatCurrency(financial?.pending?.total || 0)}
              </span>
            </div>
          </div>
          
          <Link
            href="/dashboard/financeiro"
            className="mt-4 btn-secondary w-full justify-center"
          >
            Ver Financeiro
          </Link>
        </motion.div>

        {/* Low stock alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Estoque Baixo
              </h2>
            </div>
            <Link href="/dashboard/produtos" className="text-sm text-primary-600 hover:text-primary-500">
              Ver todos
            </Link>
          </div>
          
          {lowStock && lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.map((product: any) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      SKU: {product.sku}
                    </p>
                  </div>
                  <span className="badge-danger">
                    {product.stock} un.
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
              Nenhum produto com estoque baixo
            </p>
          )}
        </motion.div>

        {/* Pending service orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                OS Pendentes
              </h2>
            </div>
            <Link href="/dashboard/ordens-servico" className="text-sm text-primary-600 hover:text-primary-500">
              Ver todas
            </Link>
          </div>
          
          {pendingOrders && pendingOrders.length > 0 ? (
            <div className="space-y-3">
              {pendingOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {order.customer?.name || 'Cliente'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <span className={`badge-${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
              Nenhuma OS pendente
            </p>
          )}
        </motion.div>
      </div>

      {/* Recent sales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Vendas Recentes
          </h2>
          <Link href="/dashboard/vendas" className="text-sm text-primary-600 hover:text-primary-500 flex items-center gap-1">
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Cliente
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Itens
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Total
                </th>
                <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {recentSales && recentSales.length > 0 ? (
                recentSales.map((sale: any) => (
                  <tr key={sale.id} className="table-row">
                    <td className="py-3">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {sale.customer?.name || 'Cliente Avulso'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {sale._count?.items || 0} itens
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm font-semibold text-success-600 dark:text-success-400">
                        {formatCurrency(sale.total)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDateTime(sale.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhuma venda recente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  X,
  Loader2,
  Check,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  FolderPlus,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { financialApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';
import { QuickTransactionCategoryModal } from '@/components/modals/QuickTransactionCategoryModal';
import { ViewToggle, useViewMode } from '@/components/ui/ViewToggle';

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().min(2, 'Descrição é obrigatória'),
  amount: z.number().min(0.01, 'Valor é obrigatório'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  paidDate: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']),
  notes: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function FinanceiroPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const { view, setView } = useViewMode('financeiro', 'list');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      status: 'PENDING',
    },
  });

  // Fetch dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: () => financialApi.getDashboard().then((res) => res.data),
  });

  // Fetch transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', filterType, filterStatus],
    queryFn: () =>
      financialApi.getTransactions({
        type: filterType || undefined,
        status: filterStatus || undefined,
        limit: 50,
      }).then((res) => res.data),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['transaction-categories'],
    queryFn: () => financialApi.getCategories().then((res) => res.data),
  });

  // Fetch cash flow
  const { data: cashFlowData } = useQuery({
    queryKey: ['cash-flow'],
    queryFn: () => financialApi.getCashFlow().then((res) => res.data),
  });

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: (data: TransactionForm) => financialApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      toast.success('Transação criada com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar transação');
    },
  });

  // Confirm payment mutation
  const confirmMutation = useMutation({
    mutationFn: (id: string) => financialApi.confirmPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      toast.success('Pagamento confirmado!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao confirmar pagamento');
    },
  });

  const openModal = (type: 'INCOME' | 'EXPENSE') => {
    setTransactionType(type);
    reset({
      type,
      status: 'PENDING',
      dueDate: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = (data: TransactionForm) => {
    createMutation.mutate(data);
  };

  const filteredCategories = categoriesData?.filter(
    (cat: any) => cat.type === (watch('type') || transactionType)
  );

  // Prepare pie chart data
  const pieData = dashboardData?.expensesByCategory?.map((item: any, index: number) => ({
    name: item.category,
    value: item.total,
    color: COLORS[index % COLORS.length],
  })) || [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financeiro</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Controle suas receitas e despesas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ViewToggle storageKey="financeiro" defaultView="list" onViewChange={setView} />
          <button onClick={() => openModal('INCOME')} className="btn-success">
            <ArrowDownRight className="w-5 h-5" />
            Nova Receita
          </button>
          <button onClick={() => openModal('EXPENSE')} className="btn-danger">
            <ArrowUpRight className="w-5 h-5" />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-success-500 to-success-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-success-100">Receitas (Recebidas)</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(dashboardData?.income || 0)}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-danger-500 to-danger-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-danger-100">Despesas (Pagas)</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(dashboardData?.expense || 0)}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`card ${
            (dashboardData?.balance || 0) >= 0
              ? 'bg-gradient-to-br from-primary-500 to-primary-600'
              : 'bg-gradient-to-br from-slate-500 to-slate-600'
          } text-white`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Saldo Atual</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(dashboardData?.balance || 0)}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">A Receber</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(dashboardData?.receivable?.total || 0)}
              </p>
              <p className="text-xs text-blue-100 mt-1">
                {dashboardData?.receivable?.count || 0} pendentes
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warning-100">A Pagar</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(dashboardData?.pending?.total || 0)}
              </p>
              <p className="text-xs text-warning-100 mt-1">
                {dashboardData?.pending?.count || 0} pendentes
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash flow chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Fluxo de Caixa (30 dias)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData || []}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="Receitas"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="Despesas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Expenses by category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Despesas por Categoria
          </h3>
          <div className="h-64 flex items-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full text-center text-slate-500 dark:text-slate-400">
                Nenhuma despesa registrada
              </div>
            )}
          </div>
          {pieData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.slice(0, 6).map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Transactions list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Transações
          </h3>
          <div className="flex gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input w-36"
            >
              <option value="">Todos tipos</option>
              <option value="INCOME">Receitas</option>
              <option value="EXPENSE">Despesas</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input w-36"
            >
              <option value="">Todos status</option>
              <option value="PENDING">Pendente</option>
              <option value="CONFIRMED">Confirmado</option>
            </select>
          </div>
        </div>

        {/* Card View */}
        {view === 'card' ? (
          isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : transactionsData?.data && transactionsData.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transactionsData.data.map((transaction: any) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-xl border-2 ${
                    transaction.type === 'INCOME'
                      ? 'border-success-200 dark:border-success-800 bg-success-50/50 dark:bg-success-900/10'
                      : 'border-danger-200 dark:border-danger-800 bg-danger-50/50 dark:bg-danger-900/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.type === 'INCOME'
                        ? 'bg-success-100 dark:bg-success-900/30'
                        : 'bg-danger-100 dark:bg-danger-900/30'
                    }`}>
                      {transaction.type === 'INCOME' ? (
                        <ArrowDownRight className="w-5 h-5 text-success-600 dark:text-success-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-danger-600 dark:text-danger-400" />
                      )}
                    </div>
                    <span className={`badge badge-${getStatusColor(transaction.status)}`}>
                      {getStatusLabel(transaction.status)}
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {transaction.description}
                  </h4>
                  {transaction.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {transaction.notes}
                    </p>
                  )}

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <FolderPlus className="w-4 h-4" />
                      {transaction.category?.name || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(transaction.dueDate)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className={`text-xl font-bold ${
                      transaction.type === 'INCOME'
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-danger-600 dark:text-danger-400'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                    {transaction.status === 'PENDING' && (
                      <button
                        onClick={() => confirmMutation.mutate(transaction.id)}
                        className="btn-success text-xs py-1 px-2"
                        disabled={confirmMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                        Confirmar
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              Nenhuma transação encontrada
            </div>
          )
        ) : (
          /* List View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
                    </td>
                  </tr>
                ) : transactionsData?.data && transactionsData.data.length > 0 ? (
                  transactionsData.data.map((transaction: any) => (
                    <tr key={transaction.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            transaction.type === 'INCOME'
                              ? 'bg-success-100 dark:bg-success-900/30'
                              : 'bg-danger-100 dark:bg-danger-900/30'
                          }`}>
                            {transaction.type === 'INCOME' ? (
                              <ArrowDownRight className="w-5 h-5 text-success-600 dark:text-success-400" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-danger-600 dark:text-danger-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {transaction.description}
                            </p>
                            {transaction.notes && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {transaction.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {transaction.category?.name || '-'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(transaction.dueDate)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`font-semibold ${
                          transaction.type === 'INCOME'
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-danger-600 dark:text-danger-400'
                        }`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge badge-${getStatusColor(transaction.status)}`}>
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        {transaction.status === 'PENDING' && (
                          <button
                            onClick={() => confirmMutation.mutate(transaction.id)}
                            className="btn-success text-xs py-1 px-2"
                            disabled={confirmMutation.isPending}
                          >
                            <Check className="w-4 h-4" />
                            Confirmar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                      Nenhuma transação encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className={`p-4 ${
                transactionType === 'INCOME'
                  ? 'bg-success-500'
                  : 'bg-danger-500'
              } text-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {transactionType === 'INCOME' ? 'Nova Receita' : 'Nova Despesa'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-white/20 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                <input type="hidden" {...register('type')} value={transactionType} />

                <div>
                  <label className="label">Descrição *</label>
                  <input
                    {...register('description')}
                    className={`input ${errors.description ? 'input-error' : ''}`}
                    placeholder="Ex: Pagamento de fornecedor"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Categoria *</label>
                  <div className="flex gap-2">
                    <select
                      {...register('categoryId')}
                      className={`input flex-1 ${errors.categoryId ? 'input-error' : ''}`}
                    >
                      <option value="">Selecione...</option>
                      {filteredCategories?.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowQuickCategory(true)}
                      className="btn-secondary px-3"
                      title="Criar nova categoria"
                    >
                      <FolderPlus className="w-5 h-5" />
                    </button>
                  </div>
                  {errors.categoryId && (
                    <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className={`input ${errors.amount ? 'input-error' : ''}`}
                    placeholder="0,00"
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Data de Vencimento *</label>
                  <input
                    type="date"
                    {...register('dueDate')}
                    className={`input ${errors.dueDate ? 'input-error' : ''}`}
                  />
                  {errors.dueDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Status</label>
                  <select {...register('status')} className="input">
                    <option value="PENDING">Pendente</option>
                    <option value="CONFIRMED">Confirmado</option>
                  </select>
                </div>

                <div>
                  <label className="label">Observações</label>
                  <textarea
                    {...register('notes')}
                    rows={2}
                    className="input resize-none"
                    placeholder="Observações adicionais..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className={transactionType === 'INCOME' ? 'btn-success' : 'btn-danger'}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Salvar'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Category Modal */}
      <QuickTransactionCategoryModal
        isOpen={showQuickCategory}
        onClose={() => setShowQuickCategory(false)}
        defaultType={transactionType}
        onSuccess={(category) => {
          setValue('categoryId', category.id);
          queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
        }}
      />
    </div>
  );
}

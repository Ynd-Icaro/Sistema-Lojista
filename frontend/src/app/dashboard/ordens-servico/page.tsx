'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Wrench,
  Eye,
  Edit2,
  Trash2,
  X,
  Loader2,
  Calendar,
  User,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  FileText,
  LayoutList,
  Kanban,
  ChevronRight,
  Package,
  DollarSign,
  LayoutGrid,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { serviceOrdersApi, customersApi } from '@/lib/api';
import { showApiError } from '@/lib/error-handler';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QuickCustomerModal } from '@/components/modals/QuickCustomerModal';
import { ServiceOrderPipeline } from '@/components/service-orders/ServiceOrderPipeline';
import { UserPlus } from 'lucide-react';

const serviceOrderSchema = z.object({
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  title: z.string().min(3, 'Título é obrigatório'),
  description: z.string().optional(),
  deviceType: z.string().optional(),
  deviceBrand: z.string().optional(),
  deviceModel: z.string().optional(),
  deviceSerial: z.string().optional(),
  deviceCondition: z.string().optional(),
  reportedIssue: z.string().min(3, 'Problema é obrigatório'),
  laborCost: z.number().optional(),
  discount: z.number().optional(),
  priority: z.string().default('NORMAL'),
  estimatedDate: z.string().optional(),
  warrantyDays: z.number().optional(),
  notes: z.string().optional(),
});

type ServiceOrderForm = z.infer<typeof serviceOrderSchema>;

const statusColors: Record<string, string> = {
  PENDING: 'badge-warning',
  IN_PROGRESS: 'badge-info',
  WAITING_PARTS: 'badge-gray',
  WAITING_APPROVAL: 'badge-warning',
  COMPLETED: 'badge-success',
  DELIVERED: 'badge-primary',
  CANCELLED: 'badge-danger',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  WAITING_PARTS: 'Aguardando Peças',
  WAITING_APPROVAL: 'Aguardando Aprovação',
  COMPLETED: 'Concluído',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const priorityColors: Record<string, string> = {
  LOW: 'text-slate-600',
  NORMAL: 'text-primary-600',
  HIGH: 'text-warning-600',
  URGENT: 'text-danger-600',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export default function OrdensServicoPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'pipeline'>('list');
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceOrderForm>({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: {
      priority: 'NORMAL',
    },
  });

  // Fetch service orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['service-orders', search, statusFilter, page],
    queryFn: () =>
      serviceOrdersApi
        .getAll({ search, status: statusFilter, page, limit: 10 })
        .then((res) => res.data),
  });

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers-dropdown'],
    queryFn: () => customersApi.getAll({ limit: 100 }).then((res) => res.data),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ServiceOrderForm) => serviceOrdersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Ordem de serviço criada!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao criar ordem de serviço');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceOrderForm> }) =>
      serviceOrdersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Ordem atualizada!');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar ordem');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      serviceOrdersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Status atualizado!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceOrdersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast.success('Ordem excluída!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir ordem');
    },
  });

  const openModal = (order?: any) => {
    if (order) {
      setEditingOrder(order);
      reset({
        customerId: order.customerId,
        title: order.title,
        description: order.description || '',
        deviceType: order.deviceType || '',
        deviceBrand: order.deviceBrand || '',
        deviceModel: order.deviceModel || '',
        deviceSerial: order.deviceSerial || '',
        deviceCondition: order.deviceCondition || '',
        reportedIssue: order.reportedIssue || '',
        laborCost: order.laborCost || undefined,
        discount: order.discount || undefined,
        priority: order.priority,
        estimatedDate: order.estimatedDate ? new Date(order.estimatedDate).toISOString().split('T')[0] : '',
        warrantyDays: order.warrantyDays || undefined,
        notes: order.notes || '',
      });
    } else {
      setEditingOrder(null);
      reset({
        priority: 'NORMAL',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    reset();
  };

  const openDetailModal = (order: any) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const onSubmit = (data: ServiceOrderForm) => {
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  // Stats
  const stats = [
    {
      label: 'Pendentes',
      value: ordersData?.data?.filter((o: any) => o.status === 'PENDING').length || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      label: 'Em Andamento',
      value: ordersData?.data?.filter((o: any) => o.status === 'IN_PROGRESS').length || 0,
      icon: Play,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Concluídos',
      value: ordersData?.data?.filter((o: any) => o.status === 'COMPLETED').length || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Total',
      value: ordersData?.total || 0,
      icon: Wrench,
      color: 'text-primary-600',
      bg: 'bg-primary-100 dark:bg-primary-900/30',
    },
  ];

  // Pipeline columns for Kanban view
  const pipelineColumns = [
    { key: 'PENDING', label: 'Pendente', color: 'bg-yellow-500', bgLight: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { key: 'IN_PROGRESS', label: 'Em Andamento', color: 'bg-blue-500', bgLight: 'bg-blue-50 dark:bg-blue-900/20' },
    { key: 'WAITING_PARTS', label: 'Aguardando Peças', color: 'bg-orange-500', bgLight: 'bg-orange-50 dark:bg-orange-900/20' },
    { key: 'COMPLETED', label: 'Concluído', color: 'bg-green-500', bgLight: 'bg-green-50 dark:bg-green-900/20' },
    { key: 'DELIVERED', label: 'Entregue', color: 'bg-primary-500', bgLight: 'bg-primary-50 dark:bg-primary-900/20' },
  ];

  // Group orders by status for pipeline view
  const ordersByStatus = pipelineColumns.reduce((acc, col) => {
    acc[col.key] = ordersData?.data?.filter((o: any) => o.status === col.key) || [];
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Ordens de Serviço
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gerencie os serviços e reparos
          </p>
        </div>

        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-5 h-5" />
          Nova Ordem
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, cliente..."
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="">Todos os status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          
          {/* View mode toggle */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Cards
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'pipeline'
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Kanban className="w-4 h-4" />
              Pipeline
            </button>
          </div>
        </div>
      </div>

      {/* Orders - List View */}
      {viewMode === 'list' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : ordersData?.data && ordersData.data.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Ordem</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden md:table-cell">Equipamento</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden sm:table-cell">Prioridade</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden lg:table-cell">Data</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersData.data.map((order: any) => (
                      <tr 
                        key={order.id} 
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => openDetailModal(order)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-bold text-primary-600 dark:text-primary-400">
                            #{order.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{order.customer?.name}</p>
                            <p className="text-xs text-slate-500">{order.title}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-slate-600 dark:text-slate-400">
                            {order.device ? `${order.device}${order.brand ? ` - ${order.brand}` : ''}` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`
                              text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer
                              focus:ring-2 focus:ring-primary-500
                              ${order.status === 'PENDING' ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' : ''}
                              ${order.status === 'IN_PROGRESS' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : ''}
                              ${order.status === 'WAITING_PARTS' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                              ${order.status === 'COMPLETED' ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' : ''}
                              ${order.status === 'DELIVERED' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' : ''}
                              ${order.status === 'CANCELLED' ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400' : ''}
                            `}
                          >
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-sm font-medium ${priorityColors[order.priority]}`}>
                            {priorityLabels[order.priority]}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-slate-500 dark:text-slate-400 text-xs">
                            {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {order.status === 'PENDING' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'IN_PROGRESS')}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                title="Iniciar"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {order.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                title="Concluir"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openModal(order)}
                              className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="p-1.5 text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:text-slate-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20 rounded-lg"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <Wrench className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Nenhuma ordem de serviço encontrada
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Comece criando sua primeira ordem
              </p>
              <button onClick={() => openModal()} className="btn-primary">
                <Plus className="w-5 h-5" />
                Nova Ordem
              </button>
            </div>
          )}

          {/* Pagination */}
          {ordersData?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Página {page} de {ordersData.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(ordersData.totalPages, p + 1))}
                disabled={page === ordersData.totalPages}
                className="btn-secondary"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {/* Orders - Card View */}
      {viewMode === 'card' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : ordersData?.data && ordersData.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ordersData.data.map((order: any) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openDetailModal(order)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      #{order.orderNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${priorityColors[order.priority]}`}>
                        {priorityLabels[order.priority]}
                      </span>
                      <span className={`badge ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {order.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                    <User className="w-4 h-4" />
                    {order.customer?.name}
                  </div>

                  {order.device && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                      <Package className="w-4 h-4" />
                      {order.device}{order.brand ? ` - ${order.brand}` : ''}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'IN_PROGRESS')}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          title="Iniciar"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {order.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          title="Concluir"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openModal(order)}
                        className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-1.5 text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:text-slate-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(order);
                      }}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Wrench className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Nenhuma ordem de serviço encontrada
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Comece criando sua primeira ordem
              </p>
              <button onClick={() => openModal()} className="btn-primary">
                <Plus className="w-5 h-5" />
                Nova Ordem
              </button>
            </div>
          )}

          {/* Pagination */}
          {ordersData?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Página {page} de {ordersData.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(ordersData.totalPages, p + 1))}
                disabled={page === ordersData.totalPages}
                className="btn-secondary"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {/* Orders - Pipeline/Kanban View with Drag & Drop */}
      {viewMode === 'pipeline' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <ServiceOrderPipeline
              orders={ordersData?.data || []}
              columns={pipelineColumns}
              onStatusChange={handleStatusChange}
              onEdit={openModal}
              onViewDetails={openDetailModal}
            />
          )}
        </>
      )}
      {/* Create/Edit Modal */}
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
              className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {editingOrder ? `Editar Ordem #${editingOrder.orderNumber}` : 'Nova Ordem de Serviço'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Cliente *</label>
                    <div className="flex gap-2">
                      <select {...register('customerId')} className={`input flex-1 ${errors.customerId ? 'input-error' : ''}`}>
                        <option value="">Selecione um cliente</option>
                        {customersData?.data?.map((customer: any) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} {customer.phone && `- ${customer.phone}`}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowQuickCustomer(true)}
                        className="btn-secondary px-3"
                        title="Cadastrar novo cliente"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                    </div>
                    {errors.customerId && (
                      <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Título *</label>
                    <input
                      {...register('title')}
                      className={`input ${errors.title ? 'input-error' : ''}`}
                      placeholder="Ex: Reparo de tela"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Tipo de Dispositivo</label>
                    <input
                      {...register('deviceType')}
                      className="input"
                      placeholder="Ex: Smartphone, Notebook, Tablet"
                    />
                  </div>

                  <div>
                    <label className="label">Marca</label>
                    <input
                      {...register('deviceBrand')}
                      className="input"
                      placeholder="Ex: Samsung, Apple, Dell"
                    />
                  </div>

                  <div>
                    <label className="label">Modelo</label>
                    <input
                      {...register('deviceModel')}
                      className="input"
                      placeholder="Ex: Galaxy S21, iPhone 14"
                    />
                  </div>

                  <div>
                    <label className="label">Número de Série</label>
                    <input
                      {...register('deviceSerial')}
                      className="input"
                      placeholder="Número de série do aparelho"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Condição do Aparelho</label>
                    <input
                      {...register('deviceCondition')}
                      className="input"
                      placeholder="Ex: Tela trincada, carregador incluso"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Problema Relatado *</label>
                    <textarea
                      {...register('reportedIssue')}
                      rows={3}
                      className={`input resize-none ${errors.reportedIssue ? 'input-error' : ''}`}
                      placeholder="Descreva o problema relatado pelo cliente..."
                    />
                    {errors.reportedIssue && (
                      <p className="text-red-500 text-sm mt-1">{errors.reportedIssue.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Descrição / Observações</label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="input resize-none"
                      placeholder="Observações adicionais sobre o serviço..."
                    />
                  </div>

                  <div>
                    <label className="label">Custo de Mão de Obra</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('laborCost', { valueAsNumber: true })}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="label">Prioridade</label>
                    <select {...register('priority')} className="input">
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Previsão de Entrega</label>
                    <input
                      type="date"
                      {...register('estimatedDate')}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Garantia (dias)</label>
                    <input
                      type="number"
                      {...register('warrantyDays', { valueAsNumber: true })}
                      className="input"
                      placeholder="90"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn-primary"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : editingOrder ? (
                      'Salvar'
                    ) : (
                      'Criar Ordem'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={closeDetailModal}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Ordem #{selectedOrder.orderNumber}
                  </h3>
                  <span className={`badge ${statusColors[selectedOrder.status]}`}>
                    {statusLabels[selectedOrder.status]}
                  </span>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Customer info */}
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Cliente</h4>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedOrder.customer?.name}
                    </p>
                    {selectedOrder.customer?.phone && (
                      <p className="text-sm text-slate-500">{selectedOrder.customer?.phone}</p>
                    )}
                    {selectedOrder.customer?.email && (
                      <p className="text-sm text-slate-500">{selectedOrder.customer?.email}</p>
                    )}
                  </div>
                </div>

                {/* Device info */}
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Equipamento</h4>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedOrder.device && (
                        <div>
                          <p className="text-sm text-slate-500">Dispositivo</p>
                          <p className="text-slate-900 dark:text-white">{selectedOrder.device}</p>
                        </div>
                      )}
                      {selectedOrder.brand && (
                        <div>
                          <p className="text-sm text-slate-500">Marca</p>
                          <p className="text-slate-900 dark:text-white">{selectedOrder.brand}</p>
                        </div>
                      )}
                      {selectedOrder.model && (
                        <div>
                          <p className="text-sm text-slate-500">Modelo</p>
                          <p className="text-slate-900 dark:text-white">{selectedOrder.model}</p>
                        </div>
                      )}
                      {selectedOrder.serialNumber && (
                        <div>
                          <p className="text-sm text-slate-500">Número de Série</p>
                          <p className="text-slate-900 dark:text-white">{selectedOrder.serialNumber}</p>
                        </div>
                      )}
                    </div>
                    {selectedOrder.accessories && (
                      <div className="mt-4">
                        <p className="text-sm text-slate-500">Acessórios</p>
                        <p className="text-slate-900 dark:text-white">{selectedOrder.accessories}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Problem and description */}
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Problema Relatado</h4>
                  <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    {selectedOrder.problemReported}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Descrição do Serviço</h4>
                  <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                    {selectedOrder.description}
                  </p>
                </div>

                {/* Costs and dates */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.estimatedCost && (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                      <p className="text-sm text-slate-500">Custo Estimado</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.estimatedCost)}
                      </p>
                    </div>
                  )}
                  {selectedOrder.finalCost && (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                      <p className="text-sm text-slate-500">Custo Final</p>
                      <p className="text-xl font-bold text-success-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.finalCost)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Criado em</p>
                    <p className="text-slate-900 dark:text-white">
                      {format(new Date(selectedOrder.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {selectedOrder.completedAt && (
                    <div>
                      <p className="text-slate-500">Concluído em</p>
                      <p className="text-slate-900 dark:text-white">
                        {format(new Date(selectedOrder.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button onClick={closeDetailModal} className="btn-secondary">
                    Fechar
                  </button>
                  <button onClick={() => { closeDetailModal(); openModal(selectedOrder); }} className="btn-primary">
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Customer Modal */}
      <QuickCustomerModal
        isOpen={showQuickCustomer}
        onClose={() => setShowQuickCustomer(false)}
        onSuccess={(customer) => {
          setValue('customerId', customer.id);
          queryClient.invalidateQueries({ queryKey: ['customers-dropdown'] });
        }}
      />
    </div>
  );
}

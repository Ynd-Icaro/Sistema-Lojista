'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Truck,
  Edit2,
  Trash2,
  X,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Star,
  Building2,
  Package,
  User,
  Globe,
  CreditCard,
  Clock,
  DollarSign,
  MoreVertical,
  Eye,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { suppliersApi, addressApi } from '@/lib/api';
import { formatCurrency, maskCPFCNPJ, maskPhone, unmask } from '@/lib/utils';
import { showApiError } from '@/lib/error-handler';

const supplierSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  type: z.string().default('PJ'),
  tradeName: z.string().optional(),
  cpfCnpj: z.string().optional(),
  ie: z.string().optional(),
  im: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().optional(),
  contactPerson: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadTime: z.number().optional(),
  minOrderValue: z.number().optional(),
  notes: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().default(true),
});

type SupplierForm = z.infer<typeof supplierSchema>;

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [viewingSupplier, setViewingSupplier] = useState<any>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      type: 'PJ',
      isActive: true,
    },
  });

  const watchedType = watch('type');
  const watchedCpfCnpj = watch('cpfCnpj');

  // Fetch suppliers stats
  const { data: statsData } = useQuery({
    queryKey: ['suppliers-stats'],
    queryFn: () => suppliersApi.getStats().then((res) => res.data),
  });

  // Fetch suppliers
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () =>
      suppliersApi.getAll({ page, search: search || undefined }).then((res) => res.data),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: SupplierForm) => suppliersApi.create({
      ...data,
      cpfCnpj: data.cpfCnpj ? unmask(data.cpfCnpj) : undefined,
      phone: data.phone ? unmask(data.phone) : undefined,
      whatsapp: data.whatsapp ? unmask(data.whatsapp) : undefined,
      zipCode: data.zipCode ? unmask(data.zipCode) : undefined,
    }),
    onSuccess: () => {
      toast.success('Fornecedor criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-stats'] });
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao criar fornecedor');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierForm }) =>
      suppliersApi.update(id, {
        ...data,
        cpfCnpj: data.cpfCnpj ? unmask(data.cpfCnpj) : undefined,
        phone: data.phone ? unmask(data.phone) : undefined,
        whatsapp: data.whatsapp ? unmask(data.whatsapp) : undefined,
        zipCode: data.zipCode ? unmask(data.zipCode) : undefined,
      }),
    onSuccess: () => {
      toast.success('Fornecedor atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-stats'] });
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar fornecedor');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => {
      toast.success('Fornecedor excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-stats'] });
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao excluir fornecedor');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    reset({
      type: 'PJ',
      isActive: true,
    });
  };

  const openEditModal = (supplier: any) => {
    setEditingSupplier(supplier);
    reset({
      ...supplier,
      cpfCnpj: supplier.cpfCnpj ? maskCPFCNPJ(supplier.cpfCnpj) : '',
      phone: supplier.phone ? maskPhone(supplier.phone) : '',
      whatsapp: supplier.whatsapp ? maskPhone(supplier.whatsapp) : '',
    });
    setShowModal(true);
  };

  const openViewModal = (supplier: any) => {
    setViewingSupplier(supplier);
    setShowViewModal(true);
  };

  const onSubmit = (data: SupplierForm) => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o fornecedor "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const searchCep = async (cep: string) => {
    const cleanCep = unmask(cep);
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const response = await addressApi.findByCep(cleanCep);
      const address = response.data;
      
      setValue('address', address.street || '');
      setValue('neighborhood', address.neighborhood || '');
      setValue('city', address.city || '');
      setValue('state', address.state || '');
      
      toast.success('Endereço encontrado!');
    } catch (error) {
      toast.error('CEP não encontrado');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fornecedores
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie seus fornecedores e parceiros
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {statsData.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ativos</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {statsData.active}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Com Produtos</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {statsData.withProducts}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Inativos</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {statsData.inactive}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : suppliersData?.data?.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum fornecedor encontrado
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avaliação
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {suppliersData?.data?.map((supplier: any) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {supplier.name}
                        </p>
                        {supplier.tradeName && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {supplier.tradeName}
                          </p>
                        )}
                        {supplier.cpfCnpj && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {maskCPFCNPJ(supplier.cpfCnpj)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Phone className="w-4 h-4" />
                            {maskPhone(supplier.phone)}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Mail className="w-4 h-4" />
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {supplier.city && supplier.state ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <MapPin className="w-4 h-4" />
                          {supplier.city}/{supplier.state}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {supplier._count?.products || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        {renderStars(supplier.rating || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          supplier.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {supplier.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openViewModal(supplier)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id, supplier.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
        )}

        {/* Pagination */}
        {suppliersData?.meta && suppliersData.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {((page - 1) * suppliersData.meta.limit) + 1} a{' '}
              {Math.min(page * suppliersData.meta.limit, suppliersData.meta.total)} de{' '}
              {suppliersData.meta.total} fornecedores
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= suppliersData.meta.totalPages}
                className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* Tipo de Pessoa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Pessoa
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="PJ"
                          {...register('type')}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Pessoa Jurídica</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="PF"
                          {...register('type')}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Pessoa Física</span>
                      </label>
                    </div>
                  </div>

                  {/* Dados Básicos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {watchedType === 'PJ' ? 'Razão Social *' : 'Nome *'}
                      </label>
                      <input
                        {...register('name')}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                      )}
                    </div>
                    {watchedType === 'PJ' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nome Fantasia
                        </label>
                        <input
                          {...register('tradeName')}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {watchedType === 'PJ' ? 'CNPJ' : 'CPF'}
                      </label>
                      <input
                        {...register('cpfCnpj')}
                        value={watchedCpfCnpj ? maskCPFCNPJ(watchedCpfCnpj) : ''}
                        onChange={(e) => setValue('cpfCnpj', e.target.value)}
                        placeholder={watchedType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {watchedType === 'PJ' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Inscrição Estadual
                          </label>
                          <input
                            {...register('ie')}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Inscrição Municipal
                          </label>
                          <input
                            {...register('im')}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Contato */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contato
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          {...register('email')}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Telefone
                        </label>
                        <input
                          {...register('phone')}
                          onChange={(e) => setValue('phone', maskPhone(e.target.value))}
                          placeholder="(00) 00000-0000"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          WhatsApp
                        </label>
                        <input
                          {...register('whatsapp')}
                          onChange={(e) => setValue('whatsapp', maskPhone(e.target.value))}
                          placeholder="(00) 00000-0000"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Website
                        </label>
                        <input
                          {...register('website')}
                          placeholder="https://"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Pessoa de Contato
                        </label>
                        <input
                          {...register('contactPerson')}
                          placeholder="Nome do responsável"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Endereço
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          CEP
                        </label>
                        <div className="flex gap-2">
                          <input
                            {...register('zipCode')}
                            placeholder="00000-000"
                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => searchCep(watch('zipCode') || '')}
                            disabled={isSearchingCep}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {isSearchingCep ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Search className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Logradouro
                        </label>
                        <input
                          {...register('address')}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Número
                        </label>
                        <input
                          {...register('number')}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Complemento
                        </label>
                        <input
                          {...register('complement')}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Bairro
                        </label>
                        <input
                          {...register('neighborhood')}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cidade
                        </label>
                        <input
                          {...register('city')}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Estado
                        </label>
                        <select
                          {...register('state')}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Selecione</option>
                          {BRAZILIAN_STATES.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Condições Comerciais */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Condições Comerciais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Condições de Pagamento
                        </label>
                        <input
                          {...register('paymentTerms')}
                          placeholder="Ex: 30/60/90 dias"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Prazo de Entrega (dias)
                        </label>
                        <input
                          type="number"
                          {...register('leadTime', { valueAsNumber: true })}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Pedido Mínimo (R$)
                        </label>
                        <input
                          type="number"
                          {...register('minOrderValue', { valueAsNumber: true })}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Avaliação e Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Avaliação
                      </label>
                      <select
                        {...register('rating', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={0}>Sem avaliação</option>
                        <option value={1}>⭐ 1 estrela</option>
                        <option value={2}>⭐⭐ 2 estrelas</option>
                        <option value={3}>⭐⭐⭐ 3 estrelas</option>
                        <option value={4}>⭐⭐⭐⭐ 4 estrelas</option>
                        <option value={5}>⭐⭐⭐⭐⭐ 5 estrelas</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="isActive"
                        {...register('isActive')}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                        Fornecedor ativo
                      </label>
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observações
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {editingSupplier ? 'Salvar Alterações' : 'Criar Fornecedor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && viewingSupplier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detalhes do Fornecedor
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                      <Truck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {viewingSupplier.name}
                      </h3>
                      {viewingSupplier.tradeName && (
                        <p className="text-gray-500 dark:text-gray-400">
                          {viewingSupplier.tradeName}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {renderStars(viewingSupplier.rating || 0)}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            viewingSupplier.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {viewingSupplier.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contato */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Contato
                      </h4>
                      {viewingSupplier.cpfCnpj && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">
                            {viewingSupplier.type === 'PJ' ? 'CNPJ:' : 'CPF:'}
                          </span>{' '}
                          {maskCPFCNPJ(viewingSupplier.cpfCnpj)}
                        </p>
                      )}
                      {viewingSupplier.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {viewingSupplier.email}
                        </p>
                      )}
                      {viewingSupplier.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {maskPhone(viewingSupplier.phone)}
                        </p>
                      )}
                      {viewingSupplier.website && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <a
                            href={viewingSupplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            {viewingSupplier.website}
                          </a>
                        </p>
                      )}
                      {viewingSupplier.contactPerson && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Responsável:</span>{' '}
                          {viewingSupplier.contactPerson}
                        </p>
                      )}
                    </div>

                    {/* Endereço */}
                    {(viewingSupplier.address || viewingSupplier.city) && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Endereço
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {viewingSupplier.address}
                          {viewingSupplier.number && `, ${viewingSupplier.number}`}
                          {viewingSupplier.complement && ` - ${viewingSupplier.complement}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {viewingSupplier.neighborhood && `${viewingSupplier.neighborhood} - `}
                          {viewingSupplier.city}/{viewingSupplier.state}
                        </p>
                        {viewingSupplier.zipCode && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            CEP: {viewingSupplier.zipCode}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Condições Comerciais */}
                  {(viewingSupplier.paymentTerms || viewingSupplier.leadTime || viewingSupplier.minOrderValue) && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Condições Comerciais
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {viewingSupplier.paymentTerms && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pagamento</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {viewingSupplier.paymentTerms}
                            </p>
                          </div>
                        )}
                        {viewingSupplier.leadTime && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Prazo Entrega</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {viewingSupplier.leadTime} dias
                            </p>
                          </div>
                        )}
                        {viewingSupplier.minOrderValue && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pedido Mín.</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(viewingSupplier.minOrderValue)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Produtos do Fornecedor */}
                  {viewingSupplier.products?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Produtos ({viewingSupplier._count?.products || 0})
                      </h4>
                      <div className="space-y-2">
                        {viewingSupplier.products.map((product: any) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                SKU: {product.sku}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(product.salePrice)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Estoque: {product.stock}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  {viewingSupplier.notes && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">Observações</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        {viewingSupplier.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      openEditModal(viewingSupplier);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

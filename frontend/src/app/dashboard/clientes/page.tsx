'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  X,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Star,
  Download,
  Upload,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { customersApi, addressApi, AddressResponse } from '@/lib/api';
import { showApiError } from '@/lib/error-handler';
import { 
  formatPhone, 
  formatDocument, 
  maskCPFCNPJ, 
  maskPhone, 
  maskCEP, 
  validateCPFCNPJ,
  unmask 
} from '@/lib/utils';
import { ViewToggle, useViewMode } from '@/components/ui/ViewToggle';
import { CepInput } from '@/components/ui/CepInput';

const customerSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  cpfCnpj: z.string().optional(),
  skipDocument: z.boolean().default(false),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
}).refine((data) => {
  // Se não pular documento e o CPF/CNPJ foi preenchido, validar
  if (!data.skipDocument && data.cpfCnpj && data.cpfCnpj.length > 0) {
    const unmasked = unmask(data.cpfCnpj);
    if (unmasked.length > 0 && unmasked.length !== 11 && unmasked.length !== 14) {
      return false;
    }
    if (unmasked.length === 11 || unmasked.length === 14) {
      return validateCPFCNPJ(unmasked);
    }
  }
  return true;
}, {
  message: 'CPF/CNPJ inválido',
  path: ['cpfCnpj'],
});

type CustomerForm = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const { view, setView } = useViewMode('clientes', 'list');
  
  // Import/Export states
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      isActive: true,
      skipDocument: false,
    },
  });

  const skipDocument = watch('skipDocument');

  // Handlers para máscaras
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setValue('phone', masked);
  }, [setValue]);

  const handleCPFCNPJChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCPFCNPJ(e.target.value);
    setValue('cpfCnpj', masked);
  }, [setValue]);

  const handleCEPChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCEP(e.target.value);
    setValue('zipCode', masked);
  }, [setValue]);

  // Handler para quando CEP é encontrado
  const handleCEPFound = useCallback((address: AddressResponse) => {
    setValue('zipCode', address.cep);
    setValue('address', address.street);
    setValue('city', address.city);
    setValue('state', address.state);
    toast.success('Endereço preenchido automaticamente!');
  }, [setValue]);

  // Fetch customers
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () =>
      customersApi.getAll({ page, search }),
  });

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: (data: CustomerForm) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente criado com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao criar cliente');
    },
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerForm }) =>
      customersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente atualizado com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar cliente');
    },
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao excluir cliente');
    },
  });

  const openModal = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer);
      reset({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone ? maskPhone(customer.phone) : '',
        cpfCnpj: customer.cpfCnpj ? maskCPFCNPJ(customer.cpfCnpj) : '',
        skipDocument: !customer.cpfCnpj,
        birthDate: customer.birthDate?.split('T')[0] || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode ? maskCEP(customer.zipCode) : '',
        notes: customer.notes || '',
        isActive: customer.isActive,
      });
    } else {
      setEditingCustomer(null);
      reset({
        isActive: true,
        skipDocument: false,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    reset();
  };

  const onSubmit = (data: CustomerForm) => {
    // Preparar dados para envio (remover máscaras)
    const submitData = {
      ...data,
      phone: data.phone ? unmask(data.phone) : undefined,
      cpfCnpj: data.skipDocument ? undefined : (data.cpfCnpj ? unmask(data.cpfCnpj) : undefined),
      zipCode: data.zipCode ? unmask(data.zipCode) : undefined,
    };
    // Remover campo skipDocument que não existe no backend
    delete (submitData as any).skipDocument;

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteMutation.mutate(id);
    }
  };

  // Import/Export functions
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const response = await customersApi.downloadTemplate();
      
      // Criar blob e download
      const blob = new Blob([response], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template_clientes.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template baixado com sucesso!');
    } catch (error) {
      showApiError(error, 'Erro ao baixar template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setIsImporting(true);
        const result = await customersApi.import(file);
        
        toast.success(`Importação concluída! ${result.imported} importados, ${result.updated} atualizados.`);
        if (result.errors.length > 0) {
          toast.error(`Erros encontrados: ${result.errors.join(', ')}`);
        }
        
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      } catch (error) {
        showApiError(error, 'Erro ao importar clientes');
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await customersApi.export({});
      
      // Criar blob e download
      const blob = new Blob([response], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'clientes.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Clientes exportados com sucesso!');
    } catch (error) {
      showApiError(error, 'Erro ao exportar clientes');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gerencie sua base de clientes
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ViewToggle 
            storageKey="clientes" 
            defaultView="list" 
            onViewChange={setView}
          />
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              className="btn-secondary"
            >
              {isDownloadingTemplate ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Template
            </button>
            <button 
              onClick={handleImport}
              disabled={isImporting}
              className="btn-secondary"
            >
              {isImporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              Importar
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="btn-secondary"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Exportar
            </button>
          </div>
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-5 h-5" />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar clientes..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Card View */}
      {!isLoading && view === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customersData?.data && customersData.data.length > 0 ? (
            customersData.data.map((customer: any) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{customer.name}</p>
                      {customer.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{customer.email}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    customer.isActive 
                      ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {customer.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4" />
                      {formatPhone(customer.phone)}
                    </div>
                  )}
                  {customer.cpfCnpj && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Users className="w-4 h-4" />
                      {formatDocument(customer.cpfCnpj)}
                    </div>
                  )}
                  {customer.city && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4" />
                      {customer.city}/{customer.state}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => openModal(customer)}
                    className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:text-slate-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20 rounded-lg"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full card text-center py-12">
              <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Comece cadastrando seu primeiro cliente
              </p>
              <button onClick={() => openModal()} className="btn-primary">
                <Plus className="w-5 h-5" />
                Novo Cliente
              </button>
            </div>
          )}
        </div>
      )}

      {/* List/Table View */}
      {!isLoading && view === 'list' && customersData?.data && customersData.data.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden md:table-cell">CPF/CNPJ</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden sm:table-cell">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden lg:table-cell">Cidade</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {customersData.data.map((customer: any) => (
                  <tr 
                    key={customer.id} 
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">{customer.name}</p>
                          {customer.email && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{customer.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-slate-600 dark:text-slate-400">
                        {customer.cpfCnpj ? formatDocument(customer.cpfCnpj) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-slate-600 dark:text-slate-400">
                        {customer.phone ? formatPhone(customer.phone) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-slate-600 dark:text-slate-400">
                        {customer.city ? `${customer.city}/${customer.state}` : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.isActive 
                          ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {customer.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openModal(customer)}
                          className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-1.5 text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:text-slate-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
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
      ) : !isLoading && view === 'list' && (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Nenhum cliente encontrado
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Comece cadastrando seu primeiro cliente
          </p>
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-5 h-5" />
            Novo Cliente
          </button>
        </div>
      )}

      {/* Pagination */}
      {customersData?.meta && customersData.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="btn-secondary disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Página {customersData.meta.page} de {customersData.meta.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= customersData.meta.totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Próximo
          </button>
        </div>
      )}

      {/* Customer Modal */}
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
              className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(90vh-8rem)]">
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="label">Nome *</label>
                      <input
                        {...register('name')}
                        className={`input ${errors.name ? 'input-error' : ''}`}
                        placeholder="Nome completo"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Email</label>
                      <input
                        {...register('email')}
                        type="email"
                        className={`input ${errors.email ? 'input-error' : ''}`}
                        placeholder="email@exemplo.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Telefone</label>
                      <input
                        {...register('phone')}
                        onChange={handlePhoneChange}
                        className={`input ${errors.phone ? 'input-error' : ''}`}
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="label mb-0">CPF/CNPJ</label>
                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            {...register('skipDocument')}
                            className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                          />
                          Não incluir
                        </label>
                      </div>
                      <input
                        {...register('cpfCnpj')}
                        onChange={handleCPFCNPJChange}
                        className={`input ${errors.cpfCnpj ? 'input-error' : ''} ${skipDocument ? 'opacity-50 bg-slate-100 dark:bg-slate-700' : ''}`}
                        placeholder="000.000.000-00"
                        maxLength={18}
                        disabled={skipDocument}
                      />
                      {errors.cpfCnpj && (
                        <p className="text-red-500 text-sm mt-1">{errors.cpfCnpj.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Data de Nascimento</label>
                      <input
                        {...register('birthDate')}
                        type="date"
                        className="input"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="label">Endereço</label>
                      <input
                        {...register('address')}
                        className="input"
                        placeholder="Rua, número, bairro"
                      />
                    </div>

                    <div>
                      <label className="label">Cidade</label>
                      <input
                        {...register('city')}
                        className="input"
                        placeholder="Cidade"
                      />
                    </div>

                    <div>
                      <label className="label">Estado</label>
                      <select {...register('state')} className="input">
                        <option value="">Selecione...</option>
                        <option value="AC">Acre</option>
                        <option value="AL">Alagoas</option>
                        <option value="AP">Amapá</option>
                        <option value="AM">Amazonas</option>
                        <option value="BA">Bahia</option>
                        <option value="CE">Ceará</option>
                        <option value="DF">Distrito Federal</option>
                        <option value="ES">Espírito Santo</option>
                        <option value="GO">Goiás</option>
                        <option value="MA">Maranhão</option>
                        <option value="MT">Mato Grosso</option>
                        <option value="MS">Mato Grosso do Sul</option>
                        <option value="MG">Minas Gerais</option>
                        <option value="PA">Pará</option>
                        <option value="PB">Paraíba</option>
                        <option value="PR">Paraná</option>
                        <option value="PE">Pernambuco</option>
                        <option value="PI">Piauí</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="RN">Rio Grande do Norte</option>
                        <option value="RS">Rio Grande do Sul</option>
                        <option value="RO">Rondônia</option>
                        <option value="RR">Roraima</option>
                        <option value="SC">Santa Catarina</option>
                        <option value="SP">São Paulo</option>
                        <option value="SE">Sergipe</option>
                        <option value="TO">Tocantins</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">CEP</label>
                      <Controller
                        name="zipCode"
                        control={control}
                        render={({ field }) => (
                          <CepInput
                            value={field.value || ''}
                            onChange={field.onChange}
                            onAddressFound={handleCEPFound}
                            error={errors.zipCode?.message}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Observações</label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="input resize-none"
                      placeholder="Observações sobre o cliente..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">
                      Cliente ativo
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
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
                    ) : editingCustomer ? (
                      'Salvar'
                    ) : (
                      'Criar Cliente'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

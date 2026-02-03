'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Tags,
  Edit2,
  Trash2,
  X,
  Loader2,
  Package,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { categoriesApi } from '@/lib/api';
import { showApiError } from '@/lib/error-handler';
import { ViewToggle, useViewMode } from '@/components/ui/ViewToggle';

const categorySchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function CategoriasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const { view, setView } = useViewMode('categories', 'card');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      isActive: true,
    },
  });

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories', search],
    queryFn: () =>
      categoriesApi.getAll({ search }).then((res) => res.data),
  });

  // The backend returns an array directly, not {data: [...]}
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.data || [];

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (data: CategoryForm) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao criar categoria');
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryForm }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria atualizada com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar categoria');
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao excluir categoria');
    },
  });

  const openModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      reset({
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = (data: CategoryForm) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categorias</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Organize seus produtos em categorias
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ViewToggle storageKey="categories" onViewChange={setView} />
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-5 h-5" />
            Nova Categoria
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
            placeholder="Buscar categorias..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Categories grid/list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : categories.length > 0 ? (
        view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category: any) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <Tags className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {category._count?.products || 0} produtos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal(category)}
                    className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:text-slate-400 dark:hover:text-danger-400 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {category.description && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {category.description}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className={`badge ${category.isActive ? 'badge-success' : 'badge-gray'}`}>
                  {category.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        ) : (
        /* List View */
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                  Descrição
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Produtos
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {categories.map((category: any) => (
                <tr key={category.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                        <Tags className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    {category.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                      <Package className="w-3.5 h-3.5" />
                      {category._count?.products || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${category.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {category.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openModal(category)}
                        className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:text-slate-400 dark:hover:text-danger-400 dark:hover:bg-red-900/20 rounded-lg"
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
        )
      ) : (
        <div className="card text-center py-12">
          <Tags className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Nenhuma categoria encontrada
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Comece criando sua primeira categoria
          </p>
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-5 h-5" />
            Nova Categoria
          </button>
        </div>
      )}

      {/* Category Modal */}
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
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                <div>
                  <label className="label">Nome *</label>
                  <input
                    {...register('name')}
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Nome da categoria"
                  />
                  {errors.name && (
                    <p className="text-danger-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Descrição</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="input resize-none"
                    placeholder="Descrição da categoria..."
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
                    Categoria ativa
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
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
                    ) : editingCategory ? (
                      'Salvar'
                    ) : (
                      'Criar Categoria'
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

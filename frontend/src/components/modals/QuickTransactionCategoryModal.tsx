'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, FolderPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { financialApi } from '@/lib/api';
import { showApiError } from '@/lib/error-handler';
import { useModalCache } from '@/hooks/useModalCache';

const quickCategorySchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
});

type QuickCategoryForm = z.infer<typeof quickCategorySchema>;

interface QuickTransactionCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (category: any) => void;
  defaultType?: 'INCOME' | 'EXPENSE';
}

export function QuickTransactionCategoryModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  defaultType = 'EXPENSE' 
}: QuickTransactionCategoryModalProps) {
  const queryClient = useQueryClient();
  const { loadCache, saveCache, clearCache } = useModalCache('transaction-category');
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<QuickCategoryForm>({
    resolver: zodResolver(quickCategorySchema),
    defaultValues: {
      type: defaultType,
    },
  });

  const selectedType = watch('type');
  const formData = watch();

  // Load cache when modal opens
  useEffect(() => {
    if (isOpen) {
      const cached = loadCache();
      if (cached && cached.name) {
        reset({ ...cached, type: cached.type || defaultType });
      }
    }
  }, [isOpen, loadCache, reset, defaultType]);

  // Save to cache on form change
  useEffect(() => {
    if (isOpen && formData.name) {
      saveCache(formData);
    }
  }, [isOpen, formData, saveCache]);

  const createMutation = useMutation({
    mutationFn: (data: QuickCategoryForm) => financialApi.createCategory(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      toast.success('Categoria criada com sucesso!');
      clearCache();
      reset({ type: defaultType });
      onClose();
      if (onSuccess) {
        onSuccess(response.data);
      }
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao criar categoria');
    },
  });

  const onSubmit = (data: QuickCategoryForm) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    // Don't clear cache on close - this preserves data if clicked outside
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className={`p-4 ${selectedType === 'INCOME' ? 'bg-success-500' : 'bg-danger-500'} text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderPlus className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">
                    Nova Categoria Financeira
                  </h3>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              <div>
                <label className="label">Tipo *</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedType === 'INCOME'
                      ? 'border-success-500 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                      : 'border-slate-200 dark:border-slate-700 hover:border-success-300'
                  }`}>
                    <input
                      type="radio"
                      value="INCOME"
                      {...register('type')}
                      className="sr-only"
                    />
                    <span className="font-medium">💰 Receita</span>
                  </label>
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedType === 'EXPENSE'
                      ? 'border-danger-500 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400'
                      : 'border-slate-200 dark:border-slate-700 hover:border-danger-300'
                  }`}>
                    <input
                      type="radio"
                      value="EXPENSE"
                      {...register('type')}
                      className="sr-only"
                    />
                    <span className="font-medium">💸 Despesa</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Nome da Categoria *</label>
                <input
                  {...register('name')}
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder={selectedType === 'INCOME' ? 'Ex: Vendas, Serviços...' : 'Ex: Aluguel, Fornecedores...'}
                  autoFocus
                />
                {errors.name && (
                  <p className="text-danger-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Cor (opcional)</label>
                <input
                  type="color"
                  {...register('color')}
                  className="input h-10 p-1"
                  defaultValue={selectedType === 'INCOME' ? '#10b981' : '#ef4444'}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={handleClose} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className={selectedType === 'INCOME' ? 'btn-success' : 'btn-danger'}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-5 h-5" />
                      Criar Categoria
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

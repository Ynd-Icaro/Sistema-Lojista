'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, FolderPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { categoriesApi } from '@/lib/api';
import { showApiError } from '@/lib/error-handler';
import { useModalCache } from '@/hooks/useModalCache';

const quickCategorySchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  description: z.string().optional(),
  color: z.string().optional(),
});

type QuickCategoryForm = z.infer<typeof quickCategorySchema>;

const colorOptions = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#22C55E', label: 'Verde' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#F97316', label: 'Laranja' },
  { value: '#6B7280', label: 'Cinza' },
];

interface QuickCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (category: any) => void;
}

export function QuickCategoryModal({ isOpen, onClose, onSuccess }: QuickCategoryModalProps) {
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const { loadCache, saveCache, clearCache } = useModalCache('quick-category');
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<QuickCategoryForm>({
    resolver: zodResolver(quickCategorySchema),
    defaultValues: {
      color: '#3B82F6',
    },
  });

  const formData = watch();

  // Load cache when modal opens
  useEffect(() => {
    if (isOpen) {
      const cached = loadCache();
      if (cached && cached.name) {
        reset(cached);
        if (cached.color) {
          setSelectedColor(cached.color);
        }
      }
    }
  }, [isOpen, loadCache, reset]);

  // Save to cache on form change
  useEffect(() => {
    if (isOpen && formData.name) {
      saveCache({ ...formData, color: selectedColor });
    }
  }, [isOpen, formData, selectedColor, saveCache]);

  const createMutation = useMutation({
    mutationFn: (data: any) => categoriesApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada com sucesso!');
      clearCache();
      reset();
      setSelectedColor('#3B82F6');
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
    createMutation.mutate({
      ...data,
      color: selectedColor,
    });
  };

  const handleClose = () => {
    // Don't clear cache on close - preserves data if clicked outside
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
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <FolderPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Nova Categoria
                </h3>
              </div>
              <button
                onClick={handleClose}
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
                  autoFocus
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Descrição</label>
                <textarea
                  {...register('description')}
                  className="input resize-none"
                  placeholder="Descrição da categoria (opcional)"
                  rows={2}
                />
              </div>

              <div>
                <label className="label">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        selectedColor === color.value 
                          ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' 
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={handleClose} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
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
  );
}

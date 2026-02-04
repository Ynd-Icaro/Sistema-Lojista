'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Save,
  Loader2,
  Package,
  DollarSign,
  Boxes,
  Tag,
  Trash2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { productsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { showApiError } from '@/lib/error-handler';

const variationSchema = z.object({
  color: z.string().optional(),
  size: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  costPrice: z.number().min(0, 'Preço de custo deve ser positivo').optional(),
  salePrice: z.number().min(0, 'Preço de venda deve ser positivo').optional(),
  stock: z.number().min(0, 'Estoque deve ser positivo').optional(),
});

type VariationFormData = z.infer<typeof variationSchema>;

interface VariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentProduct: any;
  variation?: any;
  onSuccess?: () => void;
}

export function VariationModal({ isOpen, onClose, parentProduct, variation, onSuccess }: VariationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VariationFormData>({
    resolver: zodResolver(variationSchema),
    defaultValues: variation ? {
      color: variation.color || '',
      size: variation.size || '',
      sku: variation.sku || '',
      barcode: variation.barcode || '',
      costPrice: variation.costPrice || parentProduct.costPrice,
      salePrice: variation.salePrice || parentProduct.salePrice,
      stock: variation.stock || 0,
    } : {
      color: '',
      size: '',
      sku: '',
      barcode: '',
      costPrice: parentProduct?.costPrice || 0,
      salePrice: parentProduct?.salePrice || 0,
      stock: 0,
    },
  });

  useEffect(() => {
    if (variation) {
      reset({
        color: variation.color || '',
        size: variation.size || '',
        sku: variation.sku || '',
        barcode: variation.barcode || '',
        costPrice: variation.costPrice || parentProduct.costPrice,
        salePrice: variation.salePrice || parentProduct.salePrice,
        stock: variation.stock || 0,
      });
    } else {
      reset({
        color: '',
        size: '',
        sku: '',
        barcode: '',
        costPrice: parentProduct?.costPrice || 0,
        salePrice: parentProduct?.salePrice || 0,
        stock: 0,
      });
    }
  }, [variation, parentProduct, reset]);

  const createMutation = useMutation({
    mutationFn: (data: VariationFormData) => productsApi.createVariation(parentProduct.id, data),
    onSuccess: () => {
      toast.success('Variação criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', parentProduct.id] });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      showApiError(error, 'Erro ao criar variação');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VariationFormData }) =>
      productsApi.updateVariation(id, data),
    onSuccess: () => {
      toast.success('Variação atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', parentProduct.id] });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      showApiError(error, 'Erro ao atualizar variação');
    },
  });

  const onSubmit = async (data: VariationFormData) => {
    setIsLoading(true);
    try {
      if (variation) {
        await updateMutation.mutateAsync({ id: variation.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!parentProduct) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {variation ? 'Editar Variação' : 'Nova Variação'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Produto: {parentProduct.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Atributos da Variação */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Atributos da Variação
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Cor
                      </label>
                      <input
                        {...register('color')}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ex: Azul, Vermelho"
                      />
                      {errors.color && (
                        <p className="text-sm text-red-500 mt-1">{errors.color.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tamanho
                      </label>
                      <input
                        {...register('size')}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ex: P, M, G"
                      />
                      {errors.size && (
                        <p className="text-sm text-red-500 mt-1">{errors.size.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Identificação */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Identificação
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        SKU
                      </label>
                      <input
                        {...register('sku')}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="SKU da variação"
                      />
                      {errors.sku && (
                        <p className="text-sm text-red-500 mt-1">{errors.sku.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Código de Barras
                      </label>
                      <input
                        {...register('barcode')}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Código de barras"
                      />
                      {errors.barcode && (
                        <p className="text-sm text-red-500 mt-1">{errors.barcode.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Preços */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Preços
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Preço de Custo
                      </label>
                      <input
                        {...register('costPrice', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                      {errors.costPrice && (
                        <p className="text-sm text-red-500 mt-1">{errors.costPrice.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Preço de Venda
                      </label>
                      <input
                        {...register('salePrice', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                      {errors.salePrice && (
                        <p className="text-sm text-red-500 mt-1">{errors.salePrice.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Estoque */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Boxes className="w-4 h-4" />
                      Estoque
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Quantidade em Estoque
                      </label>
                      <input
                        {...register('stock', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0"
                      />
                      {errors.stock && (
                        <p className="text-sm text-red-500 mt-1">{errors.stock.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isLoading || createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  {(isLoading || createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <Save className="w-4 h-4" />
                  {variation ? 'Atualizar' : 'Criar'} Variação
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
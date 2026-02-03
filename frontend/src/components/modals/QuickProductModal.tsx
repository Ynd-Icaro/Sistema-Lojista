'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Package, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productsApi, categoriesApi } from '@/lib/api';
import { showApiError } from '@/lib/error-handler';
import { QuickCategoryModal } from './QuickCategoryModal';
import { useModalCache } from '@/hooks/useModalCache';

const quickProductSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  sku: z.string().min(1, 'SKU é obrigatório'),
  price: z.number().min(0.01, 'Preço de venda é obrigatório'),
  stock: z.number().min(0).default(0),
  categoryId: z.string().optional(),
  barcode: z.string().optional(),
});

type QuickProductForm = z.infer<typeof quickProductSchema>;

interface QuickProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (product: any) => void;
  initialBarcode?: string;
}

export function QuickProductModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialBarcode 
}: QuickProductModalProps) {
  const queryClient = useQueryClient();
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const { loadCache, saveCache, clearCache } = useModalCache('quick-product');
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuickProductForm>({
    resolver: zodResolver(quickProductSchema),
    defaultValues: {
      stock: 0,
      barcode: initialBarcode || '',
    },
  });

  const formData = watch();

  // Load cache when modal opens
  useEffect(() => {
    if (isOpen) {
      const cached = loadCache();
      if (cached && cached.name) {
        reset({ ...cached, barcode: initialBarcode || cached.barcode });
      } else if (initialBarcode) {
        setValue('barcode', initialBarcode);
      }
    }
  }, [isOpen, loadCache, reset, initialBarcode, setValue]);

  // Save to cache on form change
  useEffect(() => {
    if (isOpen && formData.name) {
      saveCache(formData);
    }
  }, [isOpen, formData, saveCache]);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll({ limit: 100 }).then((res) => res.data),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => productsApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto cadastrado com sucesso!');
      clearCache();
      reset({ stock: 0 });
      onClose();
      if (onSuccess) {
        onSuccess(response.data);
      }
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao cadastrar produto');
    },
  });

  const onSubmit = (data: QuickProductForm) => {
    createMutation.mutate({
      ...data,
      salePrice: data.price, // Map price to salePrice
      isActive: true,
      costPrice: 0, // Default cost price
      minStock: 0, // Default min stock
    });
  };

  const handleClose = () => {
    // Don't clear cache on close - preserves data if clicked outside
    onClose();
  };

  return (
    <>
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
              className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 bg-primary-500 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6" />
                    <h3 className="text-lg font-semibold">
                      Cadastro Rápido de Produto
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
                  <label className="label">Nome do Produto *</label>
                  <input
                    {...register('name')}
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ex: Camiseta, Tênis, Celular..."
                    autoFocus
                  />
                  {errors.name && (
                    <p className="text-danger-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">SKU *</label>
                    <input
                      {...register('sku')}
                      className={`input ${errors.sku ? 'input-error' : ''}`}
                      placeholder="Código interno único"
                    />
                    {errors.sku && (
                      <p className="text-danger-500 text-sm mt-1">{errors.sku.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Código de Barras</label>
                    <input
                      {...register('barcode')}
                      className="input"
                      placeholder="EAN/GTIN"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Preço de Venda *</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('price', { valueAsNumber: true })}
                      className={`input ${errors.price ? 'input-error' : ''}`}
                      placeholder="0,00"
                    />
                    {errors.price && (
                      <p className="text-danger-500 text-sm mt-1">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Estoque Inicial</label>
                    <input
                      type="number"
                      {...register('stock', { valueAsNumber: true })}
                      className="input"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Categoria</label>
                  <div className="flex gap-2">
                    <select
                      {...register('categoryId')}
                      className="input flex-1"
                    >
                      <option value="">Sem categoria</option>
                      {categoriesData?.data?.map((cat: any) => (
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
                      <Plus className="w-5 h-5" />
                    </button>
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
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Package className="w-5 h-5" />
                        Cadastrar Produto
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Category Modal */}
      <QuickCategoryModal
        isOpen={showQuickCategory}
        onClose={() => setShowQuickCategory(false)}
        onSuccess={(category) => {
          setValue('categoryId', category.id);
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        }}
      />
    </>
  );
}

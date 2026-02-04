'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Loader2,
  X,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { productsApi, categoriesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { showApiError } from '@/lib/error-handler';

const productSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  sku: z.string().min(1, 'SKU é obrigatório'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  costPrice: z.number().min(0, 'Preço de custo inválido'),
  salePrice: z.number().min(0.01, 'Preço de venda é obrigatório'),
  stock: z.number().min(0, 'Estoque inválido'),
  minStock: z.number().min(0, 'Estoque mínimo inválido'),
  supplier: z.string().optional(),
  supplierCode: z.string().optional(),
  brand: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ReviewProductsPage() {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  // Fetch products for review
  const { data: productsData, isLoading, refetch } = useQuery({
    queryKey: ['products-review'],
    queryFn: () => productsApi.getProductsForReview(),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => productsApi.approveImport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-review'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto aprovado com sucesso!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao aprovar produto');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductForm }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-review'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar produto');
    },
  });

  // Approve and update
  const approveAndUpdateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductForm }) => {
      await productsApi.update(id, data);
      await productsApi.approveImport(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-review'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado e aprovado!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar produto');
    },
  });

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      description: product.description || '',
      categoryId: product.categoryId || '',
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock,
      supplier: product.supplier || '',
      supplierCode: product.supplierCode || '',
      brand: product.brand || '',
      color: product.color || '',
      size: product.size || '',
      material: product.material || '',
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    reset();
  };

  const onSubmit = (data: ProductForm) => {
    if (editingProduct) {
      const cleanData = {
        ...data,
        barcode: data.barcode || undefined,
        description: data.description || undefined,
        categoryId: data.categoryId || undefined,
        supplier: data.supplier || undefined,
        supplierCode: data.supplierCode || undefined,
        brand: data.brand || undefined,
        color: data.color || undefined,
        size: data.size || undefined,
        material: data.material || undefined,
      };
      approveAndUpdateMutation.mutate({ id: editingProduct.id, data: cleanData });
    }
  };

  const products = productsData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/produtos"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Revisar Importação
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {products.length} produto(s) aguardando revisão
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Produtos com dados incompletos
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Os produtos abaixo foram importados com campos obrigatórios faltando ou fora do padrão.
            Revise e complete as informações antes de aprová-los.
          </p>
        </div>
      </div>

      {/* Products list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="card py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="card py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Nenhum produto para revisar
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Todos os produtos importados foram aprovados.
            </p>
            <Link href="/dashboard/produtos" className="btn-primary inline-flex">
              Voltar para Produtos
            </Link>
          </div>
        ) : (
          products.map((product: any) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      SKU: {product.sku} | {formatCurrency(product.salePrice)}
                    </p>
                    {product.importNotes && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        ⚠️ {product.importNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="btn-secondary text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => approveMutation.mutate(product.id)}
                    disabled={approveMutation.isPending}
                    className="btn-primary text-sm"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Aprovar
                  </button>
                </div>
              </div>

              {/* Product details */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Custo:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
                    {product.costPrice ? formatCurrency(product.costPrice) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Estoque:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
                    {product.stock ?? '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Fornecedor:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
                    {product.supplier || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Marca:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
                    {product.brand || '-'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingProduct && (
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
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Editar Produto para Aprovação
                </h2>
                <button
                  onClick={closeModal}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Produto *
                    </label>
                    <input
                      {...register('name')}
                      className="input"
                      placeholder="Nome do produto"
                    />
                    {errors.name && (
                      <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      SKU *
                    </label>
                    <input
                      {...register('sku')}
                      className="input"
                      placeholder="SKU"
                    />
                    {errors.sku && (
                      <span className="text-red-500 text-xs mt-1">{errors.sku.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Código de Barras
                    </label>
                    <input
                      {...register('barcode')}
                      className="input"
                      placeholder="Código de barras"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Categoria
                    </label>
                    <select {...register('categoryId')} className="input">
                      <option value="">Selecione...</option>
                      {categoriesData?.map?.((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Fornecedor
                    </label>
                    <input
                      {...register('supplier')}
                      className="input"
                      placeholder="Nome do fornecedor"
                    />
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Preço de Custo
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('costPrice', { valueAsNumber: true })}
                      className="input"
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Preço de Venda *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('salePrice', { valueAsNumber: true })}
                      className="input"
                      placeholder="0,00"
                    />
                    {errors.salePrice && (
                      <span className="text-red-500 text-xs mt-1">{errors.salePrice.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Estoque
                    </label>
                    <input
                      type="number"
                      {...register('stock', { valueAsNumber: true })}
                      className="input"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Estoque Mínimo
                    </label>
                    <input
                      type="number"
                      {...register('minStock', { valueAsNumber: true })}
                      className="input"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Marca
                    </label>
                    <input
                      {...register('brand')}
                      className="input"
                      placeholder="Marca"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Cor
                    </label>
                    <input
                      {...register('color')}
                      className="input"
                      placeholder="Cor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tamanho
                    </label>
                    <input
                      {...register('size')}
                      className="input"
                      placeholder="Tamanho"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Descrição
                  </label>
                  <textarea
                    {...register('description')}
                    className="input"
                    rows={3}
                    placeholder="Descrição do produto"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={approveAndUpdateMutation.isPending}
                    className="btn-primary"
                  >
                    {approveAndUpdateMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Salvar e Aprovar
                      </>
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

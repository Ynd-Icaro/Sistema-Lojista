'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Package,
  Tag,
  DollarSign,
  Boxes,
  AlertTriangle,
  Loader2,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { productsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { showApiError } from '@/lib/error-handler';
import { VariationModal } from '@/components/modals';

export default function ProductVariationsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const queryClient = useQueryClient();

  const [variationModal, setVariationModal] = useState({
    isOpen: false,
    variation: null as any,
  });

  // Buscar produto pai
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getOne(productId),
    enabled: !!productId,
  });

  // Buscar variações
  const { data: variations, isLoading: variationsLoading } = useQuery({
    queryKey: ['product-variations', productId],
    queryFn: () => productsApi.getVariations(productId),
    enabled: !!productId,
  });

  const deleteMutation = useMutation({
    mutationFn: (variationId: string) => productsApi.deleteVariation(variationId),
    onSuccess: () => {
      toast.success('Variação removida com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['product-variations', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      showApiError(error, 'Erro ao remover variação');
    },
  });

  const handleDeleteVariation = async (variation: any) => {
    if (window.confirm(`Tem certeza que deseja remover a variação "${variation.name}"?`)) {
      await deleteMutation.mutateAsync(variation.id);
    }
  };

  if (productLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Produto não encontrado
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          O produto que você está procurando não existe ou foi removido.
        </p>
        <Link
          href="/dashboard/produtos"
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          Voltar para Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/produtos`}
            className="w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Variações do Produto
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {product.name} - SKU: {product.sku}
            </p>
          </div>
        </div>

        <button
          onClick={() => setVariationModal({ isOpen: true, variation: null })}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Variação
        </button>
      </div>

      {/* Variações Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {variationsLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : variations && variations.length > 0 ? (
            variations.map((variation: any) => (
              <motion.div
                key={variation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card group hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {variation.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        SKU: {variation.sku}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setVariationModal({ isOpen: true, variation })}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                      title="Editar variação"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteVariation(variation)}
                      disabled={deleteMutation.isPending}
                      className="w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors text-red-500"
                      title="Remover variação"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Atributos */}
                <div className="space-y-2 mb-4">
                  {variation.color && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Cor:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {variation.color}
                      </span>
                    </div>
                  )}
                  {variation.size && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">Tamanho:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {variation.size}
                      </span>
                    </div>
                  )}
                </div>

                {/* Preços e Estoque */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Preço</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(variation.salePrice)}
                    </p>
                  </div>

                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <Boxes className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Estoque</p>
                    <p className={`font-semibold ${
                      variation.stock <= variation.minStock
                        ? 'text-red-500'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {variation.stock}
                    </p>
                  </div>
                </div>

                {/* Status de Estoque */}
                {variation.stock <= variation.minStock && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    Estoque baixo
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Nenhuma variação encontrada
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Este produto ainda não possui variações cadastradas.
              </p>
              <button
                onClick={() => setVariationModal({ isOpen: true, variation: null })}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                Criar Primeira Variação
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Variação */}
      <VariationModal
        isOpen={variationModal.isOpen}
        onClose={() => setVariationModal({ isOpen: false, variation: null })}
        parentProduct={product}
        variation={variationModal.variation}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['product-variations', productId] });
        }}
      />
    </div>
  );
}
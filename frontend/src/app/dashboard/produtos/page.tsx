'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  X,
  Loader2,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Eye,
  FolderPlus,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  ClipboardList,
  DollarSign,
  Boxes,
  Truck,
  Tag,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { productsApi, categoriesApi, suppliersApi } from '@/lib/api';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import { showApiError } from '@/lib/error-handler';
import { QuickCategoryModal } from '@/components/modals/QuickCategoryModal';
import { QuickSupplierModal } from '@/components/modals/QuickSupplierModal';
import { ViewToggle, useViewMode } from '@/components/ui/ViewToggle';

const productSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  sku: z.string().min(1, 'SKU é obrigatório'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  costPrice: z.number().min(0, 'Preço de custo inválido'),
  salePrice: z.number().min(0.01, 'Preço de venda é obrigatório'),
  stock: z.number().min(0, 'Estoque inválido'),
  minStock: z.number().min(0, 'Estoque mínimo inválido'),
  isActive: z.boolean().default(true),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { view, setView } = useViewMode('products', 'list');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 0,
      isActive: true,
    },
  });

  // Fetch products stats
  const { data: statsData } = useQuery({
    queryKey: ['products-stats'],
    queryFn: () => productsApi.getStats().then((res) => res.data),
  });

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter],
    queryFn: () =>
      productsApi.getAll({ page, search, categoryId: categoryFilter || undefined }).then((res) => res.data),
  });

  // Fetch categories for filter
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((res) => res.data),
  });

  // Fetch suppliers for filter
  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers-simple'],
    queryFn: () => suppliersApi.getSimpleList().then((res) => res.data),
  });

  const handleCategoryCreated = (category: any) => {
    // Atualiza a lista de categorias
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    // Seleciona a categoria recém-criada no formulário
    if (showModal) {
      setValue('categoryId', category.id);
    }
  };

  const handleSupplierCreated = (supplier: any) => {
    // Atualiza a lista de fornecedores
    queryClient.invalidateQueries({ queryKey: ['suppliers-simple'] });
    // Seleciona o fornecedor recém-criado no formulário
    if (showModal) {
      setValue('supplierId', supplier.id);
    }
  };

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: (data: ProductForm) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-stats'] });
      toast.success('Produto criado com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao criar produto');
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductForm }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-stats'] });
      toast.success('Produto atualizado com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar produto');
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-stats'] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao excluir produto');
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: (file: File) => productsApi.importProducts(file),
    onSuccess: (response) => {
      const result = response.data;
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-stats'] });
      if (result.errors === 0) {
        toast.success(`${result.created + result.updated} produtos importados com sucesso!`);
      } else {
        toast.success(`Importação concluída: ${result.created} criados, ${result.updated} atualizados, ${result.errors} erros`);
      }
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao importar produtos');
    },
  });

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const response = await productsApi.getImportTemplate();
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modelo_importacao_produtos.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Modelo baixado com sucesso!');
    } catch (error: any) {
      showApiError(error, 'Erro ao baixar modelo');
    }
  };

  // Export products
  const handleExport = async (format: 'xlsx' | 'csv' = 'xlsx') => {
    try {
      const response = await productsApi.exportProducts({ format, categoryId: categoryFilter || undefined });
      const contentType = format === 'xlsx' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `produtos_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Exportação concluída!');
    } catch (error: any) {
      showApiError(error, 'Erro ao exportar produtos');
    }
  };

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  const openModal = (product?: any) => {
    if (product) {
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
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      reset({
        costPrice: 0,
        salePrice: 0,
        stock: 0,
        minStock: 0,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    reset();
  };

  const onSubmit = (data: ProductForm) => {
    // Limpa campos vazios antes de enviar
    const cleanData = {
      ...data,
      barcode: data.barcode || undefined,
      description: data.description || undefined,
      categoryId: data.categoryId || undefined,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Produtos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total de Produtos</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {statsData?.totalProducts ?? productsData?.meta?.total ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Boxes className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        {/* Valor Total em Estoque */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Valor em Estoque</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(statsData?.stockValue ?? 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </motion.div>

        {/* Estoque Baixo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            // TODO: Filtrar por estoque baixo
            toast('Filtrando por estoque baixo...', { icon: '📦' });
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Estoque Baixo</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {statsData?.lowStockCount ?? 0}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Clique para filtrar</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </motion.div>

        {/* Produtos para Revisar */}
        <Link href="/dashboard/produtos/revisar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow h-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Para Revisar</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {statsData?.reviewCount ?? 0}
                </p>
                <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">Ver produtos →</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Produtos</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gerencie seu catálogo de produtos
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <ViewToggle storageKey="products" onViewChange={setView} />
          
          {/* Botão Importar */}
          <div className="relative">
            <button 
              onClick={() => setShowImportModal(true)}
              className="btn-secondary"
            >
              <Upload className="w-4 h-4" />
              Importar
            </button>
          </div>
          
          {/* Dropdown Exportar */}
          <div className="relative group">
            <button className="btn-secondary">
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('xlsx')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel (.xlsx)
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-lg flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV (.csv)
              </button>
            </div>
          </div>
          
          <Link href="/dashboard/produtos/novo" className="btn-primary">
            <Plus className="w-5 h-5" />
            Novo Produto
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos..."
              className="input pl-10"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="">Todas categorias</option>
            {categoriesData?.map?.((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products table/cards */}
      {view === 'list' ? (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
                  </td>
                </tr>
              ) : productsData?.data && productsData.data.length > 0 ? (
                productsData.data.map((product: any) => (
                  <tr key={product.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {product.name}
                          </p>
                          {product.barcode && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Cód: {product.barcode}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-mono text-sm">{product.sku}</span>
                    </td>
                    <td className="table-cell">
                      {product.category?.name || '-'}
                    </td>
                    <td className="table-cell">
                      {product.supplier ? (
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{product.supplier.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(product.salePrice)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Custo: {formatCurrency(product.costPrice)}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        product.stock <= 0
                          ? 'badge-danger'
                          : product.stock <= product.minStock
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}>
                        {product.stock} un.
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${product.isActive ? 'badge-success' : 'badge-gray'}`}>
                        {product.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/produtos/${product.id}/variacoes`}
                          className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 dark:text-slate-400 dark:hover:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg"
                          title="Gerenciar variações"
                        >
                          <Tag className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/produtos/novo?id=${product.id}`}
                          className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:text-slate-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Nenhum produto encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {productsData?.meta && productsData.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Página {productsData.meta.page} de {productsData.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="btn-secondary disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= productsData.meta.totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
      ) : (
      /* Card View */
      <>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : productsData?.data && productsData.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {productsData.data.map((product: any) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-hover"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        SKU: {product.sku}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Categoria:</span>
                    <span className="text-slate-700 dark:text-slate-300">{product.category?.name || '-'}</span>
                  </div>
                  {product.supplier && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Fornecedor:</span>
                      <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {product.supplier.name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Preço:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(product.salePrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Estoque:</span>
                    <span className={`badge ${
                      product.stock <= 0
                        ? 'badge-danger'
                        : product.stock <= product.minStock
                        ? 'badge-warning'
                        : 'badge-success'
                    }`}>
                      {product.stock} un.
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className={`badge ${product.isActive ? 'badge-success' : 'badge-gray'}`}>
                    {product.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/dashboard/produtos/${product.id}/variacoes`}
                      className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 dark:text-slate-400 dark:hover:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg"
                      title="Gerenciar variações"
                    >
                      <Tag className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dashboard/produtos/novo?id=${product.id}`}
                      className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:text-slate-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Comece adicionando seu primeiro produto
            </p>
            <Link href="/dashboard/produtos/novo" className="btn-primary">
              <Plus className="w-5 h-5" />
              Novo Produto
            </Link>
          </div>
        )}
        
        {/* Card Pagination */}
        {productsData?.meta && productsData.meta.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Página {productsData.meta.page} de {productsData.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="btn-secondary disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= productsData.meta.totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </>
      )}

      {/* Product Modal */}
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
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
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
                    <div>
                      <label className="label">Nome *</label>
                      <input
                        {...register('name')}
                        className={`input ${errors.name ? 'input-error' : ''}`}
                        placeholder="Nome do produto"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">SKU *</label>
                      <input
                        {...register('sku')}
                        className={`input ${errors.sku ? 'input-error' : ''}`}
                        placeholder="SKU"
                      />
                      {errors.sku && (
                        <p className="text-red-500 text-sm mt-1">{errors.sku.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Código de Barras</label>
                      <input
                        {...register('barcode')}
                        className="input"
                        placeholder="Código de barras"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="label mb-0">Categoria</label>
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(true)}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                        >
                          <FolderPlus className="w-3 h-3" />
                          Nova categoria
                        </button>
                      </div>
                      <select {...register('categoryId')} className="input" disabled={categoriesLoading}>
                        <option value="">
                          {categoriesLoading ? 'Carregando...' : 'Selecione...'}
                        </option>
                        {categoriesData?.map?.((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="label mb-0">Fornecedor</label>
                        <button
                          type="button"
                          onClick={() => setShowSupplierModal(true)}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                        >
                          <Truck className="w-3 h-3" />
                          Novo fornecedor
                        </button>
                      </div>
                      <select {...register('supplierId')} className="input" disabled={suppliersLoading}>
                        <option value="">
                          {suppliersLoading ? 'Carregando...' : 'Selecione...'}
                        </option>
                        {suppliersData?.map?.((sup: any) => (
                          <option key={sup.id} value={sup.id}>
                            {sup.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Preço de Custo</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('costPrice', { valueAsNumber: true })}
                        className={`input ${errors.costPrice ? 'input-error' : ''}`}
                        placeholder="0,00"
                      />
                      {errors.costPrice && (
                        <p className="text-red-500 text-sm mt-1">{errors.costPrice.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Preço de Venda *</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('salePrice', { valueAsNumber: true })}
                        className={`input ${errors.salePrice ? 'input-error' : ''}`}
                        placeholder="0,00"
                      />
                      {errors.salePrice && (
                        <p className="text-red-500 text-sm mt-1">{errors.salePrice.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Estoque</label>
                      <input
                        type="number"
                        {...register('stock', { valueAsNumber: true })}
                        className={`input ${errors.stock ? 'input-error' : ''}`}
                        placeholder="0"
                      />
                      {errors.stock && (
                        <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Estoque Mínimo</label>
                      <input
                        type="number"
                        {...register('minStock', { valueAsNumber: true })}
                        className={`input ${errors.minStock ? 'input-error' : ''}`}
                        placeholder="0"
                      />
                      {errors.minStock && (
                        <p className="text-red-500 text-sm mt-1">{errors.minStock.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="label">Descrição</label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="input resize-none"
                      placeholder="Descrição do produto..."
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
                      Produto ativo
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
                    ) : editingProduct ? (
                      'Salvar'
                    ) : (
                      'Criar Produto'
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
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={handleCategoryCreated}
      />

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Importar Produtos
                </h2>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Download template */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Modelo de Importação
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Baixe o modelo padrão com as instruções de preenchimento.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Modelo
                  </button>
                </div>

                {/* Upload area */}
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                    Enviar Arquivo
                  </h3>
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                    <Upload className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="text-slate-600 dark:text-slate-400 text-sm text-center">
                      Clique para selecionar ou arraste o arquivo
                    </span>
                    <span className="text-slate-400 text-xs mt-1">
                      Formatos aceitos: .xlsx, .xls, .csv
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Loading */}
                {importMutation.isPending && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Importando produtos...
                    </span>
                  </div>
                )}

                {/* Import result */}
                {importResult && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      Resultado da Importação
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
                        <p className="text-xs text-green-700 dark:text-green-400">Criados</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                        <CheckCircle2 className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">Atualizados</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                        <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-amber-600">{importResult.review}</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">Para Revisar</p>
                      </div>
                    </div>

                    {importResult.errors > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                          <XCircle className="w-5 h-5" />
                          <span className="font-medium">{importResult.errors} erros</span>
                        </div>
                        {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                          <ul className="text-sm text-red-600 dark:text-red-400 list-disc pl-5 max-h-32 overflow-y-auto">
                            {importResult.errorDetails.slice(0, 5).map((err: any, idx: number) => (
                              <li key={idx}>Linha {err.row}: {err.errors?.join(', ')}</li>
                            ))}
                            {importResult.errorDetails.length > 5 && (
                              <li>... e mais {importResult.errorDetails.length - 5} erros</li>
                            )}
                          </ul>
                        )}
                      </div>
                    )}

                    {importResult.review > 0 && (
                      <a
                        href="/dashboard/produtos/revisar"
                        className="block text-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Ver produtos para revisão →
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                  }}
                  className="btn-secondary"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Category Modal */}
      <QuickCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={handleCategoryCreated}
      />

      {/* Quick Supplier Modal */}
      <QuickSupplierModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSuccess={handleSupplierCreated}
      />
    </div>
  );
}

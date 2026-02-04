'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  DollarSign,
  Boxes,
  FileText,
  Truck,
  Ruler,
  Globe,
  Tag,
  Plus,
  Trash2,
  Copy,
  X,
  ImagePlus,
  Calculator,
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { QuickCategoryModal, QuickSupplierModal } from '@/components/modals';
import { productsApi, categoriesApi, suppliersApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { showApiError } from '@/lib/error-handler';

// Schema de validação completo
const productSchema = z.object({
  // Dados Básicos
  name: z.string().min(2, 'Nome é obrigatório'),
  sku: z.string().min(1, 'SKU é obrigatório'),
  barcode: z.string().optional(),
  gtin: z.string().optional(),
  mpn: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  warrantyMonths: z.number().optional(),
  
  // Preços
  costPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0.01, 'Preço de venda é obrigatório'),
  wholesalePrice: z.number().optional(),
  promoPrice: z.number().optional(),
  promoStartDate: z.string().optional(),
  promoEndDate: z.string().optional(),
  profitMargin: z.number().optional(),
  markup: z.number().optional(),
  
  // Estoque
  stock: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  maxStock: z.number().optional(),
  reservedStock: z.number().optional(),
  stockLocation: z.string().optional(),
  shelfLocation: z.string().optional(),
  
  // Dimensões
  weight: z.number().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
  length: z.number().optional(),
  
  // Fiscal
  ncm: z.string().optional(),
  cest: z.string().optional(),
  cfop: z.string().optional(),
  cst: z.string().optional(),
  origem: z.string().optional(),
  icmsRate: z.number().optional(),
  ipiRate: z.number().optional(),
  pisRate: z.number().optional(),
  cofinsRate: z.number().optional(),
  
  // SEO
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  slug: z.string().optional(),
  
  // Configurações
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  allowBackorder: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  
  // Variações (simplificado)
  hasVariations: z.boolean().default(false),
  variationAttribute1: z.string().optional(),
  variationAttribute2: z.string().optional(),
  variationValues1: z.string().optional(),
  variationValues2: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

const TABS = [
  { id: 'basic', label: 'Dados Básicos', icon: Package },
  { id: 'pricing', label: 'Preços', icon: DollarSign },
  { id: 'stock', label: 'Estoque', icon: Boxes },
  { id: 'dimensions', label: 'Dimensões', icon: Ruler },
  { id: 'fiscal', label: 'Fiscal', icon: FileText },
  { id: 'variations', label: 'Variações', icon: Tag },
  { id: 'seo', label: 'SEO', icon: Globe },
];

const ORIGENS = [
  { value: '0', label: '0 - Nacional' },
  { value: '1', label: '1 - Estrangeira - Importação direta' },
  { value: '2', label: '2 - Estrangeira - Adquirida mercado interno' },
  { value: '3', label: '3 - Nacional, com conteúdo de importação > 40%' },
  { value: '4', label: '4 - Nacional, produção conforme processos básicos' },
  { value: '5', label: '5 - Nacional, com conteúdo de importação <= 40%' },
  { value: '6', label: '6 - Estrangeira - Importação direta, sem similar nacional' },
  { value: '7', label: '7 - Estrangeira - Adquirida mercado interno, sem similar nacional' },
  { value: '8', label: '8 - Nacional, com conteúdo de importação > 70%' },
];

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const productId = searchParams.get('id');
  const isEditing = !!productId;

  const [activeTab, setActiveTab] = useState('basic');
  const [showQuickCategoryModal, setShowQuickCategoryModal] = useState(false);
  const [showQuickSupplierModal, setShowQuickSupplierModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 0,
      isActive: true,
      trackInventory: true,
      hasVariations: false,
    },
  });

  const watchedCostPrice = watch('costPrice');
  const watchedSalePrice = watch('salePrice');
  const watchedHasVariations = watch('hasVariations');

  // Cálculo automático de margem e markup
  useEffect(() => {
    if (watchedCostPrice && watchedSalePrice && watchedCostPrice > 0) {
      const margin = ((watchedSalePrice - watchedCostPrice) / watchedSalePrice) * 100;
      const markup = ((watchedSalePrice - watchedCostPrice) / watchedCostPrice) * 100;
      setValue('profitMargin', parseFloat(margin.toFixed(2)));
      setValue('markup', parseFloat(markup.toFixed(2)));
    }
  }, [watchedCostPrice, watchedSalePrice, setValue]);

  // Fetch product if editing
  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getOne(productId!),
    enabled: isEditing,
  });

  // Load product data into form
  useEffect(() => {
    if (productData) {
      reset({
        ...productData,
        promoStartDate: productData.promoStartDate?.split('T')[0],
        promoEndDate: productData.promoEndDate?.split('T')[0],
      });
    }
  }, [productData, reset]);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-simple'],
    queryFn: () => suppliersApi.getSimpleList(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ProductForm) => productsApi.create(data),
    onSuccess: () => {
      toast.success('Produto criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-stats'] });
      router.push('/dashboard/produtos');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao criar produto');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ProductForm) => productsApi.update(productId!, data),
    onSuccess: () => {
      toast.success('Produto atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-stats'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      router.push('/dashboard/produtos');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar produto');
    },
  });

  const onSubmit = (data: ProductForm) => {
    // Campos que são realmente obrigatórios no backend
    const requiredFields = {
      name: data.name.trim(),
      sku: data.sku.trim(),
      salePrice: data.salePrice,
    };

    // Campos opcionais - apenas inclui se tiver valor válido
    const optionalFields: any = {};

    // Strings opcionais - apenas se não estiverem vazias
    if (data.barcode?.trim()) optionalFields.barcode = data.barcode.trim();
    if (data.gtin?.trim()) optionalFields.gtin = data.gtin.trim();
    if (data.mpn?.trim()) optionalFields.mpn = data.mpn.trim();
    if (data.description?.trim()) optionalFields.description = data.description.trim();
    if (data.shortDescription?.trim()) optionalFields.shortDescription = data.shortDescription.trim();
    if (data.categoryId?.trim()) optionalFields.categoryId = data.categoryId.trim();
    if (data.supplierId?.trim()) optionalFields.supplierId = data.supplierId.trim();
    if (data.brand?.trim()) optionalFields.brand = data.brand.trim();
    if (data.model?.trim()) optionalFields.model = data.model.trim();
    if (data.ncm?.trim()) optionalFields.ncm = data.ncm.trim();
    if (data.cest?.trim()) optionalFields.cest = data.cest.trim();
    if (data.cfop?.trim()) optionalFields.cfop = data.cfop.trim();
    if (data.cst?.trim()) optionalFields.cst = data.cst.trim();
    if (data.origem?.trim()) optionalFields.origem = data.origem.trim();
    if (data.stockLocation?.trim()) optionalFields.stockLocation = data.stockLocation.trim();
    if (data.shelfLocation?.trim()) optionalFields.shelfLocation = data.shelfLocation.trim();

    // Números opcionais - apenas se forem maiores que 0
    if (data.costPrice && data.costPrice > 0) optionalFields.costPrice = data.costPrice;
    if (data.wholesalePrice && data.wholesalePrice > 0) optionalFields.wholesalePrice = data.wholesalePrice;
    if (data.promoPrice && data.promoPrice > 0) optionalFields.promoPrice = data.promoPrice;
    if (data.stock !== undefined && data.stock >= 0) optionalFields.stock = data.stock;
    if (data.minStock && data.minStock > 0) optionalFields.minStock = data.minStock;
    if (data.maxStock && data.maxStock > 0) optionalFields.maxStock = data.maxStock;
    if (data.reservedStock && data.reservedStock > 0) optionalFields.reservedStock = data.reservedStock;
    if (data.weight && data.weight > 0) optionalFields.weight = data.weight;
    if (data.height && data.height > 0) optionalFields.height = data.height;
    if (data.width && data.width > 0) optionalFields.width = data.width;
    if (data.length && data.length > 0) optionalFields.length = data.length;
    if (data.warrantyMonths && data.warrantyMonths > 0) optionalFields.warrantyMonths = data.warrantyMonths;

    // Taxas - apenas se forem >= 0
    if (data.icmsRate !== undefined && data.icmsRate >= 0) optionalFields.icmsRate = data.icmsRate;
    if (data.ipiRate !== undefined && data.ipiRate >= 0) optionalFields.ipiRate = data.ipiRate;
    if (data.pisRate !== undefined && data.pisRate >= 0) optionalFields.pisRate = data.pisRate;
    if (data.cofinsRate !== undefined && data.cofinsRate >= 0) optionalFields.cofinsRate = data.cofinsRate;

    // Datas opcionais
    if (data.promoStartDate?.trim()) optionalFields.promoStartDate = data.promoStartDate.trim();
    if (data.promoEndDate?.trim()) optionalFields.promoEndDate = data.promoEndDate.trim();

    // Configurações booleanas
    optionalFields.isActive = data.isActive ?? true;
    optionalFields.isFeatured = data.isFeatured ?? false;
    optionalFields.allowBackorder = data.allowBackorder ?? false;
    optionalFields.trackInventory = data.trackInventory ?? true;

    // Remove campos que não existem no backend
    // hasVariations, variationAttribute1, variationAttribute2, variationValues1, variationValues2
    // seoTitle, seoDescription, seoKeywords, slug, profitMargin, markup

    // Combina campos obrigatórios com opcionais
    const cleanData = {
      ...requiredFields,
      ...optionalFields,
    };

    if (isEditing) {
      updateMutation.mutate(cleanData);
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/produtos"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {isEditing
                ? 'Atualize as informações do produto'
                : 'Preencha os dados do novo produto'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/produtos" className="btn-secondary">
            Cancelar
          </Link>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="btn-primary"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-4 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab: Dados Básicos */}
        {activeTab === 'basic' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card space-y-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informações Básicas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="label">Nome do Produto *</label>
                <input
                  {...register('name')}
                  className={cn('input', errors.name && 'input-error')}
                  placeholder="Ex: Camiseta Premium Algodão"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="label">SKU *</label>
                <input
                  {...register('sku')}
                  className={cn('input', errors.sku && 'input-error')}
                  placeholder="Ex: PROD-001"
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
                  placeholder="Ex: 7891234567890"
                />
              </div>

              <div>
                <label className="label">GTIN/EAN</label>
                <input
                  {...register('gtin')}
                  className="input"
                  placeholder="Código GTIN"
                />
              </div>

              <div>
                <label className="label">Código do Fabricante (MPN)</label>
                <input
                  {...register('mpn')}
                  className="input"
                  placeholder="Código MPN"
                />
              </div>

              <div>
                <label className="label">Categoria</label>
                <div className="flex gap-2">
                  <select {...register('categoryId')} className="input flex-1">
                    <option value="">Selecione uma categoria</option>
                    {categoriesData?.map?.((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowQuickCategoryModal(true)}
                    className="btn-secondary px-3"
                    title="Adicionar categoria rapidamente"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Fornecedor</label>
                <div className="flex gap-2">
                  <select {...register('supplierId')} className="input flex-1">
                    <option value="">Selecione um fornecedor</option>
                    {suppliersData?.map?.((supplier: any) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowQuickSupplierModal(true)}
                    className="btn-secondary px-3"
                    title="Adicionar fornecedor rapidamente"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Marca</label>
                <input
                  {...register('brand')}
                  className="input"
                  placeholder="Ex: Nike"
                />
              </div>

              <div>
                <label className="label">Modelo</label>
                <input
                  {...register('model')}
                  className="input"
                  placeholder="Ex: Air Max 90"
                />
              </div>

              <div>
                <label className="label">Garantia (meses)</label>
                <input
                  type="number"
                  {...register('warrantyMonths', { valueAsNumber: true })}
                  className="input"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="label">Descrição Curta</label>
              <input
                {...register('shortDescription')}
                className="input"
                placeholder="Breve descrição para listagens"
              />
            </div>

            <div>
              <label className="label">Descrição Completa</label>
              <textarea
                {...register('description')}
                rows={4}
                className="input resize-none"
                placeholder="Descrição detalhada do produto..."
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4 rounded border-slate-300 text-primary-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Produto ativo
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isFeatured')}
                  className="w-4 h-4 rounded border-slate-300 text-primary-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Produto em destaque
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('trackInventory')}
                  className="w-4 h-4 rounded border-slate-300 text-primary-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Controlar estoque
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('allowBackorder')}
                  className="w-4 h-4 rounded border-slate-300 text-primary-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Permitir pedidos sem estoque
                </span>
              </label>
            </div>
          </motion.div>
        )}

        {/* Tab: Preços */}
        {activeTab === 'pricing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card space-y-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Preços e Valores
            </h2>

            {/* Calculadora de Preço */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Calculadora de Preço Sugerido
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-sm">Preço de Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={watchedCostPrice || ''}
                    onChange={(e) => setValue('costPrice', parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="label text-sm">Margem Desejada (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    onChange={(e) => {
                      const cost = watchedCostPrice || 0;
                      const margin = parseFloat(e.target.value) || 0;
                      if (cost > 0 && margin > 0) {
                        const suggestedPrice = cost / (1 - margin / 100);
                        setValue('salePrice', parseFloat(suggestedPrice.toFixed(2)));
                      }
                    }}
                    className="input"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="label text-sm">Preço Sugerido</label>
                  <input
                    type="number"
                    step="0.01"
                    value={watchedSalePrice || ''}
                    readOnly
                    className="input bg-slate-100 dark:bg-slate-700"
                    placeholder="Calculado automaticamente"
                  />
                </div>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Digite o preço de custo e a margem desejada para calcular o preço de venda sugerido.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Preço de Custo</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('costPrice', { valueAsNumber: true })}
                  className={cn('input', errors.costPrice && 'input-error')}
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
                  className={cn('input', errors.salePrice && 'input-error')}
                  placeholder="0,00"
                />
                {errors.salePrice && (
                  <p className="text-red-500 text-sm mt-1">{errors.salePrice.message}</p>
                )}
              </div>

              <div>
                <label className="label">Preço Atacado</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('wholesalePrice', { valueAsNumber: true })}
                  className="input"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="label">Preço Promocional</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('promoPrice', { valueAsNumber: true })}
                  className="input"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="label">Início da Promoção</label>
                <input
                  type="date"
                  {...register('promoStartDate')}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Fim da Promoção</label>
                <input
                  type="date"
                  {...register('promoEndDate')}
                  className="input"
                />
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Margem de Lucro (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('profitMargin', { valueAsNumber: true })}
                  className="input bg-slate-100 dark:bg-slate-700"
                  readOnly
                />
                <p className="text-xs text-slate-500 mt-1">Calculado automaticamente</p>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Markup (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('markup', { valueAsNumber: true })}
                  className="input bg-slate-100 dark:bg-slate-700"
                  readOnly
                />
                <p className="text-xs text-slate-500 mt-1">Calculado automaticamente</p>
              </div>
            </div>

            {/* Preview de preços */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 dark:text-white mb-3">
                Resumo de Preços
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Custo</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(watchedCostPrice || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Venda</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(watchedSalePrice || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Lucro</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency((watchedSalePrice || 0) - (watchedCostPrice || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Margem</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {watchedCostPrice && watchedSalePrice && watchedCostPrice > 0
                      ? (((watchedSalePrice - watchedCostPrice) / watchedSalePrice) * 100).toFixed(1)
                      : '0'}
                    %
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Estoque */}
        {activeTab === 'stock' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card space-y-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5" />
              Controle de Estoque
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Estoque Atual</label>
                <input
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  className={cn('input', errors.stock && 'input-error')}
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
                  className={cn('input', errors.minStock && 'input-error')}
                  placeholder="0"
                />
                <p className="text-xs text-slate-500 mt-1">Alerta quando atingir</p>
              </div>

              <div>
                <label className="label">Estoque Máximo</label>
                <input
                  type="number"
                  {...register('maxStock', { valueAsNumber: true })}
                  className="input"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="label">Estoque Reservado</label>
                <input
                  type="number"
                  {...register('reservedStock', { valueAsNumber: true })}
                  className="input bg-slate-100 dark:bg-slate-700"
                  placeholder="0"
                  readOnly
                />
                <p className="text-xs text-slate-500 mt-1">Reservado para pedidos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Local de Armazenamento</label>
                <input
                  {...register('stockLocation')}
                  className="input"
                  placeholder="Ex: Depósito Principal"
                />
              </div>

              <div>
                <label className="label">Localização na Prateleira</label>
                <input
                  {...register('shelfLocation')}
                  className="input"
                  placeholder="Ex: A-01-03"
                />
              </div>
            </div>

            {/* Indicadores de estoque */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 dark:text-white mb-3">
                Status do Estoque
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className={cn(
                  'rounded-lg p-3 text-center',
                  (watch('stock') || 0) <= 0
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : (watch('stock') || 0) <= (watch('minStock') || 0)
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-green-100 dark:bg-green-900/30'
                )}>
                  <p className="text-2xl font-bold">{watch('stock') || 0}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Disponível</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{watch('reservedStock') || 0}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Reservado</p>
                </div>
                <div className="bg-slate-200 dark:bg-slate-600 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">
                    {(watch('stock') || 0) - (watch('reservedStock') || 0)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Livre</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Dimensões */}
        {activeTab === 'dimensions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card space-y-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Dimensões e Peso
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Peso (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  {...register('weight', { valueAsNumber: true })}
                  className="input"
                  placeholder="0.000"
                />
              </div>

              <div>
                <label className="label">Altura (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('height', { valueAsNumber: true })}
                  className="input"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="label">Largura (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('width', { valueAsNumber: true })}
                  className="input"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="label">Comprimento (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('length', { valueAsNumber: true })}
                  className="input"
                  placeholder="0.0"
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                📦 Dica para cálculo de frete
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Preencha corretamente as dimensões para cálculo preciso de frete pelos Correios e transportadoras.
                O peso cúbico é calculado automaticamente: (A × L × C) / 6000
              </p>
              {(() => {
                const height = watch('height');
                const width = watch('width');
                const length = watch('length');
                return height && width && length && height > 0 && width > 0 && length > 0;
              })() && (
                <p className="mt-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                  Peso cúbico: {((watch('height')! * watch('width')! * watch('length')!) / 6000).toFixed(3)} kg
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab: Fiscal */}
        {activeTab === 'fiscal' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card space-y-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dados Fiscais
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">NCM</label>
                <input
                  {...register('ncm')}
                  className="input"
                  placeholder="Ex: 6109.10.00"
                  maxLength={10}
                />
                <p className="text-xs text-slate-500 mt-1">Nomenclatura Comum do Mercosul</p>
              </div>

              <div>
                <label className="label">CEST</label>
                <input
                  {...register('cest')}
                  className="input"
                  placeholder="Ex: 28.038.00"
                  maxLength={9}
                />
                <p className="text-xs text-slate-500 mt-1">Código Especificador da Substituição Tributária</p>
              </div>

              <div>
                <label className="label">CFOP</label>
                <input
                  {...register('cfop')}
                  className="input"
                  placeholder="Ex: 5102"
                  maxLength={4}
                />
                <p className="text-xs text-slate-500 mt-1">Código Fiscal de Operações</p>
              </div>

              <div>
                <label className="label">CST</label>
                <input
                  {...register('cst')}
                  className="input"
                  placeholder="Ex: 00"
                  maxLength={3}
                />
                <p className="text-xs text-slate-500 mt-1">Código da Situação Tributária</p>
              </div>

              <div className="lg:col-span-2">
                <label className="label">Origem da Mercadoria</label>
                <select {...register('origem')} className="input">
                  <option value="">Selecione...</option>
                  {ORIGENS.map((origem) => (
                    <option key={origem.value} value={origem.value}>
                      {origem.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                Alíquotas de Impostos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">ICMS (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('icmsRate', { valueAsNumber: true })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="label">IPI (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('ipiRate', { valueAsNumber: true })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="label">PIS (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('pisRate', { valueAsNumber: true })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="label">COFINS (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('cofinsRate', { valueAsNumber: true })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Variações */}
        {activeTab === 'variations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card space-y-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Variações do Produto
            </h2>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('hasVariations')}
                  className="w-4 h-4 rounded border-slate-300 text-primary-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Este produto possui variações (cor, tamanho, etc.)
                </span>
              </label>
            </div>

            {watchedHasVariations && (
              <div className="space-y-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="label">Atributo 1 (Ex: Cor)</label>
                      <input
                        {...register('variationAttribute1')}
                        className="input"
                        placeholder="Ex: Cor"
                      />
                    </div>
                    <div>
                      <label className="label">Valores (separados por vírgula)</label>
                      <input
                        {...register('variationValues1')}
                        className="input"
                        placeholder="Ex: Vermelho, Azul, Preto, Branco"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Digite os valores separados por vírgula
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="label">Atributo 2 (Ex: Tamanho)</label>
                      <input
                        {...register('variationAttribute2')}
                        className="input"
                        placeholder="Ex: Tamanho"
                      />
                    </div>
                    <div>
                      <label className="label">Valores (separados por vírgula)</label>
                      <input
                        {...register('variationValues2')}
                        className="input"
                        placeholder="Ex: P, M, G, GG"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Digite os valores separados por vírgula
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                    ⚠️ Como funciona
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Após salvar o produto com variações, você poderá gerenciar individualmente cada combinação 
                    (ex: Camiseta Vermelha P, Camiseta Vermelha M, etc.) com preços e estoques específicos.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab: SEO */}
        {activeTab === 'seo' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card space-y-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5" />
              SEO e Marketing
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">URL Amigável (Slug)</label>
                <input
                  {...register('slug')}
                  className="input"
                  placeholder="ex: camiseta-premium-algodao"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Será usado na URL do produto: sualoja.com.br/produto/<strong>{watch('slug') || 'slug-do-produto'}</strong>
                </p>
              </div>

              <div>
                <label className="label">Título para SEO</label>
                <input
                  {...register('seoTitle')}
                  className="input"
                  placeholder="Título que aparecerá nos resultados do Google"
                  maxLength={60}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {(watch('seoTitle')?.length || 0)}/60 caracteres recomendados
                </p>
              </div>

              <div>
                <label className="label">Descrição para SEO</label>
                <textarea
                  {...register('seoDescription')}
                  rows={3}
                  className="input resize-none"
                  placeholder="Descrição que aparecerá nos resultados do Google"
                  maxLength={160}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {(watch('seoDescription')?.length || 0)}/160 caracteres recomendados
                </p>
              </div>

              <div>
                <label className="label">Palavras-chave</label>
                <input
                  {...register('seoKeywords')}
                  className="input"
                  placeholder="palavra1, palavra2, palavra3"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Separe as palavras-chave por vírgula
                </p>
              </div>
            </div>

            {/* Preview do Google */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                Pré-visualização no Google
              </h3>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-w-xl">
                <p className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer">
                  {watch('seoTitle') || watch('name') || 'Título do Produto'}
                </p>
                <p className="text-green-700 dark:text-green-500 text-sm">
                  sualoja.com.br/produto/{watch('slug') || 'slug-do-produto'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  {watch('seoDescription') || watch('shortDescription') || watch('description')?.substring(0, 160) || 'Descrição do produto aparecerá aqui...'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Botão de salvar fixo no mobile */}
        <div className="sticky bottom-4 flex justify-end md:hidden">
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary shadow-lg"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Add Modals */}
      <QuickCategoryModal
        isOpen={showQuickCategoryModal}
        onClose={() => setShowQuickCategoryModal(false)}
        onSuccess={(category) => {
          setValue('categoryId', category.id);
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          setShowQuickCategoryModal(false);
        }}
      />

      <QuickSupplierModal
        isOpen={showQuickSupplierModal}
        onClose={() => setShowQuickSupplierModal(false)}
        onSuccess={(supplier) => {
          setValue('supplierId', supplier.id);
          queryClient.invalidateQueries({ queryKey: ['suppliers-simple'] });
          setShowQuickSupplierModal(false);
        }}
      />
    </div>
  );
}

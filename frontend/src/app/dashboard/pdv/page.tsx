'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Wallet,
  Banknote,
  QrCode,
  X,
  Check,
  Loader2,
  Package,
  Percent,
  Receipt,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi, customersApi, salesApi } from '@/lib/api';
import { showApiError } from '@/lib/error-handler';
import { useCartStore } from '@/store';
import { formatCurrency, debounce } from '@/lib/utils';
import { QuickCustomerModal } from '@/components/modals/QuickCustomerModal';
import { QuickProductModal } from '@/components/modals/QuickProductModal';

const paymentMethods = [
  { id: 'CASH', label: 'Dinheiro', icon: Wallet },
  { id: 'CREDIT_CARD', label: 'Crédito', icon: CreditCard },
  { id: 'DEBIT_CARD', label: 'Débito', icon: CreditCard },
  { id: 'PIX', label: 'PIX', icon: QrCode },
];

export default function PDVPage() {
  const queryClient = useQueryClient();
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const {
    items,
    customerId,
    customerName,
    discount,
    addItem,
    updateQuantity,
    removeItem,
    setCustomer,
    setDiscount,
    clearCart,
    getSubtotal,
    getTotal,
  } = useCartStore();

  // Debounced product search
  const debouncedSetSearch = useCallback(
    debounce((value: string) => setDebouncedSearch(value), 300),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchProduct);
  }, [searchProduct, debouncedSetSearch]);

  // Fetch products
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products-pdv', debouncedSearch],
    queryFn: () =>
      productsApi.getAll({ search: debouncedSearch, limit: 20 }),
  });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers-pdv', searchCustomer],
    queryFn: () =>
      customersApi.getAll({ search: searchCustomer, limit: 10 }),
    enabled: showCustomerModal,
  });

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: (data: any) => salesApi.create(data),
    onSuccess: () => {
      toast.success('Venda finalizada com sucesso!');
      clearCart();
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setReceivedAmount('');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao finalizar venda');
    },
  });

  const handleAddToCart = (product: any) => {
    if (product.stock <= 0) {
      toast.error('Produto sem estoque');
      return;
    }

    const existingItem = items.find((i) => i.productId === product.id);
    if (existingItem && existingItem.quantity >= product.stock) {
      toast.error('Quantidade máxima atingida');
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.salePrice,
      quantity: 1,
      discount: 0,
    });

    toast.success(`${product.name} adicionado`);
  };

  const handleSelectCustomer = (customer: any) => {
    setCustomer(customer.id, customer.name);
    setShowCustomerModal(false);
    setSearchCustomer('');
    toast.success(`Cliente: ${customer.name}`);
  };

  const handleQuickCustomerSuccess = (customer: any) => {
    setCustomer(customer.id, customer.name);
    setShowCustomerModal(false);
    setShowQuickCustomerModal(false);
    setSearchCustomer('');
    queryClient.invalidateQueries({ queryKey: ['customers-pdv'] });
  };

  const handleFinalizeSale = () => {
    if (items.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    if (!selectedPayment) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    const saleData = {
      customerId: customerId || undefined,
      discount: discount,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount,
      })),
      payments: [
        {
          method: selectedPayment,
          amount: getTotal(),
        },
      ],
    };

    createSaleMutation.mutate(saleData);
  };

  const subtotal = getSubtotal();
  const total = getTotal();
  const change = receivedAmount ? parseFloat(receivedAmount) - total : 0;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col lg:flex-row gap-4">
      {/* Products section */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="Buscar produto..."
                className="input pl-9 pr-3 py-2 text-sm"
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowQuickProductModal(true)}
              className="btn-primary flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap"
              title="Cadastrar produto rápido"
            >
              <Plus className="w-4 h-4" />
              Produto
            </button>
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : productsData?.data && productsData.data.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {productsData.data.map((product: any) => (
                <motion.button
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock <= 0}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    product.stock <= 0
                      ? 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 opacity-50 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-primary-500 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg mb-3">
                    <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    SKU: {product.sku}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {formatCurrency(product.salePrice)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      product.stock <= 0
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : product.stock <= 5
                        ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {product.stock} un.
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
              <Package className="w-16 h-16 mb-4 opacity-50" />
              <p>Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart section */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Cart header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="font-semibold text-slate-900 dark:text-white">Carrinho</h2>
              {items.length > 0 && (
                <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full">
                  {items.length}
                </span>
              )}
            </div>
            
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Customer selection */}
          <div
            onClick={() => setShowCustomerModal(true)}
            className="mt-3 w-full flex items-center gap-2 p-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-primary-500 hover:text-primary-600 transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowCustomerModal(true)}
          >
            <User className="w-4 h-4" />
            <span className="text-sm">
              {customerName || 'Selecionar cliente'}
            </span>
            {customerId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomer(null, null);
                }}
                className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">Carrinho vazio</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 bg-slate-200 dark:bg-slate-600 rounded hover:bg-slate-300 dark:hover:bg-slate-500"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 bg-slate-200 dark:bg-slate-600 rounded hover:bg-slate-300 dark:hover:bg-slate-500"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Cart footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Desconto (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="w-20 ml-auto input text-center text-sm py-1"
            />
          </div>

          {/* Totals */}
          <div className="space-y-2 py-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
              <span className="text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Desconto ({discount}%)</span>
                <span className="text-red-500">-{formatCurrency(subtotal * (discount / 100))}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span className="text-slate-900 dark:text-white">Total</span>
              <span className="text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Finalize button */}
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={items.length === 0}
            className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Receipt className="w-5 h-5" />
            Finalizar Venda
          </button>
        </div>
      </div>

      {/* Customer selection modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowCustomerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Selecionar Cliente
                  </h3>
                  <button
                    onClick={() => setShowCustomerModal(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="input pl-10"
                    autoFocus
                  />
                </div>

                {/* Botão de cadastro rápido */}
                <button
                  onClick={() => setShowQuickCustomerModal(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 p-2 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Cadastrar Novo Cliente
                </button>
              </div>
              
              <div className="max-h-64 overflow-y-auto p-4">
                {customersData?.data && customersData.data.length > 0 ? (
                  <div className="space-y-2">
                    {customersData.data.map((customer: any) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full p-3 text-left bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <p className="font-medium text-slate-900 dark:text-white">
                          {customer.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {customer.email || customer.phone}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                    Nenhum cliente encontrado
                  </p>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setCustomer(null, null);
                    setShowCustomerModal(false);
                  }}
                  className="w-full btn-secondary"
                >
                  Continuar sem cliente
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick customer registration modal */}
      <QuickCustomerModal
        isOpen={showQuickCustomerModal}
        onClose={() => setShowQuickCustomerModal(false)}
        onSuccess={handleQuickCustomerSuccess}
      />

      {/* Payment modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Finalizar Venda
                  </h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Total */}
                <div className="text-center py-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total a pagar</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(total)}
                  </p>
                </div>

                {/* Payment methods */}
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Forma de Pagamento
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                          selectedPayment === method.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <method.icon className={`w-5 h-5 ${
                          selectedPayment === method.id
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-slate-500'
                        }`} />
                        <span className={`text-sm font-medium ${
                          selectedPayment === method.id
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {method.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash received (for cash payments) */}
                {selectedPayment === 'CASH' && (
                  <div>
                    <label className="label">Valor Recebido</label>
                    <input
                      type="number"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      className="input"
                      placeholder="0,00"
                    />
                    {change > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        Troco: {formatCurrency(change)}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalizeSale}
                  disabled={!selectedPayment || createSaleMutation.isPending}
                  className="flex-1 btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createSaleMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Product Modal */}
      <QuickProductModal
        isOpen={showQuickProductModal}
        onClose={() => setShowQuickProductModal(false)}
        onSuccess={(product) => {
          queryClient.invalidateQueries({ queryKey: ['products-pdv'] });
          handleAddToCart(product);
        }}
      />
    </div>
  );
}

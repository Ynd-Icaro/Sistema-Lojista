'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Printer,
  Calendar,
  User,
  CreditCard,
  Package,
  DollarSign,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useRef } from 'react';

interface SaleDetailModalProps {
  sale: any;
  isOpen: boolean;
  onClose: () => void;
}

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
  BANK_TRANSFER: 'Transferência',
  STORE_CREDIT: 'Crédito da Loja',
};

const statusLabels: Record<string, string> = {
  COMPLETED: 'Concluída',
  PENDING: 'Pendente',
  CANCELLED: 'Cancelada',
};

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  PENDING: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  CANCELLED: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="w-5 h-5 text-success-500" />;
    case 'CANCELLED':
      return <XCircle className="w-5 h-5 text-danger-500" />;
    default:
      return <Clock className="w-5 h-5 text-warning-500" />;
  }
};

export function SaleDetailModal({ sale, isOpen, onClose }: SaleDetailModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    // Create print styles
    const printStyles = `
      <style>
        @media print {
          body { 
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #000;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .print-section {
            margin-bottom: 15px;
          }
          .print-section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
          }
          .print-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .print-item {
            margin-bottom: 5px;
          }
          .print-label {
            font-size: 11px;
            color: #666;
          }
          .print-value {
            font-size: 12px;
            font-weight: 500;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .print-table th, .print-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 11px;
          }
          .print-table th {
            background-color: #f5f5f5;
          }
          .print-total {
            text-align: right;
            font-size: 16px;
            font-weight: bold;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #000;
          }
          .no-print { display: none !important; }
        }
      </style>
    `;

    document.body.innerHTML = printStyles + printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  if (!sale) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Venda #{sale.saleNumber || sale.id?.slice(0, 8)}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[sale.status] || statusColors.PENDING}`}>
                      {statusLabels[sale.status] || sale.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime(sale.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="btn-secondary"
                  title="Imprimir"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={printRef}>
              {/* Print Header (hidden in normal view) */}
              <div className="hidden print:block print-header">
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>COMPROVANTE DE VENDA</h1>
                <p style={{ fontSize: '14px' }}>Venda #{sale.saleNumber || sale.id?.slice(0, 8)}</p>
                <p style={{ fontSize: '12px' }}>{formatDateTime(sale.createdAt)}</p>
              </div>

              {/* Customer Info */}
              <div className="print-section">
                <div className="flex items-center gap-2 mb-3 print:hidden">
                  <User className="w-5 h-5 text-slate-400" />
                  <h4 className="font-semibold text-slate-900 dark:text-white">Cliente</h4>
                </div>
                <div className="print:block hidden print-section-title">Cliente</div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 print:bg-transparent print:p-0">
                  <div className="grid grid-cols-2 gap-4 print-grid">
                    <div className="print-item">
                      <p className="text-xs text-slate-500 dark:text-slate-400 print-label">Nome</p>
                      <p className="font-medium text-slate-900 dark:text-white print-value">
                        {sale.customer?.name || 'Cliente Avulso'}
                      </p>
                    </div>
                    {sale.customer?.email && (
                      <div className="print-item">
                        <p className="text-xs text-slate-500 dark:text-slate-400 print-label">Email</p>
                        <p className="font-medium text-slate-900 dark:text-white print-value">
                          {sale.customer.email}
                        </p>
                      </div>
                    )}
                    {sale.customer?.phone && (
                      <div className="print-item">
                        <p className="text-xs text-slate-500 dark:text-slate-400 print-label">Telefone</p>
                        <p className="font-medium text-slate-900 dark:text-white print-value">
                          {sale.customer.phone}
                        </p>
                      </div>
                    )}
                    {sale.customer?.cpfCnpj && (
                      <div className="print-item">
                        <p className="text-xs text-slate-500 dark:text-slate-400 print-label">CPF/CNPJ</p>
                        <p className="font-medium text-slate-900 dark:text-white print-value">
                          {sale.customer.cpfCnpj}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="print-section">
                <div className="flex items-center gap-2 mb-3 print:hidden">
                  <Package className="w-5 h-5 text-slate-400" />
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    Itens ({sale.items?.length || 0})
                  </h4>
                </div>
                <div className="print:block hidden print-section-title">Itens</div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden print:bg-transparent">
                  <table className="w-full print-table">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400">Produto</th>
                        <th className="text-center px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400">Qtd</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400">Unit.</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {sale.items?.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                            {item.product?.name || item.productName || 'Produto'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                            {formatCurrency(item.unitPrice || item.price)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-slate-900 dark:text-white">
                            {formatCurrency((item.unitPrice || item.price) * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Info */}
              <div className="print-section">
                <div className="flex items-center gap-2 mb-3 print:hidden">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <h4 className="font-semibold text-slate-900 dark:text-white">Pagamento</h4>
                </div>
                <div className="print:block hidden print-section-title">Pagamento</div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 print:bg-transparent print:p-0">
                  <div className="space-y-2">
                    {sale.payments?.map((payment: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {paymentMethodLabels[payment.method] || payment.method}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))}
                    {(!sale.payments || sale.payments.length === 0) && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Nenhum pagamento registrado
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 print-total">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                    <span className="text-slate-900 dark:text-white">{formatCurrency(sale.subtotal || sale.total)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Desconto</span>
                      <span className="text-danger-600 dark:text-danger-400">-{formatCurrency(sale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-900 dark:text-white">Total</span>
                    <span className="text-success-600 dark:text-success-400">{formatCurrency(sale.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {sale.notes && (
                <div className="print-section">
                  <div className="flex items-center gap-2 mb-3 print:hidden">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <h4 className="font-semibold text-slate-900 dark:text-white">Observações</h4>
                  </div>
                  <div className="print:block hidden print-section-title">Observações</div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 print:bg-transparent print:p-0">
                    {sale.notes}
                  </p>
                </div>
              )}

              {/* Seller Info */}
              {sale.user && (
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                  Vendedor: {sale.user.name}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

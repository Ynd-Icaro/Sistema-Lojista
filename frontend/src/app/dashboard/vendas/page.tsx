'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  Eye,
  Printer,
  Loader2,
  ShoppingCart,
  CreditCard,
} from 'lucide-react';
import { salesApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils';
import { ViewToggle, useViewMode } from '@/components/ui/ViewToggle';
import { SaleDetailModal } from '@/components/modals/SaleDetailModal';

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Crédito',
  DEBIT_CARD: 'Débito',
  PIX: 'PIX',
  BANK_TRANSFER: 'Transf.',
};

const statusLabels: Record<string, string> = {
  COMPLETED: 'Concluída',
  PENDING: 'Pendente',
  CANCELLED: 'Cancelada',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-700 dark:text-success-400' },
  PENDING: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-400' },
  CANCELLED: { bg: 'bg-danger-100 dark:bg-danger-900/30', text: 'text-danger-700 dark:text-danger-400' },
};

export default function VendasPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { view, setView } = useViewMode('vendas', 'list');

  // Fetch sales
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', page, statusFilter, startDate, endDate],
    queryFn: () =>
      salesApi.getAll({
        page,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }).then((res) => res.data),
  });

  // Calculate totals
  const totalRevenue = salesData?.data?.reduce(
    (sum: number, sale: any) => sale.status === 'COMPLETED' ? sum + Number(sale.total) : sum,
    0
  ) || 0;

  const handleViewDetails = (sale: any) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const handleQuickPrint = (sale: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const items = sale.items?.map((item: any) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.product?.name || item.productName || 'Produto'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.unitPrice || item.price)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency((item.unitPrice || item.price) * item.quantity)}</td>
      </tr>
    `).join('') || '<tr><td colspan="4" style="text-align: center; padding: 20px;">Sem itens</td></tr>';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Venda #${sale.saleNumber || sale.id?.slice(0, 8)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .info-item label { font-size: 11px; color: #666; display: block; }
          .info-item span { font-size: 13px; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f5f5f5; border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
          .total-section { text-align: right; margin-top: 20px; padding-top: 15px; border-top: 2px solid #000; }
          .total-row { display: flex; justify-content: flex-end; gap: 20px; margin: 5px 0; }
          .total-row.final { font-size: 18px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
          .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
          .status-COMPLETED { background: #dcfce7; color: #166534; }
          .status-PENDING { background: #fef3c7; color: #92400e; }
          .status-CANCELLED { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>COMPROVANTE DE VENDA</h1>
          <p>Nº ${sale.saleNumber || sale.id?.slice(0, 8)}</p>
          <p>${formatDateTime(sale.createdAt)}</p>
          <span class="status status-${sale.status}">${statusLabels[sale.status] || sale.status}</span>
        </div>

        <div class="section">
          <div class="section-title">Cliente</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Nome</label>
              <span>${sale.customer?.name || 'Cliente Avulso'}</span>
            </div>
            ${sale.customer?.phone ? `<div class="info-item"><label>Telefone</label><span>${sale.customer.phone}</span></div>` : ''}
            ${sale.customer?.email ? `<div class="info-item"><label>Email</label><span>${sale.customer.email}</span></div>` : ''}
            ${sale.customer?.cpfCnpj ? `<div class="info-item"><label>CPF/CNPJ</label><span>${sale.customer.cpfCnpj}</span></div>` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Itens</div>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th style="text-align: center;">Qtd</th>
                <th style="text-align: right;">Unit.</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Pagamento</div>
          ${sale.payments?.map((p: any) => `
            <div class="info-grid">
              <div class="info-item">
                <label>Método</label>
                <span>${paymentMethodLabels[p.method] || p.method}</span>
              </div>
              <div class="info-item">
                <label>Valor</label>
                <span>${formatCurrency(p.amount)}</span>
              </div>
            </div>
          `).join('') || '<p style="color: #666;">Nenhum pagamento registrado</p>'}
        </div>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(sale.subtotal || sale.total)}</span>
          </div>
          ${sale.discount > 0 ? `<div class="total-row"><span>Desconto:</span><span style="color: #dc2626;">-${formatCurrency(sale.discount)}</span></div>` : ''}
          <div class="total-row final">
            <span>TOTAL:</span>
            <span style="color: #16a34a;">${formatCurrency(sale.total)}</span>
          </div>
        </div>

        ${sale.notes ? `<div class="section"><div class="section-title">Observações</div><p>${sale.notes}</p></div>` : ''}

        <div class="footer">
          ${sale.user ? `<p>Vendedor: ${sale.user.name}</p>` : ''}
          <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vendas</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Histórico de vendas realizadas
          </p>
        </div>
        <ViewToggle 
          storageKey="vendas" 
          defaultView="list" 
          onViewChange={setView}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <p className="text-sm text-success-100">Total de Vendas</p>
          <p className="text-2xl font-bold">{salesData?.meta?.total || 0}</p>
        </div>
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <p className="text-sm text-primary-100">Receita Total</p>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card bg-gradient-to-br from-secondary-500 to-secondary-600 text-white">
          <p className="text-sm text-secondary-100">Ticket Médio</p>
          <p className="text-2xl font-bold">
            {formatCurrency(salesData?.meta?.total > 0 ? totalRevenue / salesData.meta.total : 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar vendas..."
              className="input pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">Todos os status</option>
            <option value="COMPLETED">Concluída</option>
            <option value="PENDING">Pendente</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
          
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
            placeholder="Data inicial"
          />
          
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
            placeholder="Data final"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Card View */}
      {!isLoading && view === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salesData?.data && salesData.data.length > 0 ? (
            salesData.data.map((sale: any) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                      #{sale.saleNumber || sale.id?.slice(0, 8)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatDateTime(sale.createdAt)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[sale.status]?.bg} ${statusColors[sale.status]?.text}`}>
                    {statusLabels[sale.status] || sale.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold">
                    {sale.customer?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {sale.customer?.name || 'Cliente Avulso'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {sale._count?.items || sale.items?.length || 0} itens
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <CreditCard className="w-3.5 h-3.5" />
                    {paymentMethodLabels[sale.payments?.[0]?.method] || '-'}
                  </div>
                  <p className="text-lg font-bold text-success-600 dark:text-success-400">
                    {formatCurrency(sale.total)}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    onClick={() => handleViewDetails(sale)}
                    className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                    title="Ver detalhes"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleQuickPrint(sale)}
                    className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                    title="Imprimir"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full card text-center py-12">
              <ShoppingCart className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Nenhuma venda encontrada
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                As vendas realizadas no PDV aparecerão aqui
              </p>
            </div>
          )}
        </div>
      )}

      {/* List/Table View */}
      {!isLoading && view === 'list' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Itens</th>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {salesData?.data && salesData.data.length > 0 ? (
                  salesData.data.map((sale: any) => (
                    <tr key={sale.id} className="table-row">
                      <td className="table-cell">
                        <span className="font-mono text-sm font-medium">
                          #{sale.saleNumber || sale.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold">
                            {sale.customer?.name?.charAt(0) || 'A'}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {sale.customer?.name || 'Cliente Avulso'}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-info">
                          {sale._count?.items || sale.items?.length || 0} itens
                        </span>
                      </td>
                      <td className="table-cell">
                        {paymentMethodLabels[sale.payments?.[0]?.method] || '-'}
                      </td>
                      <td className="table-cell">
                        <span className="font-semibold text-success-600 dark:text-success-400">
                          {formatCurrency(sale.total)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge badge-${getStatusColor(sale.status)}`}>
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{formatDateTime(sale.createdAt)}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewDetails(sale)}
                            className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleQuickPrint(sale)}
                            className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                            title="Imprimir"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">Nenhuma venda encontrada</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {salesData?.meta && salesData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Página {salesData.meta.page} de {salesData.meta.totalPages}
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
                  disabled={page >= salesData.meta.totalPages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination for card view */}
      {!isLoading && view === 'card' && salesData?.meta && salesData.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="btn-secondary disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Página {salesData.meta.page} de {salesData.meta.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= salesData.meta.totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Próximo
          </button>
        </div>
      )}

      {/* Sale Detail Modal */}
      <SaleDetailModal
        sale={selectedSale}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSale(null);
        }}
      />
    </div>
  );
}

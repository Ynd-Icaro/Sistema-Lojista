'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Wrench,
  Receipt,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Eye,
  ChevronRight,
  PieChart,
  Activity,
  Loader2,
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdvancedFilters, FilterField } from '@/components/ui/AdvancedFilters';
import { reportsApi } from '@/lib/api';

// Tipos de relatório disponíveis
const reportTypes = [
  {
    id: 'sales',
    name: 'Vendas',
    description: 'Relatório detalhado de vendas por período',
    icon: ShoppingCart,
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  },
  {
    id: 'products',
    name: 'Produtos',
    description: 'Análise de produtos mais vendidos e estoque',
    icon: Package,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  },
  {
    id: 'customers',
    name: 'Clientes',
    description: 'Relatório de clientes e comportamento de compra',
    icon: Users,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  },
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Fluxo de caixa, receitas e despesas',
    icon: DollarSign,
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
  },
  {
    id: 'serviceOrders',
    name: 'Ordens de Serviço',
    description: 'Análise de ordens de serviço e técnicos',
    icon: Wrench,
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
  },
  {
    id: 'invoices',
    name: 'Notas Fiscais',
    description: 'Relatório de notas emitidas e canceladas',
    icon: Receipt,
    color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600',
  },
];

// Filtros por tipo de relatório
const filtersByReportType: Record<string, FilterField[]> = {
  sales: [
    { id: 'period', label: 'Período', type: 'daterange' },
    { id: 'status', label: 'Status', type: 'select', options: [
      { value: 'COMPLETED', label: 'Concluída' },
      { value: 'PENDING', label: 'Pendente' },
      { value: 'CANCELLED', label: 'Cancelada' },
    ]},
    { id: 'paymentMethod', label: 'Forma de Pagamento', type: 'multiselect', options: [
      { value: 'CASH', label: 'Dinheiro' },
      { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
      { value: 'DEBIT_CARD', label: 'Cartão de Débito' },
      { value: 'PIX', label: 'PIX' },
      { value: 'BANK_TRANSFER', label: 'Transferência' },
    ]},
    { id: 'customer', label: 'Cliente', type: 'text' },
    { id: 'total', label: 'Valor', type: 'numberrange' },
    { id: 'groupBy', label: 'Agrupar por', type: 'select', options: [
      { value: 'day', label: 'Dia' },
      { value: 'week', label: 'Semana' },
      { value: 'month', label: 'Mês' },
      { value: 'customer', label: 'Cliente' },
      { value: 'paymentMethod', label: 'Forma de Pagamento' },
    ]},
  ],
  products: [
    { id: 'period', label: 'Período', type: 'daterange' },
    { id: 'category', label: 'Categoria', type: 'text' },
    { id: 'stockStatus', label: 'Status de Estoque', type: 'select', options: [
      { value: 'low', label: 'Estoque Baixo' },
      { value: 'out', label: 'Sem Estoque' },
      { value: 'normal', label: 'Estoque Normal' },
      { value: 'high', label: 'Estoque Alto' },
    ]},
    { id: 'sortBy', label: 'Ordenar por', type: 'select', options: [
      { value: 'sales', label: 'Mais Vendidos' },
      { value: 'revenue', label: 'Maior Faturamento' },
      { value: 'stock', label: 'Quantidade em Estoque' },
      { value: 'name', label: 'Nome' },
    ]},
    { id: 'showInactive', label: 'Incluir Inativos', type: 'boolean' },
  ],
  customers: [
    { id: 'period', label: 'Período', type: 'daterange' },
    { id: 'search', label: 'Buscar', type: 'text', placeholder: 'Nome, email ou telefone...' },
    { id: 'hasOrders', label: 'Com pedidos', type: 'boolean', placeholder: 'Apenas clientes com pedidos' },
    { id: 'totalSpent', label: 'Total Gasto', type: 'numberrange' },
    { id: 'sortBy', label: 'Ordenar por', type: 'select', options: [
      { value: 'totalSpent', label: 'Maior Gasto' },
      { value: 'orderCount', label: 'Mais Pedidos' },
      { value: 'lastOrder', label: 'Última Compra' },
      { value: 'name', label: 'Nome' },
    ]},
  ],
  financial: [
    { id: 'period', label: 'Período', type: 'daterange' },
    { id: 'type', label: 'Tipo', type: 'select', options: [
      { value: 'INCOME', label: 'Receitas' },
      { value: 'EXPENSE', label: 'Despesas' },
    ]},
    { id: 'status', label: 'Status', type: 'select', options: [
      { value: 'PAID', label: 'Pago' },
      { value: 'PENDING', label: 'Pendente' },
      { value: 'OVERDUE', label: 'Vencido' },
    ]},
    { id: 'category', label: 'Categoria', type: 'text' },
    { id: 'groupBy', label: 'Agrupar por', type: 'select', options: [
      { value: 'day', label: 'Dia' },
      { value: 'week', label: 'Semana' },
      { value: 'month', label: 'Mês' },
      { value: 'category', label: 'Categoria' },
      { value: 'type', label: 'Tipo' },
    ]},
  ],
  serviceOrders: [
    { id: 'period', label: 'Período', type: 'daterange' },
    { id: 'status', label: 'Status', type: 'multiselect', options: [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'IN_PROGRESS', label: 'Em Andamento' },
      { value: 'WAITING_PARTS', label: 'Aguardando Peças' },
      { value: 'COMPLETED', label: 'Concluída' },
      { value: 'DELIVERED', label: 'Entregue' },
      { value: 'CANCELLED', label: 'Cancelada' },
    ]},
    { id: 'priority', label: 'Prioridade', type: 'select', options: [
      { value: 'LOW', label: 'Baixa' },
      { value: 'NORMAL', label: 'Normal' },
      { value: 'HIGH', label: 'Alta' },
      { value: 'URGENT', label: 'Urgente' },
    ]},
    { id: 'technician', label: 'Técnico', type: 'text' },
    { id: 'groupBy', label: 'Agrupar por', type: 'select', options: [
      { value: 'status', label: 'Status' },
      { value: 'technician', label: 'Técnico' },
      { value: 'priority', label: 'Prioridade' },
      { value: 'month', label: 'Mês' },
    ]},
  ],
  invoices: [
    { id: 'period', label: 'Período', type: 'daterange' },
    { id: 'type', label: 'Tipo', type: 'multiselect', options: [
      { value: 'SALE', label: 'Nota Fiscal' },
      { value: 'SERVICE', label: 'Nota de Serviço' },
      { value: 'WARRANTY', label: 'Garantia' },
    ]},
    { id: 'status', label: 'Status', type: 'select', options: [
      { value: 'DRAFT', label: 'Rascunho' },
      { value: 'ISSUED', label: 'Emitida' },
      { value: 'SENT', label: 'Enviada' },
      { value: 'CANCELLED', label: 'Cancelada' },
    ]},
    { id: 'total', label: 'Valor', type: 'numberrange' },
  ],
};

export default function RelatoriosPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({
    periodStart: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    periodEnd: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [showReport, setShowReport] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Query para carregar dados do relatório
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['report', selectedReport, filters],
    queryFn: () => reportsApi.generate(selectedReport!, filters),
    enabled: showReport && !!selectedReport,
  });

  // Campos de filtro para o relatório selecionado
  const currentFilters = useMemo(() => {
    if (!selectedReport) return [];
    return filtersByReportType[selectedReport] || [];
  }, [selectedReport]);

  const handleGenerateReport = () => {
    setShowReport(true);
    refetch();
  };

  const handleExportPDF = async () => {
    if (!selectedReport) return;
    try {
      const response = await reportsApi.exportPdf(selectedReport, filters);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${selectedReport}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedReport) return;
    try {
      const response = await reportsApi.exportExcel(selectedReport, filters);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${selectedReport}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'sales':
        return <SalesReport data={reportData} formatCurrency={formatCurrency} />;
      case 'products':
        return <ProductsReport data={reportData} formatCurrency={formatCurrency} />;
      case 'customers':
        return <CustomersReport data={reportData} formatCurrency={formatCurrency} />;
      case 'financial':
        return <FinancialReport data={reportData} formatCurrency={formatCurrency} />;
      case 'serviceOrders':
        return <ServiceOrdersReport data={reportData} formatCurrency={formatCurrency} />;
      case 'invoices':
        return <InvoicesReport data={reportData} formatCurrency={formatCurrency} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] print:min-h-0">
      {/* Layout com sidebar + conteúdo principal */}
      <div className="flex gap-6 h-full">
        {/* Sidebar de Relatórios */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 64 : 280 }}
          className={`
            flex-shrink-0 print:hidden
            bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800
            overflow-hidden transition-all duration-300
          `}
        >
          {/* Header da Sidebar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            {!sidebarCollapsed && (
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                Relatórios
              </h2>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            </button>
          </div>

          {/* Lista de Relatórios */}
          <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-16rem)]">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              const isSelected = selectedReport === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => {
                    setSelectedReport(report.id);
                    setShowReport(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all
                    ${isSelected 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }
                  `}
                  title={report.name}
                >
                  <div className={`p-2 rounded-lg ${report.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{report.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {report.description}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.aside>

        {/* Área Principal */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Header com ações */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedReport 
                  ? reportTypes.find(r => r.id === selectedReport)?.name || 'Relatório'
                  : 'Selecione um Relatório'
                }
              </h1>
              {selectedReport && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {reportTypes.find(r => r.id === selectedReport)?.description}
                </p>
              )}
            </div>
            {selectedReport && showReport && (
              <div className="flex items-center gap-2">
                <button onClick={handleExportPDF} className="btn-secondary text-sm">
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
                <button onClick={handleExportExcel} className="btn-secondary text-sm">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
                <button onClick={handlePrint} className="btn-secondary text-sm">
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
              </div>
            )}
          </div>

          {/* Conteúdo */}
          {!selectedReport ? (
            /* Tela inicial - Seleção de relatório */
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Central de Relatórios
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Selecione um tipo de relatório na barra lateral para começar a gerar análises detalhadas do seu negócio.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {reportTypes.slice(0, 6).map((report) => {
                  const Icon = report.icon;
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center group"
                    >
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${report.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{report.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : !showReport ? (
            /* Filtros do relatório */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Filtros do Relatório</h3>
                </div>
              </div>
              <div className="p-4">
                <AdvancedFilters
                  fields={currentFilters}
                  values={filters}
                  onChange={setFilters}
                  onApply={handleGenerateReport}
                  onReset={() => {
                    setFilters({
                      periodStart: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                      periodEnd: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
                    });
                  }}
                  collapsible={false}
                />
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="btn-primary"
                >
                  <BarChart3 className="w-4 h-4" />
                  Gerar Relatório
                </button>
              </div>
            </motion.div>
          ) : (
            /* Conteúdo do relatório */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Botão voltar */}
              <button
                onClick={() => setShowReport(false)}
                className="btn-secondary text-sm print:hidden"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Voltar aos Filtros
              </button>

              {/* Report Header (for print) */}
              <div className="hidden print:block text-center mb-8">
                <h1 className="text-2xl font-bold">SmartFlux ERP</h1>
                <h2 className="text-xl mt-2">
                  Relatório de {reportTypes.find(r => r.id === selectedReport)?.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Período: {filters.periodStart ? format(parseISO(filters.periodStart), 'dd/MM/yyyy', { locale: ptBR }) : '-'} 
                  {' a '}
                  {filters.periodEnd ? format(parseISO(filters.periodEnd), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                  <span className="ml-3 text-slate-600 dark:text-slate-400">Gerando relatório...</span>
                </div>
              )}

              {/* Report Data */}
              {!isLoading && reportData && renderReportContent()}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de Relatório de Vendas
function SalesReport({ data, formatCurrency }: { data: any; formatCurrency: (v: number) => string }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total em Vendas</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(data.summary?.totalSales || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          {data.summary?.salesGrowth !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              data.summary.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.summary.salesGrowth >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {Math.abs(data.summary.salesGrowth).toFixed(1)}% vs período anterior
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Nº de Vendas</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {data.summary?.totalOrders || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ticket Médio</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(data.summary?.averageTicket || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Itens Vendidos</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {data.summary?.totalItems || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Detalhamento</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Código
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Data
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Cliente
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Pagamento
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    #{item.code}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {format(parseISO(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.customer?.name || 'Consumidor Final'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.paymentMethod}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      item.status === 'COMPLETED' ? 'badge-success' :
                      item.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-900 font-semibold">
              <tr>
                <td colSpan={5} className="py-3 px-4 text-right text-slate-900 dark:text-white">
                  Total:
                </td>
                <td className="py-3 px-4 text-right text-slate-900 dark:text-white">
                  {formatCurrency(data.summary?.totalSales || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componente de Relatório de Produtos
function ProductsReport({ data, formatCurrency }: { data: any; formatCurrency: (v: number) => string }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total de Produtos</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data.summary?.totalProducts || 0}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Valor em Estoque</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(data.summary?.stockValue || 0)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Estoque Baixo</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {data.summary?.lowStockCount || 0}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Sem Estoque</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {data.summary?.outOfStockCount || 0}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Produtos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Produto
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Categoria
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Estoque
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Vendidos
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Preço
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Faturamento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.category?.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      item.stock <= 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      item.stock <= item.minStock ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                    {item.soldQuantity || 0}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(item.revenue || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componente de Relatório de Clientes
function CustomersReport({ data, formatCurrency }: { data: any; formatCurrency: (v: number) => string }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total de Clientes</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data.summary?.totalCustomers || 0}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Clientes Ativos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {data.summary?.activeCustomers || 0}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Receita Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(data.summary?.totalRevenue || 0)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Cliente
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Contato
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Pedidos
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Gasto
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Última Compra
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.cpfCnpj || '-'}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    <p>{item.email || '-'}</p>
                    <p className="text-xs">{item.phone || '-'}</p>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                    {item.orderCount || 0}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(item.totalSpent || 0)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.lastOrderDate ? format(parseISO(item.lastOrderDate), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componente de Relatório Financeiro
function FinancialReport({ data, formatCurrency }: { data: any; formatCurrency: (v: number) => string }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Receitas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(data.summary?.totalIncome || 0)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Despesas</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {formatCurrency(data.summary?.totalExpenses || 0)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
          <p className={`text-2xl font-bold mt-1 ${
            (data.summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(data.summary?.balance || 0)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Pendentes</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {formatCurrency(data.summary?.pendingAmount || 0)}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Movimentações</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Data
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Descrição
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Categoria
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {format(parseISO(item.date || item.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="py-3 px-4 text-slate-900 dark:text-white">
                    {item.description}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.category || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      item.status === 'PAID' ? 'badge-success' :
                      item.status === 'OVERDUE' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${
                    item.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componente de Relatório de Ordens de Serviço
function ServiceOrdersReport({ data, formatCurrency }: { data: any; formatCurrency: (v: number) => string }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total de OS</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data.summary?.total || 0}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Concluídas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {data.summary?.completed || 0}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Em Andamento</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {data.summary?.inProgress || 0}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Faturamento</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(data.summary?.revenue || 0)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Código
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Cliente
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Título
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Prioridade
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    #{item.code}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.customer?.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.title}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      item.status === 'COMPLETED' || item.status === 'DELIVERED' ? 'badge-success' :
                      item.status === 'CANCELLED' ? 'badge-danger' :
                      item.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-warning'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      item.priority === 'URGENT' ? 'badge-danger' :
                      item.priority === 'HIGH' ? 'badge-warning' :
                      item.priority === 'LOW' ? 'badge-gray' : 'badge-primary'
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componente de Relatório de Notas Fiscais
function InvoicesReport({ data, formatCurrency }: { data: any; formatCurrency: (v: number) => string }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total de Notas</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data.summary?.total || 0}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Emitidas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {data.summary?.issued || 0}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Canceladas</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {data.summary?.cancelled || 0}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Valor Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(data.summary?.totalValue || 0)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Número
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Tipo
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Cliente
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Data
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    {item.number}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      item.type === 'SALE' ? 'badge-success' :
                      item.type === 'SERVICE' ? 'badge-primary' : 'badge-warning'
                    }`}>
                      {item.type === 'SALE' ? 'Nota Fiscal' : 
                       item.type === 'SERVICE' ? 'Serviço' : 'Garantia'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.customer?.name || item.recipientName || 'Consumidor Final'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {format(parseISO(item.issueDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      item.status === 'ISSUED' || item.status === 'SENT' ? 'badge-success' :
                      item.status === 'CANCELLED' ? 'badge-danger' : 'badge-gray'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

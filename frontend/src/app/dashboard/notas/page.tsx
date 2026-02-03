'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Download,
  Mail,
  MessageCircle,
  Trash2,
  X,
  Loader2,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Receipt,
  Printer,
  Send,
  Wrench,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invoicesApi, salesApi, serviceOrdersApi } from '@/lib/api';
import { showApiError } from '@/lib/error-handler';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ViewToggle, useViewMode } from '@/components/ui/ViewToggle';

const statusColors: Record<string, string> = {
  DRAFT: 'badge-gray',
  ISSUED: 'badge-success',
  SENT: 'badge-primary',
  CANCELLED: 'badge-danger',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  ISSUED: 'Emitida',
  SENT: 'Enviada',
  CANCELLED: 'Cancelada',
};

// Corrigido para usar os tipos corretos do backend
const typeLabels: Record<string, string> = {
  SALE: 'Nota Fiscal',
  SERVICE: 'Ordem de Serviço',
  WARRANTY: 'Garantia',
};

const typeColors: Record<string, { bg: string; text: string }> = {
  SALE: { bg: 'bg-green-100 dark:bg-success-900/30', text: 'text-success-600' },
  SERVICE: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600' },
  WARRANTY: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600' },
};

export default function NotasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [sourceType, setSourceType] = useState<'sale' | 'serviceOrder'>('sale');
  const [invoiceType, setInvoiceType] = useState<string>('SALE');
  const [warrantyDays, setWarrantyDays] = useState<number>(90);
  const [notes, setNotes] = useState<string>('');
  const [page, setPage] = useState(1);
  const { view, setView } = useViewMode('notas', 'list');

  // Fetch invoices
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', search, typeFilter, statusFilter, page],
    queryFn: () =>
      invoicesApi
        .getAll({ search, type: typeFilter, status: statusFilter, page, limit: 10 })
        .then((res) => res.data),
  });

  // Fetch recent sales for generating invoices
  const { data: salesData } = useQuery({
    queryKey: ['recent-sales-for-invoice'],
    queryFn: () => salesApi.getAll({ limit: 50, status: 'COMPLETED' }).then((res) => res.data),
  });

  // Fetch service orders for generating invoices
  const { data: serviceOrdersData } = useQuery({
    queryKey: ['recent-service-orders-for-invoice'],
    queryFn: () => serviceOrdersApi.getAll({ limit: 50, status: 'COMPLETED' }).then((res) => res.data),
  });

  // Generate invoice mutation
  const generateMutation = useMutation({
    mutationFn: (data: { saleId?: string; serviceOrderId?: string; type: string; warrantyDays?: number; notes?: string }) => 
      invoicesApi.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Documento gerado com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao gerar documento');
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.sendEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('E-mail enviado com sucesso!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao enviar e-mail');
    },
  });

  // Send WhatsApp mutation
  const sendWhatsAppMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.sendWhatsApp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('WhatsApp enviado com sucesso!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao enviar WhatsApp');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => invoicesApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Documento cancelado!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao cancelar documento');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Documento excluído!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao excluir documento');
    },
  });

  const openModal = () => {
    setSelectedSource('');
    setSourceType('sale');
    setInvoiceType('SALE');
    setWarrantyDays(90);
    setNotes('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSource('');
    setSourceType('sale');
    setInvoiceType('SALE');
    setWarrantyDays(90);
    setNotes('');
  };

  const openPreview = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowPreviewModal(true);
  };

  const closePreview = () => {
    setShowPreviewModal(false);
    setSelectedInvoice(null);
  };

  const handleGenerate = () => {
    if (!selectedSource) {
      toast.error(sourceType === 'sale' ? 'Selecione uma venda' : 'Selecione uma ordem de serviço');
      return;
    }
    
    const data: any = {
      type: invoiceType,
      notes: notes || undefined,
    };

    if (sourceType === 'sale') {
      data.saleId = selectedSource;
    } else {
      data.serviceOrderId = selectedSource;
    }

    if (invoiceType === 'WARRANTY' && warrantyDays > 0) {
      data.warrantyDays = warrantyDays;
    }

    generateMutation.mutate(data);
  };

  const handleCancel = (id: string) => {
    const reason = prompt('Informe o motivo do cancelamento:');
    if (reason) {
      cancelMutation.mutate({ id, reason });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownload = async (invoice: any) => {
    try {
      const response = await invoicesApi.download(invoice.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nota-${invoice.number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao baixar documento');
    }
  };

  const handlePrint = (invoice: any) => {
    // Open print view in new window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Nota ${invoice.number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #333; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #6366f1; }
            .header h1 { color: #6366f1; margin-bottom: 5px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 600; }
            .badge-success { background: #22c55e; color: white; }
            .badge-danger { background: #ef4444; color: white; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: 600; color: #6366f1; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f3f4f6; padding: 8px; text-align: left; font-size: 10px; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
            .text-right { text-align: right; }
            .total-row { font-size: 16px; font-weight: 700; color: #6366f1; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #6b7280; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SmartFlux ERP</h1>
            <p>${typeLabels[invoice.type] || 'Documento'}</p>
            <p style="margin-top: 10px;">
              <span class="badge ${invoice.status === 'CANCELLED' ? 'badge-danger' : 'badge-success'}">
                ${statusLabels[invoice.status] || invoice.status}
              </span>
            </p>
          </div>
          
          <div class="section">
            <div class="grid">
              <div>
                <p class="info-label">Número</p>
                <p style="font-size: 18px; font-weight: 700; color: #6366f1;">${invoice.number}</p>
              </div>
              <div style="text-align: right;">
                <p class="info-label">Data de Emissão</p>
                <p>${format(new Date(invoice.issuedAt || invoice.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Cliente</h3>
            <p><strong>${invoice.customer?.name || invoice.sale?.customer?.name || 'Consumidor Final'}</strong></p>
            ${invoice.customer?.cpfCnpj ? `<p>CPF/CNPJ: ${invoice.customer.cpfCnpj}</p>` : ''}
            ${invoice.customer?.email ? `<p>E-mail: ${invoice.customer.email}</p>` : ''}
            ${invoice.customer?.phone ? `<p>Telefone: ${invoice.customer.phone}</p>` : ''}
          </div>

          <div class="section">
            <h3 class="section-title">Itens</h3>
            <table>
              <thead>
                <tr>
                  <th>Produto/Serviço</th>
                  <th class="text-right">Qtd</th>
                  <th class="text-right">Valor Unit.</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.sale?.items || []).map((item: any) => `
                  <tr>
                    <td>${item.product?.name || item.description}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}</td>
                    <td class="text-right">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section" style="text-align: right;">
            <p class="total-row">
              TOTAL: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total)}
            </p>
          </div>

          ${invoice.warrantyDays ? `
          <div class="section" style="background: #fef3c7; padding: 15px; border-radius: 8px;">
            <p><strong>⚠️ Garantia:</strong> ${invoice.warrantyDays} dias</p>
            ${invoice.warrantyExpires ? `<p>Válida até: ${format(new Date(invoice.warrantyExpires), 'dd/MM/yyyy', { locale: ptBR })}</p>` : ''}
          </div>
          ` : ''}

          <div class="footer">
            <p>Documento gerado pelo SmartFlux ERP</p>
            <p>Este documento não possui valor fiscal oficial</p>
            ${invoice.accessKey ? `<p style="margin-top: 10px;">Chave de Acesso: ${invoice.accessKey}</p>` : ''}
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  // Stats
  const stats = [
    {
      label: 'Total Emitidas',
      value: invoicesData?.total || 0,
      icon: FileText,
      color: 'text-primary-600',
      bg: 'bg-blue-100 dark:bg-primary-900/30',
    },
    {
      label: 'Notas Fiscais',
      value: invoicesData?.data?.filter((i: any) => i.type === 'SALE').length || 0,
      icon: Receipt,
      color: 'text-success-600',
      bg: 'bg-green-100 dark:bg-success-900/30',
    },
    {
      label: 'Ordens de Serviço',
      value: invoicesData?.data?.filter((i: any) => i.type === 'SERVICE').length || 0,
      icon: Wrench,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Garantias',
      value: invoicesData?.data?.filter((i: any) => i.type === 'WARRANTY').length || 0,
      icon: CheckCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Notas e Recibos
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Geração de documentos fiscais e garantias
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ViewToggle storageKey="notas" defaultView="list" onViewChange={setView} />
          <button onClick={openModal} className="btn-primary">
            <Plus className="w-5 h-5" />
            Gerar Documento
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, cliente..."
              className="input pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input w-full md:w-40"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full md:w-40"
          >
            <option value="">Todos os status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : invoicesData?.data && invoicesData.data.length > 0 ? (
        <div className="space-y-4">
          {/* Card View */}
          {view === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {invoicesData.data.map((invoice: any) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`card hover:shadow-lg transition-shadow ${invoice.status === 'CANCELLED' ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      typeColors[invoice.type] || 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      {invoice.type === 'WARRANTY' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : invoice.type === 'SERVICE' ? (
                        <Wrench className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`badge ${statusColors[invoice.status]}`}>
                      {statusLabels[invoice.status]}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {invoice.number}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {typeLabels[invoice.type] || invoice.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {invoice.customer?.name || invoice.sale?.customer?.name || 'Cliente não identificado'}
                    </p>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(invoice.issueDate || invoice.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    {invoice.warrantyDays && (
                      <div className="flex items-center gap-2 text-sm text-orange-500">
                        <CheckCircle className="w-4 h-4" />
                        Garantia: {invoice.warrantyDays} dias
                      </div>
                    )}
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openPreview(invoice)}
                        className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(invoice)}
                        className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => sendEmailMutation.mutate(invoice.id)}
                        disabled={sendEmailMutation.isPending}
                        className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                        title="Enviar por E-mail"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePrint(invoice)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg"
                        title="Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => sendWhatsAppMutation.mutate(invoice.id)}
                        disabled={sendWhatsAppMutation.isPending}
                        className="p-1.5 text-slate-600 hover:text-success-600 hover:bg-success-50 dark:text-slate-400 dark:hover:text-success-400 dark:hover:bg-success-900/20 rounded-lg"
                        title="Enviar por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      {invoice.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancel(invoice.id)}
                          disabled={cancelMutation.isPending}
                          className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 dark:text-slate-400 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 rounded-lg"
                          title="Cancelar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* List View */
            <>
              {invoicesData.data.map((invoice: any) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card-hover ${invoice.status === 'CANCELLED' ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeColors[invoice.type]?.bg || 'bg-green-100 dark:bg-success-900/30'}`}>
                    {invoice.type === 'WARRANTY' ? (
                      <CheckCircle className={`w-6 h-6 ${typeColors[invoice.type]?.text || 'text-success-600'}`} />
                    ) : invoice.type === 'SERVICE' ? (
                      <Wrench className={`w-6 h-6 ${typeColors[invoice.type]?.text || 'text-purple-600'}`} />
                    ) : (
                      <FileText className={`w-6 h-6 ${typeColors[invoice.type]?.text || 'text-success-600'}`} />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {invoice.number}
                      </span>
                      <span className={`text-sm px-2 py-0.5 rounded ${typeColors[invoice.type]?.bg || 'bg-slate-100 dark:bg-slate-700'} ${typeColors[invoice.type]?.text || 'text-slate-500 dark:text-slate-400'}`}>
                        {typeLabels[invoice.type]}
                      </span>
                      <span className={`badge ${statusColors[invoice.status]}`}>
                        {statusLabels[invoice.status]}
                      </span>
                      {invoice.type === 'WARRANTY' && invoice.warrantyDays && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">
                          {invoice.warrantyDays} dias
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {invoice.sale?.customer?.name || invoice.serviceOrder?.customer?.name || 'Cliente não identificado'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(invoice.issueDate || invoice.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPreview(invoice)}
                    className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                    title="Visualizar"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDownload(invoice)}
                    className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                    title="Download PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handlePrint(invoice)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg"
                    title="Imprimir"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => sendEmailMutation.mutate(invoice.id)}
                    disabled={sendEmailMutation.isPending}
                    className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                    title="Enviar por E-mail"
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => sendWhatsAppMutation.mutate(invoice.id)}
                    disabled={sendWhatsAppMutation.isPending}
                    className="p-2 text-slate-600 hover:text-success-600 hover:bg-success-50 dark:text-slate-400 dark:hover:text-success-400 dark:hover:bg-success-900/20 rounded-lg"
                    title="Enviar por WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  {invoice.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCancel(invoice.id)}
                      disabled={cancelMutation.isPending}
                      className="p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 dark:text-slate-400 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 rounded-lg"
                      title="Cancelar"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
            </>
          )}

          {/* Pagination */}
          {invoicesData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Página {page} de {invoicesData.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(invoicesData.totalPages, p + 1))}
                disabled={page === invoicesData.totalPages}
                className="btn-secondary"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Nenhum documento encontrado
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Gere notas, recibos e garantias para suas vendas
          </p>
          <button onClick={openModal} className="btn-primary">
            <Plus className="w-5 h-5" />
            Gerar Documento
          </button>
        </div>
      )}

      {/* Generate Document Modal */}
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
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Gerar Documento
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Tipo de Documento */}
                <div>
                  <label className="label">Tipo de Documento *</label>
                  <select
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value)}
                    className="input"
                  >
                    <option value="SALE">Nota Fiscal (Demonstrativo)</option>
                    <option value="SERVICE">Nota de Serviço</option>
                    <option value="WARRANTY">Termo de Garantia</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    * Documentos são gerados apenas para fins de credibilidade e garantia
                  </p>
                </div>

                {/* Origem do Documento */}
                <div>
                  <label className="label">Origem *</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSourceType('sale');
                        setSelectedSource('');
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        sourceType === 'sale'
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Receipt className="w-4 h-4 inline mr-2" />
                      Venda
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSourceType('serviceOrder');
                        setSelectedSource('');
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        sourceType === 'serviceOrder'
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Wrench className="w-4 h-4 inline mr-2" />
                      Ordem de Serviço
                    </button>
                  </div>

                  {sourceType === 'sale' ? (
                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="input"
                    >
                      <option value="">Selecione uma venda</option>
                      {salesData?.data?.map((sale: any) => (
                        <option key={sale.id} value={sale.id}>
                          #{sale.saleNumber} - {sale.customer?.name || 'Consumidor Final'} - {' '}
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="input"
                    >
                      <option value="">Selecione uma ordem de serviço</option>
                      {serviceOrdersData?.data?.map((order: any) => (
                        <option key={order.id} value={order.id}>
                          #{order.orderNumber} - {order.customer?.name || 'Cliente'} - {order.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Garantia */}
                {invoiceType === 'WARRANTY' && (
                  <div>
                    <label className="label">Dias de Garantia</label>
                    <input
                      type="number"
                      value={warrantyDays}
                      onChange={(e) => setWarrantyDays(Number(e.target.value))}
                      min="0"
                      className="input"
                      placeholder="90"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Informe o período de garantia em dias
                    </p>
                  </div>
                )}

                {/* Observações */}
                <div>
                  <label className="label">Observações</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input"
                    rows={2}
                    placeholder="Observações adicionais para o documento..."
                  />
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
                  <h4 className="font-medium text-primary-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Informação
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Após gerar o documento, você poderá enviá-lo automaticamente para o 
                    e-mail e WhatsApp do cliente cadastrado, além de uma cópia para você.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || !selectedSource}
                    className="btn-primary"
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Gerar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {typeLabels[selectedInvoice.type]} - {selectedInvoice.number}
                  </h3>
                  <span className={`badge ${statusColors[selectedInvoice.status]}`}>
                    {statusLabels[selectedInvoice.status]}
                  </span>
                </div>
                <button
                  onClick={closePreview}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Document Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    SmartFlux ERP
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    {typeLabels[selectedInvoice.type].toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Documento Nº: {selectedInvoice.number}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Emissão: {format(new Date(selectedInvoice.issueDate || selectedInvoice.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Destinatário</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedInvoice.sale?.customer?.name || selectedInvoice.serviceOrder?.customer?.name || 'Consumidor Final'}
                  </p>
                  {(selectedInvoice.sale?.customer?.document || selectedInvoice.serviceOrder?.customer?.document) && (
                    <p className="text-sm text-slate-500">
                      CPF/CNPJ: {selectedInvoice.sale?.customer?.document || selectedInvoice.serviceOrder?.customer?.document}
                    </p>
                  )}
                  {(selectedInvoice.sale?.customer?.email || selectedInvoice.serviceOrder?.customer?.email) && (
                    <p className="text-sm text-slate-500">
                      E-mail: {selectedInvoice.sale?.customer?.email || selectedInvoice.serviceOrder?.customer?.email}
                    </p>
                  )}
                  {(selectedInvoice.sale?.customer?.phone || selectedInvoice.serviceOrder?.customer?.phone) && (
                    <p className="text-sm text-slate-500">
                      Telefone: {selectedInvoice.sale?.customer?.phone || selectedInvoice.serviceOrder?.customer?.phone}
                    </p>
                  )}
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Itens</h4>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                          <th className="text-left py-2 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            {selectedInvoice.serviceOrder ? 'Descrição' : 'Produto'}
                          </th>
                          <th className="text-center py-2 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            Qtd
                          </th>
                          <th className="text-right py-2 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            Unit.
                          </th>
                          <th className="text-right py-2 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {selectedInvoice.sale?.items?.map((item: any) => (
                          <tr key={item.id}>
                            <td className="py-2 px-4 text-slate-900 dark:text-white">
                              {item.product?.name}
                            </td>
                            <td className="py-2 px-4 text-center text-slate-600 dark:text-slate-400">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-4 text-right text-slate-600 dark:text-slate-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}
                            </td>
                            <td className="py-2 px-4 text-right font-medium text-slate-900 dark:text-white">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                            </td>
                          </tr>
                        ))}
                        {selectedInvoice.serviceOrder && (
                          <tr>
                            <td className="py-2 px-4 text-slate-900 dark:text-white">
                              {selectedInvoice.serviceOrder.title}
                              {selectedInvoice.serviceOrder.description && (
                                <p className="text-xs text-slate-500">{selectedInvoice.serviceOrder.description}</p>
                              )}
                            </td>
                            <td className="py-2 px-4 text-center text-slate-600 dark:text-slate-400">
                              1
                            </td>
                            <td className="py-2 px-4 text-right text-slate-600 dark:text-slate-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.total)}
                            </td>
                            <td className="py-2 px-4 text-right font-medium text-slate-900 dark:text-white">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.total)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.total)}
                    </span>
                  </div>
                </div>

                {/* Warranty Info */}
                {selectedInvoice.type === 'WARRANTY' && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                      Termo de Garantia
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Este documento garante a qualidade dos produtos/serviços adquiridos. 
                      A garantia é válida por <strong>{selectedInvoice.warrantyDays || 90} dias</strong> a partir da data de emissão, 
                      sujeita às condições de uso adequado do produto.
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                      Observações
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p>Documento gerado pelo SmartFlux ERP</p>
                  <p>Este documento não possui valor fiscal</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  {selectedInvoice.status !== 'CANCELLED' && (
                    <button 
                      onClick={() => {
                        handleCancel(selectedInvoice.id);
                        closePreview();
                      }} 
                      disabled={cancelMutation.isPending}
                      className="btn-secondary text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={closePreview} className="btn-secondary">
                    Fechar
                  </button>
                  <button onClick={() => handlePrint(selectedInvoice)} className="btn-secondary">
                    <Printer className="w-4 h-4" />
                    Imprimir
                  </button>
                  <button onClick={() => handleDownload(selectedInvoice)} className="btn-secondary">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button 
                    onClick={() => {
                      sendEmailMutation.mutate(selectedInvoice.id);
                      sendWhatsAppMutation.mutate(selectedInvoice.id);
                    }}
                    disabled={sendEmailMutation.isPending || sendWhatsAppMutation.isPending}
                    className="btn-primary"
                  >
                    <Send className="w-4 h-4" />
                    Enviar ao Cliente
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

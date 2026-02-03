'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  CheckCircle,
  Edit2,
  User,
  Package,
  Calendar,
  GripVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ServiceOrder {
  id: string;
  orderNumber: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  customer?: { name: string };
  deviceType?: string;
  deviceBrand?: string;
  laborCost?: number;
  createdAt: string;
}

interface PipelineColumn {
  key: string;
  label: string;
  color: string;
  bgLight: string;
}

interface ServiceOrderPipelineProps {
  orders: ServiceOrder[];
  columns: PipelineColumn[];
  onStatusChange: (orderId: string, newStatus: string) => void;
  onEdit: (order: ServiceOrder) => void;
  onViewDetails: (order: ServiceOrder) => void;
}

const priorityColors: Record<string, string> = {
  LOW: 'text-slate-600',
  NORMAL: 'text-primary-600',
  HIGH: 'text-warning-600',
  URGENT: 'text-danger-600',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export function ServiceOrderPipeline({
  orders,
  columns,
  onStatusChange,
  onEdit,
  onViewDetails,
}: ServiceOrderPipelineProps) {
  const [draggedItem, setDraggedItem] = useState<ServiceOrder | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Agrupa orders por status
  const ordersByStatus = columns.reduce((acc, col) => {
    acc[col.key] = orders.filter((o) => o.status === col.key);
    return acc;
  }, {} as Record<string, ServiceOrder[]>);

  // Handlers de drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, order: ServiceOrder) => {
    setDraggedItem(order);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', order.id);
    
    // Adiciona classe para o item sendo arrastado
    const target = e.target as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedItem(null);
    setDragOverColumn(null);
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Só limpa se realmente saiu da coluna
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest('[data-column]')) {
      setDragOverColumn(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (draggedItem && draggedItem.status !== newStatus) {
      // Transições mais flexíveis - permite movimento livre para conclusão se atrasado
      const currentTime = new Date();
      const createdAt = new Date(draggedItem.createdAt);
      const daysDiff = (currentTime.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
      const isOverdue = daysDiff > 7; // Considera atrasado após 7 dias

      // Permite movimento direto para COMPLETED se atrasado ou para etapas anteriores
      const allowFlexibleTransitions = isOverdue || newStatus === 'COMPLETED' || 
        ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'].includes(newStatus);

      if (allowFlexibleTransitions) {
        onStatusChange(draggedItem.id, newStatus);
      } else {
        // Transições padrão para casos normais
        const validTransitions: Record<string, string[]> = {
          PENDING: ['IN_PROGRESS', 'CANCELLED', 'COMPLETED'],
          IN_PROGRESS: ['WAITING_PARTS', 'COMPLETED', 'CANCELLED', 'PENDING'],
          WAITING_PARTS: ['IN_PROGRESS', 'CANCELLED', 'COMPLETED'],
          COMPLETED: ['DELIVERED', 'IN_PROGRESS'],
          DELIVERED: ['IN_PROGRESS'],
          CANCELLED: ['PENDING', 'IN_PROGRESS'],
        };

        if (validTransitions[draggedItem.status]?.includes(newStatus)) {
          onStatusChange(draggedItem.id, newStatus);
        }
      }
    }
    
    setDraggedItem(null);
    setDragOverColumn(null);
  }, [draggedItem, onStatusChange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      {/* Pipeline responsivo - em telas pequenas, empilha verticalmente */}
      <div className="flex flex-col lg:flex-row gap-4 lg:min-w-max">
        {columns.map((column) => {
          const isDropTarget = dragOverColumn === column.key && draggedItem?.status !== column.key;
          const canDrop = draggedItem && draggedItem.status !== column.key;
          
          return (
            <div 
              key={column.key} 
              className="w-full lg:w-80 lg:flex-shrink-0"
              data-column={column.key}
            >
              {/* Column Header */}
              <div className={`${column.bgLight} rounded-t-xl p-3 border-b-4 ${column.color.replace('bg-', 'border-')}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{column.label}</h3>
                  <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full text-sm font-bold text-slate-600 dark:text-slate-400 shadow-sm">
                    {ordersByStatus[column.key]?.length || 0}
                  </span>
                </div>
              </div>

              {/* Column Content - Droppable Area */}
              <div 
                className={`
                  bg-slate-100 dark:bg-slate-800/50 rounded-b-xl p-2 min-h-[200px] lg:min-h-[500px] space-y-2
                  transition-all duration-200
                  ${isDropTarget ? 'ring-2 ring-primary-500 ring-inset bg-primary-50 dark:bg-primary-900/20' : ''}
                  ${canDrop ? 'cursor-pointer' : ''}
                `}
                onDragOver={(e) => handleDragOver(e, column.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.key)}
              >
                {/* Drop indicator */}
                {isDropTarget && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-2 border-dashed border-primary-400 rounded-lg p-4 text-center text-primary-600 dark:text-primary-400 text-sm font-medium"
                  >
                    Solte aqui para mover
                  </motion.div>
                )}

                {ordersByStatus[column.key]?.map((order) => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order)}
                    onDragEnd={handleDragEnd}
                    className={`
                      bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm 
                      border border-slate-200 dark:border-slate-700 
                      hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600
                      transition-all cursor-grab active:cursor-grabbing
                      ${draggedItem?.id === order.id ? 'opacity-50 scale-95' : ''}
                    `}
                    onClick={() => onViewDetails(order)}
                  >
                    {/* Drag Handle */}
                    <div className="flex items-start gap-2 mb-2">
                      <div className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-grab">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          #{order.orderNumber || order.code}
                        </span>
                        <span className={`text-xs font-medium ${priorityColors[order.priority]}`}>
                          {priorityLabels[order.priority]}
                        </span>
                      </div>
                    </div>

                    {/* Card Title */}
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-2 line-clamp-2 pl-6">
                      {order.title}
                    </h4>

                    {/* Customer */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2 pl-6">
                      <User className="w-3 h-3" />
                      <span className="truncate">{order.customer?.name}</span>
                    </div>

                    {/* Device */}
                    {order.deviceType && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2 pl-6">
                        <Package className="w-3 h-3" />
                        <span className="truncate">
                          {order.deviceType} {order.deviceBrand && `- ${order.deviceBrand}`}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 pl-6">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(order.createdAt), 'dd/MM', { locale: ptBR })}
                      </div>
                      {order.laborCost && order.laborCost > 0 && (
                        <span className="text-xs font-medium text-success-600 dark:text-success-400">
                          {formatCurrency(order.laborCost)}
                        </span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div 
                      className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 pl-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {column.key === 'PENDING' && (
                        <button
                          onClick={() => onStatusChange(order.id, 'IN_PROGRESS')}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Iniciar
                        </button>
                      )}
                      {column.key === 'IN_PROGRESS' && (
                        <>
                          <button
                            onClick={() => onStatusChange(order.id, 'WAITING_PARTS')}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                          >
                            <Pause className="w-3 h-3" />
                            Aguardar
                          </button>
                          <button
                            onClick={() => onStatusChange(order.id, 'COMPLETED')}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Concluir
                          </button>
                        </>
                      )}
                      {column.key === 'WAITING_PARTS' && (
                        <button
                          onClick={() => onStatusChange(order.id, 'IN_PROGRESS')}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          Retomar
                        </button>
                      )}
                      {column.key === 'COMPLETED' && (
                        <button
                          onClick={() => onStatusChange(order.id, 'DELIVERED')}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Entregar
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(order)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {ordersByStatus[column.key]?.length === 0 && !isDropTarget && (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <Package className="w-6 h-6" />
                    </div>
                    Nenhuma ordem
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { customersApi } from '@/lib/api';
import { showApiError } from '@/lib/error-handler';
import { maskCPFCNPJ, maskPhone, validateCPFCNPJ, unmask } from '@/lib/utils';
import { useModalCache } from '@/hooks/useModalCache';

const quickCustomerSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  phone: z.string().optional().or(z.literal('')),
  cpfCnpj: z.string().optional(),
  skipDocument: z.boolean().default(false),
}).refine((data) => {
  if (!data.skipDocument && data.cpfCnpj && data.cpfCnpj.length > 0) {
    const unmasked = unmask(data.cpfCnpj);
    if (unmasked.length > 0 && unmasked.length !== 11 && unmasked.length !== 14) {
      return false;
    }
    if (unmasked.length === 11 || unmasked.length === 14) {
      return validateCPFCNPJ(unmasked);
    }
  }
  return true;
}, {
  message: 'CPF/CNPJ inválido',
  path: ['cpfCnpj'],
});

type QuickCustomerForm = z.infer<typeof quickCustomerSchema>;

interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: any) => void;
}

export function QuickCustomerModal({ isOpen, onClose, onSuccess }: QuickCustomerModalProps) {
  const queryClient = useQueryClient();
  const { loadCache, saveCache, clearCache } = useModalCache('quick-customer');
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuickCustomerForm>({
    resolver: zodResolver(quickCustomerSchema),
    defaultValues: {
      skipDocument: false,
    },
  });

  const skipDocument = watch('skipDocument');
  const formData = watch();

  // Carrega o cache quando a Modal Abrir
  useEffect(() => {
    if (isOpen) {
      const cached = loadCache();
      if (cached && cached.name) {
        reset(cached);
      }
    }
  }, [isOpen, loadCache, reset]);

  // Salva o cache em caso de mudança
  useEffect(() => {
    if (isOpen && formData.name) {
      saveCache(formData);
    }
  }, [isOpen, formData, saveCache]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setValue('phone', masked);
  }, [setValue]);

  const handleCPFCNPJChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCPFCNPJ(e.target.value);
    setValue('cpfCnpj', masked);
  }, [setValue]);

  const createMutation = useMutation({
    mutationFn: (data: any) => customersApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente cadastrado com sucesso!');
      clearCache();
      reset();
      onClose();
      if (onSuccess) {
        onSuccess(response.data);
      }
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao cadastrar cliente');
    },
  });

  const onSubmit = (data: QuickCustomerForm) => {
    const submitData = {
      name: data.name,
      phone: data.phone ? unmask(data.phone) : undefined,
      cpfCnpj: data.skipDocument ? undefined : (data.cpfCnpj ? unmask(data.cpfCnpj) : undefined),
      isActive: true,
    };

    createMutation.mutate(submitData);
  };

  const handleClose = () => {
    // Guarda as informações da Modal quando fechada acidentalmente.
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Cadastro Rápido de Cliente
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input
                  {...register('name')}
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="Nome do cliente"
                  autoFocus
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Telefone</label>
                <input
                  {...register('phone')}
                  onChange={handlePhoneChange}
                  className="input"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">CPF/CNPJ</label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('skipDocument')}
                      className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                    />
                    Não incluir
                  </label>
                </div>
                <input
                  {...register('cpfCnpj')}
                  onChange={handleCPFCNPJChange}
                  className={`input ${errors.cpfCnpj ? 'input-error' : ''} ${skipDocument ? 'opacity-50 bg-slate-100 dark:bg-slate-700' : ''}`}
                  placeholder="000.000.000-00"
                  maxLength={18}
                  disabled={skipDocument}
                />
                {errors.cpfCnpj && (
                  <p className="text-red-500 text-sm mt-1">{errors.cpfCnpj.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={handleClose} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Cadastrar'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

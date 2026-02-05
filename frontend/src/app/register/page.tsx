'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store';

const registerSchema = z.object({
  tenantName: z.string()
    .min(3, 'O nome da empresa deve ter no mínimo 3 caracteres')
    .max(100, 'O nome da empresa deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'O nome da empresa deve conter apenas letras e espaços'),
  name: z.string()
    .min(2, 'O nome deve ter no mínimo 2 caracteres')
    .max(100, 'O nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'O nome deve conter apenas letras e espaços'),
  email: z.string()
    .email('O formato do email é inválido')
    .max(255, 'O email deve ter no máximo 255 caracteres'),
  password: z.string()
    .min(6, 'A senha deve ter no mínimo 6 caracteres')
    .max(100, 'A senha deve ter no máximo 100 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      setFieldErrors({});
      clearErrors();

      const response = await authApi.register({
        tenantName: data.tenantName,
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const { accessToken, refreshToken, user } = response.data;
      setAuth(user, accessToken, refreshToken);

      toast.success(`Conta criada com sucesso! Bem-vindo, ${user.name}!`);
      router.replace('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;

      // Tratamento específico de erros comuns
      if (error.response?.status === 409) {
        if (errorMessage?.includes('email')) {
          setError('email', { message: 'Este email já está cadastrado' });
        } else if (errorMessage?.includes('empresa') || errorMessage?.includes('tenant')) {
          setError('tenantName', { message: 'Nome da empresa já está em uso' });
        } else {
          toast.error('Usuário ou empresa já existe');
        }
      } else if (error.response?.status === 400) {
        // Tentar identificar campos específicos
        if (errorMessage?.includes('email')) {
          setError('email', { message: 'Email inválido ou já cadastrado' });
        } else if (errorMessage?.includes('senha') || errorMessage?.includes('password')) {
          setError('password', { message: 'Senha não atende aos requisitos' });
        } else if (errorMessage?.includes('nome') && errorMessage?.includes('empresa')) {
          setError('tenantName', { message: 'Nome da empresa é obrigatório' });
        } else if (errorMessage?.includes('nome')) {
          setError('name', { message: 'Nome é obrigatório' });
        } else {
          toast.error(errorMessage || 'Dados inválidos. Verifique os campos');
        }
      } else if (error.response?.status === 429) {
        toast.error('Muitas tentativas. Tente novamente em alguns minutos');
      } else if (error.response?.status === 500) {
        toast.error('Erro interno do servidor. Tente novamente');
      } else if (!navigator.onLine) {
        toast.error('Sem conexão com a internet');
      } else {
        toast.error(errorMessage || 'Erro ao criar conta. Tente novamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-1/4 w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-primary-600/10 rounded-full blur-[80px] sm:blur-[100px]" />
      <div className="absolute bottom-0 left-1/4 w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-secondary-500/10 rounded-full blur-[80px] sm:blur-[100px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[340px] sm:max-w-sm md:max-w-md relative z-10 my-4 sm:my-6"
      >
        {/* Logo */}
        <div className="text-center mb-3 sm:mb-4 md:mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">SmartFlux</span>
          </Link>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">Crie sua conta</h1>
          <p className="text-xs sm:text-sm text-slate-400">Comece a gerenciar seu negócio agora</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-800 p-4 sm:p-5 md:p-6 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            {/* Requisitos de Senha */}
            <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Requisitos para criação da conta:</h3>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Nome da empresa único (mín. 3 caracteres)</li>
                <li>• Nome completo (mín. 2 caracteres, apenas letras)</li>
                <li>• Email válido e único na empresa</li>
                <li>• Senha forte (mín. 6 caracteres, maiúscula, minúscula, número)</li>
              </ul>
            </div>
            <div>
              <label htmlFor="tenantName" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                Nome da Empresa/Loja
              </label>
              <input
                id="tenantName"
                type="text"
                {...register('tenantName')}
                className={`w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.tenantName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Minha Loja"
              />
              {errors.tenantName && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.tenantName.message}</p>
              )}
              <div className="mt-1 text-xs text-slate-500">
                Nome único para sua empresa no sistema
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                Seu Nome
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="João Silva"
              />
              {errors.name && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.name.message}</p>
              )}
              <div className="mt-1 text-xs text-slate-500">
                Seu nome completo para identificação
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email.message}</p>
              )}
              <div className="mt-1 text-xs text-slate-500">
                Use um email válido para receber notificações
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
                <div className="mt-1 text-xs text-slate-500">
                  Mín. 6 caracteres, 1 maiúscula, 1 minúscula, 1 número
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                  Confirmar Senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  className={`w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-900"
              />
              <label htmlFor="terms" className="text-xs sm:text-sm text-slate-400 leading-tight">
                Concordo com os{' '}
                <Link href="/terms" className="text-primary-400 hover:text-primary-300 transition-colors">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link href="/privacy" className="text-primary-400 hover:text-primary-300 transition-colors">
                  Política de Privacidade
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Criando conta...</span>
                </>
              ) : (
                <>
                  <span>Criar Conta Grátis</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 sm:mt-5 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

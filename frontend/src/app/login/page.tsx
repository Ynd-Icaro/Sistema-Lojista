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

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(data.email, data.password);

      const { accessToken, refreshToken, user } = response;
      setAuth(user, accessToken, refreshToken);

      toast.success(`Bem-vindo, ${user.name}!`);
      
      // Redirecionar para o dashboard
      router.replace('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;

      // Tratamento específico de erros comuns
      if (error.response?.status === 401) {
        toast.error('Email ou senha incorretos');
      } else if (error.response?.status === 429) {
        toast.error('Muitas tentativas. Tente novamente em alguns minutos');
      } else if (error.response?.status === 500) {
        toast.error('Erro interno do servidor. Tente novamente');
      } else if (!navigator.onLine) {
        toast.error('Sem conexão com a internet');
      } else {
        toast.error(errorMessage || 'Erro ao fazer login. Tente novamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-primary-600/10 rounded-full blur-[80px] sm:blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-secondary-500/10 rounded-full blur-[80px] sm:blur-[100px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[340px] sm:max-w-sm md:max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">SmartFlux</span>
          </Link>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Bem-vindo de volta!</h1>
          <p className="text-xs sm:text-sm text-slate-400">Entre com sua conta para continuar</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-800 p-4 sm:p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 md:space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10 sm:pr-12 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs sm:text-sm text-slate-400">Lembrar de mim</span>
              </label>
              
              <Link href="/forgot-password" className="text-xs sm:text-sm text-primary-400 hover:text-primary-300 transition-colors">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-4 sm:mt-5 md:mt-6 p-2.5 sm:p-3 md:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-700/50">
            <p className="text-xs sm:text-sm text-slate-400 mb-1.5 sm:mb-2 font-medium">Credenciais de demonstração:</p>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-slate-300">
                <strong className="text-primary-400">Admin:</strong> admin@lojademo.com
              </p>
              <p className="text-xs sm:text-sm text-slate-400">Senha: Admin@123</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1">
              <p className="text-xs sm:text-sm text-slate-300">
                <strong className="text-secondary-400">Vendedor:</strong> vendedor@lojademo.com
              </p>
              <p className="text-xs sm:text-sm text-slate-400">Senha: Vendedor@123</p>
            </div>
          </div>

          <div className="mt-4 sm:mt-5 md:mt-6 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

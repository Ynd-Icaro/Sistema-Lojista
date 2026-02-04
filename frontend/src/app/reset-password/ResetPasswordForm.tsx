'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';

const resetPasswordSchema = z.object({
  code: z.string().min(6, 'Código deve ter 6 dígitos').max(6, 'Código deve ter 6 dígitos'),
  newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!email) {
      router.push('/forgot-password');
    }
  }, [email, router]);

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      setIsLoading(true);
      await authApi.resetPassword({
        email,
        code: data.code,
        newPassword: data.newPassword,
      });
      setPasswordReset(true);
      toast.success('Senha redefinida com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (passwordReset) {
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
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white">SmartFlux</span>
            </Link>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Senha redefinida!</h1>
            <p className="text-xs sm:text-sm text-slate-400">Sua senha foi alterada com sucesso</p>
          </div>

          {/* Success Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-800 p-4 sm:p-6 md:p-8 shadow-2xl text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Senha alterada com sucesso!</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">
              Você já pode fazer login com sua nova senha.
            </p>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
            >
              Ir para o login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">SmartFlux</span>
          </Link>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Redefinir senha</h1>
          <p className="text-xs sm:text-sm text-slate-400">Digite o código enviado para {email}</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-800 p-4 sm:p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
            <div>
              <label htmlFor="code" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-1.5">
                Código de verificação
              </label>
              <input
                id="code"
                type="text"
                {...register('code')}
                className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-center tracking-widest ${errors.code ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="000000"
                maxLength={6}
              />
              {errors.code && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-1.5">
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  {...register('newPassword')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10 sm:pr-12 ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
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
              {errors.newPassword && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-1.5">
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10 sm:pr-12 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Redefinindo...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Redefinir senha</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 sm:mt-5 md:mt-6 text-center">
            <Link href="/forgot-password" className="text-primary-400 hover:text-primary-300 text-sm sm:text-base font-medium transition-colors inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
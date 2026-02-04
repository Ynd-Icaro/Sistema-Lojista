'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      await authApi.forgotPassword(data.email);
      setEmailSent(true);
      toast.success('Código de verificação enviado para seu email!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Email enviado!</h1>
            <p className="text-xs sm:text-sm text-slate-400">Verifique sua caixa de entrada</p>
          </div>

          {/* Success Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-800 p-4 sm:p-6 md:p-8 shadow-2xl text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Código enviado com sucesso!</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">
              Enviamos um código de verificação para <strong className="text-white">{getValues('email')}</strong>.
              Verifique sua caixa de entrada e spam.
            </p>

            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => router.push(`/reset-password?email=${encodeURIComponent(getValues('email'))}`)}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
              >
                Inserir código de verificação
              </button>

              <button
                onClick={() => setEmailSent(false)}
                className="w-full text-slate-400 hover:text-white text-sm sm:text-base transition-colors"
              >
                Não recebeu o email? Tentar novamente
              </button>
            </div>

            <div className="mt-4 sm:mt-6 text-center">
              <Link href="/login" className="text-primary-400 hover:text-primary-300 text-sm sm:text-base font-medium transition-colors inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </Link>
            </div>
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
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">SmartFlux</span>
          </Link>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Esqueceu sua senha?</h1>
          <p className="text-xs sm:text-sm text-slate-400">Digite seu email para receber o código de verificação</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-800 p-4 sm:p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Enviar código</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 sm:mt-5 md:mt-6 text-center">
            <Link href="/login" className="text-primary-400 hover:text-primary-300 text-sm sm:text-base font-medium transition-colors inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
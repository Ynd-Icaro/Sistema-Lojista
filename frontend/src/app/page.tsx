'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ShoppingCart,
  Package,
  Users,
  FileText,
  TrendingUp,
  Bell,
  Smartphone,
  Mail,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Settings,
  Star,
  Play,
  ChevronRight,
  Sparkles,
  Clock,
  DollarSign,
  Target,
  Award,
  Menu,
  X,
  MessageCircle,
  Phone,
  Wrench,
  CreditCard,
  PieChart,
  MousePointer,
} from 'lucide-react';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Animated counter component
function AnimatedCounter({ target, duration = 2000, prefix = '', suffix = '' }: { target: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (!isVisible) return;
    
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, isVisible]);
  
  return (
    <span 
      ref={(el) => {
        if (el) {
          const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setIsVisible(true);
          }, { threshold: 0.1 });
          observer.observe(el);
        }
      }}
    >
      {prefix}{count.toLocaleString('pt-BR')}{suffix}
    </span>
  );
}

// Floating elements animation
const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Stagger children animation
const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

const features = [
  {
    icon: ShoppingCart,
    title: 'PDV Inteligente',
    description: 'Vendas rápidas com atalhos, múltiplos pagamentos e emissão instantânea de comprovantes.',
    color: 'from-primary-500 to-primary-700',
  },
  {
    icon: Package,
    title: 'Estoque Automatizado',
    description: 'Controle automático com alertas de reposição e rastreamento de movimentações.',
    color: 'from-secondary-500 to-secondary-700',
  },
  {
    icon: Users,
    title: 'CRM Integrado',
    description: 'Histórico completo, fidelidade e comunicação personalizada com seus clientes.',
    color: 'from-success-500 to-success-700',
  },
  {
    icon: Wrench,
    title: 'Ordens de Serviço',
    description: 'Gestão completa de OS com acompanhamento de status e notificações automáticas.',
    color: 'from-warning-500 to-warning-700',
  },
  {
    icon: DollarSign,
    title: 'Financeiro Completo',
    description: 'Contas a pagar/receber, fluxo de caixa, relatórios e indicadores em tempo real.',
    color: 'from-primary-600 to-secondary-600',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp & Email',
    description: 'Envio automático de notas, lembretes e promoções direto para seus clientes.',
    color: 'from-success-400 to-success-600',
  },
];

const stats = [
  { value: 5000, suffix: '+', label: 'Empresas Ativas' },
  { value: 2, prefix: 'R$ ', suffix: 'M+', label: 'Em Vendas/Mês' },
  { value: 99.9, suffix: '%', label: 'Uptime' },
  { value: 4.9, suffix: '/5', label: 'Avaliação' },
];

const testimonials = [
  {
    name: 'Carlos Silva',
    role: 'Dono - Eletrônicos CS',
    image: 'CS',
    content: 'O SmartFlux transformou minha loja. Antes perdia horas com planilhas, agora tenho tudo na palma da mão. Aumentei minhas vendas em 40%!',
    rating: 5,
  },
  {
    name: 'Ana Paula',
    role: 'Gerente - Boutique Fashion',
    image: 'AP',
    content: 'A integração com WhatsApp é incrível! Meus clientes recebem as notas instantaneamente e isso aumentou muito a credibilidade.',
    rating: 5,
  },
  {
    name: 'Roberto Mendes',
    role: 'Proprietário - Auto Center RM',
    image: 'RM',
    content: 'O controle de ordens de serviço mudou minha oficina. Meus clientes acompanham tudo em tempo real e as reclamações caíram a zero.',
    rating: 5,
  },
];

const plans = [
  {
    name: 'Starter',
    price: 0,
    description: 'Perfeito para começar',
    features: [
      'PDV básico',
      'Até 50 produtos',
      'Até 30 clientes',
      '1 usuário',
      'Suporte por email',
    ],
    cta: 'Começar Grátis',
    highlighted: false,
  },
  {
    name: 'Profissional',
    price: 97,
    description: 'Mais popular',
    features: [
      'PDV completo com atalhos',
      'Produtos ilimitados',
      'Clientes ilimitados',
      'Até 5 usuários',
      'Ordens de serviço',
      'Financeiro completo',
      'Notificações WhatsApp/Email',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    cta: 'Experimentar 14 dias grátis',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 197,
    description: 'Para grandes operações',
    features: [
      'Tudo do Profissional',
      'Usuários ilimitados',
      'Multi-lojas',
      'API completa',
      'Integrações personalizadas',
      'Gerente de conta dedicado',
      'Treinamento presencial',
    ],
    cta: 'Falar com Consultor',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Preciso instalar algum programa?',
    a: 'Não! O SmartFlux funciona 100% no navegador. Basta acessar de qualquer dispositivo com internet.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Sim! Utilizamos criptografia de ponta e backups automáticos diários. Seus dados são sua propriedade.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Claro! Não temos fidelidade. Você pode cancelar quando quiser, sem multas ou burocracia.',
  },
  {
    q: 'O sistema emite nota fiscal?',
    a: 'Geramos documentos de venda, recibos e termos de garantia. Para NF-e oficial, temos integração com emissores.',
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  
  // GSAP refs
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  
  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero parallax effect
      gsap.to('.hero-glow-1', {
        y: 100,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
      
      gsap.to('.hero-glow-2', {
        y: 150,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
      });
      
      // Stats counter animation
      gsap.from('.stat-item', {
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });
      
      // Features stagger animation
      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 75%',
        },
        y: 60,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
      });
    });
    
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="hero-glow-1 absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[100px]" />
        <div className="hero-glow-2 absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary-500/5 to-transparent rounded-full" />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-noise pointer-events-none" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full border-2 border-slate-950 animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">SmartFlux</span>
                <span className="text-xs text-primary-400 block -mt-1">ERP System</span>
              </div>
            </motion.div>
            
            <nav className="hidden lg:flex items-center gap-8">
              {['Recursos', 'Benefícios', 'Depoimentos', 'Planos', 'FAQ'].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="text-slate-400 hover:text-white transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </nav>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center gap-4"
            >
              <Link href="/login" className="text-slate-400 hover:text-white transition-colors font-medium">
                Entrar
              </Link>
              <Link
                href="/register"
                className="relative group bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Começar Grátis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-slate-900 border-t border-slate-800"
            >
              <div className="container mx-auto px-4 py-4 space-y-4">
                {['Recursos', 'Benefícios', 'Depoimentos', 'Planos', 'FAQ'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-slate-400 hover:text-white transition-colors py-2"
                  >
                    {item}
                  </a>
                ))}
                <div className="pt-4 space-y-3">
                  <Link href="/login" className="block text-center text-slate-400 hover:text-white py-2">
                    Entrar
                  </Link>
                  <Link href="/register" className="block text-center bg-primary-600 text-white py-3 rounded-xl font-semibold">
                    Começar Grátis
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-4 min-h-screen flex items-center">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="text-center lg:text-left"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-full text-primary-400 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Novo: Integração com PIX automático</span>
                <ChevronRight className="w-4 h-4" />
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
                Sua loja no{' '}
                <span className="relative">
                  <span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent">
                    próximo nível
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                      d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="50%" stopColor="#06B6D4" />
                        <stop offset="100%" stopColor="#2563EB" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0">
                Sistema completo para gerenciar vendas, estoque, clientes, financeiro e muito mais. 
                <span className="text-white font-medium"> Comece em minutos, sem complicação.</span>
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <Link
                  href="/register"
                  className="group w-full sm:w-auto bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-2xl shadow-primary-500/25 transition-all duration-300 hover:shadow-3xl hover:shadow-primary-500/40 hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  <Play className="w-5 h-5" />
                  Testar Grátis por 14 dias
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#demo"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-400 hover:text-white px-6 py-4 font-medium transition-colors"
                >
                  <MousePointer className="w-5 h-5" />
                  Ver demonstração
                </a>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  <span>Setup em 5 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                  <span>Suporte 24/7</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              {/* Floating Elements */}
              <motion.div
                variants={floatingAnimation}
                initial="initial"
                animate="animate"
                className="absolute -top-6 -left-6 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl p-4 shadow-xl shadow-success-500/30 z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-xs">Vendas Hoje</p>
                    <p className="text-white font-bold text-lg">+R$ 4.250</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={floatingAnimation}
                initial="initial"
                animate="animate"
                className="absolute -bottom-4 -right-4 bg-gradient-to-br from-secondary-500 to-primary-600 rounded-2xl p-4 shadow-xl shadow-secondary-500/30 z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-xs">Novos Clientes</p>
                    <p className="text-white font-bold text-lg">+23 hoje</p>
                  </div>
                </div>
              </motion.div>

              {/* Main Dashboard Preview */}
              <div className="bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
                  <div className="w-3 h-3 rounded-full bg-danger-500" />
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                  <span className="ml-4 text-sm text-slate-500">dashboard.smartflux.com.br</span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Vendas', value: 'R$ 12.4k', icon: DollarSign, color: 'text-success-400', bg: 'bg-success-500/10' },
                      { label: 'Produtos', value: '1.234', icon: Package, color: 'text-primary-400', bg: 'bg-primary-500/10' },
                      { label: 'Clientes', value: '567', icon: Users, color: 'text-secondary-400', bg: 'bg-secondary-500/10' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className={`${stat.bg} rounded-xl p-3 border border-slate-700/50`}
                      >
                        <stat.icon className={`w-5 h-5 ${stat.color} mb-1`} />
                        <p className="text-white font-bold">{stat.value}</p>
                        <p className="text-slate-500 text-xs">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Chart placeholder */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-400">Vendas da Semana</span>
                      <span className="text-success-400 text-sm font-medium">+12%</span>
                    </div>
                    <div className="flex items-end gap-1 h-20">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                          className="flex-1 bg-gradient-to-t from-primary-600 to-secondary-400 rounded-t"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recent sales */}
                  <div className="space-y-2">
                    {[
                      { name: 'Maria Santos', amount: 'R$ 299,00', time: 'há 2 min' },
                      { name: 'João Silva', amount: 'R$ 459,90', time: 'há 5 min' },
                    ].map((sale, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 + i * 0.1 }}
                        className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold">
                            {sale.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-slate-300 text-sm">{sale.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-success-400 font-medium text-sm">{sale.amount}</p>
                          <p className="text-slate-500 text-xs">{sale.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{ opacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-3 bg-slate-400 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 px-4 bg-slate-900/50 border-y border-slate-800/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="stat-item text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <p className="text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section id="recursos" ref={featuresRef} className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
          >
        <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-4 block">Recursos</span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          Tudo que seu negócio precisa
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Ferramentas poderosas e intuitivas para você focar no que realmente importa: vender mais.
        </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-primary-500/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
          <feature.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-slate-400">{feature.description}</p>
          </motion.div>
        ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefícios" className="py-24 px-4 bg-slate-900/30">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-4 block">Por que SmartFlux?</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Ganhe tempo, venda mais, <span className="text-gradient">lucre mais</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                Enquanto seus concorrentes perdem tempo com planilhas e papel, você automatiza 
                processos e foca em crescer seu negócio.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Clock, title: 'Economize 10h por semana', desc: 'Automatize tarefas manuais e repetitivas' },
                  { icon: Target, title: 'Aumente vendas em até 40%', desc: 'Com insights e relatórios inteligentes' },
                  { icon: Shield, title: 'Zero risco de perder dados', desc: 'Backups automáticos e criptografia total' },
                  { icon: Award, title: 'Suporte brasileiro 24/7', desc: 'Equipe pronta para ajudar quando precisar' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/20 transition-colors">
                      <item.icon className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                      <p className="text-slate-500 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-3xl p-8 border border-slate-800">
                <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary-400" />
                    Relatório de Economia
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Tempo economizado</span>
                        <span className="text-success-400 font-medium">+40h/mês</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: '85%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="h-full bg-gradient-to-r from-success-500 to-success-400 rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Redução de erros</span>
                        <span className="text-success-400 font-medium">-95%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: '95%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.4 }}
                          className="h-full bg-gradient-to-r from-primary-500 to-secondary-400 rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Aumento de vendas</span>
                        <span className="text-success-400 font-medium">+40%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: '70%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-secondary-500 to-primary-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-4 block">Depoimentos</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Empresários que transformaram seus negócios
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Veja o que nossos clientes dizem sobre o SmartFlux
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-primary-500/30 transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-warning-500 fill-warning-500" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                    {testimonial.image}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-slate-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-24 px-4 bg-slate-900/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-4 block">Planos</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Comece grátis e escale conforme seu negócio cresce
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-6 border ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-primary-900/50 to-slate-900 border-primary-500/50 scale-105'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full text-white text-sm font-medium">
                    Mais Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-slate-500">/mês</span>}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-slate-300 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 px-6 rounded-xl font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-4 block">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Perguntas Frequentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left bg-slate-900/50 hover:bg-slate-900 transition-colors"
                >
                  <span className="text-white font-medium">{faq.q}</span>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${activeFaq === i ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-slate-900/30"
                    >
                      <p className="p-4 text-slate-400">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-primary-900/50 to-secondary-900/50 rounded-3xl p-8 md:p-12 border border-primary-500/30 overflow-hidden"
          >
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Pronto para transformar seu negócio?
                </h2>
                <p className="text-slate-300 text-lg mb-8">
                  Junte-se a milhares de empresários que já estão economizando tempo e vendendo mais.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="group w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-900 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Começar agora - É grátis
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a
                    href="https://wa.me/5548999999999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold transition-all"
                  >
                    <Phone className="w-5 h-5" />
                    Falar com vendas
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">SmartFlux</span>
              </div>
              <p className="text-slate-500 text-sm">
                Sistema ERP completo para gestão de lojas e prestadores de serviço.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Atualizações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-800 text-sm text-slate-500">
            <p>© 2025 SmartFlux. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <motion.a
        href="https://wa.me/5548999999999"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-success-500 hover:bg-success-600 rounded-full flex items-center justify-center shadow-lg shadow-success-500/30 z-50"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </motion.a>
    </div>
  );
}

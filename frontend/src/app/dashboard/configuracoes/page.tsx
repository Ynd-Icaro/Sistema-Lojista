'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Building2,
  Bell,
  Mail,
  MessageCircle,
  Palette,
  Shield,
  Save,
  Loader2,
  User,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  Lock,
  Send,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { settingsApi, authApi } from '@/lib/api';
import { showApiError } from '@/lib/error-handler';
import { useAuthStore } from '@/store';

// Tipos de módulos e ações
const systemModules = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'pdv', label: 'PDV', icon: '🛒' },
  { id: 'vendas', label: 'Vendas', icon: '💰' },
  { id: 'produtos', label: 'Produtos', icon: '📦' },
  { id: 'categorias', label: 'Categorias', icon: '🏷️' },
  { id: 'clientes', label: 'Clientes', icon: '👥' },
  { id: 'ordens-servico', label: 'Ordens de Serviço', icon: '🔧' },
  { id: 'financeiro', label: 'Financeiro', icon: '💵' },
  { id: 'notas', label: 'Notas/Recibos', icon: '📄' },
  { id: 'usuarios', label: 'Usuários', icon: '👤' },
  { id: 'configuracoes', label: 'Configurações', icon: '⚙️' },
];

const actionLabels: Record<string, string> = {
  view: 'Visualizar',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
  export: 'Exportar',
};

const defaultPermissions = [
  {
    role: 'ADMIN',
    displayName: 'Administrador',
    hierarchyLevel: 1,
    permissions: systemModules.map(m => ({
      module: m.id,
      view: true,
      create: true,
      edit: true,
      delete: true,
      export: true,
    })),
  },
  {
    role: 'MANAGER',
    displayName: 'Gerente',
    hierarchyLevel: 2,
    permissions: systemModules.map(m => ({
      module: m.id,
      view: true,
      create: true,
      edit: true,
      delete: m.id !== 'usuarios' && m.id !== 'configuracoes',
      export: true,
    })),
  },
  {
    role: 'SELLER',
    displayName: 'Vendedor',
    hierarchyLevel: 3,
    permissions: systemModules.map(m => ({
      module: m.id,
      view: !['usuarios', 'configuracoes', 'financeiro'].includes(m.id),
      create: ['pdv', 'vendas', 'clientes', 'ordens-servico'].includes(m.id),
      edit: ['pdv', 'vendas', 'clientes', 'ordens-servico'].includes(m.id),
      delete: false,
      export: ['vendas', 'clientes'].includes(m.id),
    })),
  },
  {
    role: 'VIEWER',
    displayName: 'Visualizador',
    hierarchyLevel: 4,
    permissions: systemModules.map(m => ({
      module: m.id,
      view: !['usuarios', 'configuracoes'].includes(m.id),
      create: false,
      edit: false,
      delete: false,
      export: false,
    })),
  },
];

const companySchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  document: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

const notificationSchema = z.object({
  emailEnabled: z.boolean().default(true),
  whatsappEnabled: z.boolean().default(false),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFrom: z.string().optional(),
  evolutionApiUrl: z.string().optional(),
  evolutionApiKey: z.string().optional(),
  evolutionInstance: z.string().optional(),
});

const profileSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, { message: 'As senhas não coincidem', path: ['confirmPassword'] });

type CompanyForm = z.infer<typeof companySchema>;
type NotificationForm = z.infer<typeof notificationSchema>;
type ProfileForm = z.infer<typeof profileSchema>;

export default function ConfiguracoesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('company');
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any[]>(defaultPermissions);
  const [generalSettings, setGeneralSettings] = useState({
    requireApprovalForDiscounts: false,
    maxDiscountPercent: 15,
    allowNegativeStock: false,
    lowStockThreshold: 10,
    warrantyDays: 90,
    loyaltyPointsPerReal: 1,
    loyaltyPointsValue: 0.10,
  });

  // Fetch settings
  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  });

  // Fetch user profile
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.profile(),
  });

  // Company form
  const companyForm = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    values: {
      name: settingsData?.company?.name || '',
      document: settingsData?.company?.document || '',
      email: settingsData?.company?.email || '',
      phone: settingsData?.company?.phone || '',
      address: settingsData?.company?.address || '',
      city: settingsData?.company?.city || '',
      state: settingsData?.company?.state || '',
      zipCode: settingsData?.company?.zipCode || '',
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
    values: {
      emailEnabled: settingsData?.notifications?.emailEnabled ?? true,
      whatsappEnabled: settingsData?.notifications?.whatsappEnabled ?? false,
      smtpHost: settingsData?.notifications?.smtpHost || '',
      smtpPort: settingsData?.notifications?.smtpPort || 587,
      smtpUser: settingsData?.notifications?.smtpUser || '',
      smtpPassword: settingsData?.notifications?.smtpPassword || '',
      smtpFrom: settingsData?.notifications?.smtpFrom || '',
      evolutionApiUrl: settingsData?.notifications?.evolutionApiUrl || '',
      evolutionApiKey: settingsData?.notifications?.evolutionApiKey || '',
      evolutionInstance: settingsData?.notifications?.evolutionInstance || '',
    },
  });

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profileData?.name || '',
      email: profileData?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: (data: CompanyForm) => settingsApi.updateCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Dados da empresa atualizados!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar dados');
    },
  });

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: (data: NotificationForm) => settingsApi.updateNotifications(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configurações de notificação atualizadas!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar configurações');
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => authApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil atualizado!');
      profileForm.reset({
        ...profileForm.getValues(),
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar perfil');
    },
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: (data: any) => settingsApi.updatePermissions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Permissões atualizadas!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar permissões');
    },
  });

  // Reset permissions mutation
  const resetPermissionsMutation = useMutation({
    mutationFn: () => settingsApi.resetPermissions(),
    onSuccess: () => {
      setPermissions(defaultPermissions);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Permissões resetadas para o padrão!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao resetar permissões');
    },
  });

  // Test email connection mutation
  const testEmailMutation = useMutation({
    mutationFn: () => settingsApi.testEmailConnection(),
    onSuccess: (data) => {
      toast.success(data?.message || 'Email de teste enviado com sucesso! Verifique sua caixa de entrada.');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao testar conexão de email');
    },
  });

  // Test email connection with custom email mutation
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [showCustomEmailTest, setShowCustomEmailTest] = useState(false);
  
  const testCustomEmailMutation = useMutation({
    mutationFn: (email: string) => settingsApi.testEmailConnectionCustom(email),
    onSuccess: (data) => {
      toast.success(data?.message || 'Email de teste enviado com sucesso!');
      setTestEmailAddress('');
      setShowCustomEmailTest(false);
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao testar conexão de email');
    },
  });

  // Update general settings mutation
  const updateGeneralSettingsMutation = useMutation({
    mutationFn: (data: any) => settingsApi.updateGeneralSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configurações gerais atualizadas!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar configurações');
    },
  });

  // Carregar permissões do servidor
  useEffect(() => {
    if (settingsData?.permissions) {
      setPermissions(settingsData.permissions);
    }
    if (settingsData?.generalSettings) {
      setGeneralSettings(prev => ({ ...prev, ...settingsData.generalSettings }));
    }
  }, [settingsData]);

  // Handler para alteração de permissão
  const handlePermissionChange = (roleIndex: number, moduleId: string, action: string, value: boolean) => {
    const newPermissions = JSON.parse(JSON.stringify(permissions));
    const rolePermission = newPermissions[roleIndex];
    if (rolePermission) {
      const modulePermission = rolePermission.permissions.find((p: any) => p.module === moduleId);
      if (modulePermission) {
        modulePermission[action] = value;
      }
    }
    setPermissions(newPermissions);
  };

  const savePermissions = () => {
    updatePermissionsMutation.mutate({ roles: permissions });
  };

  const saveGeneralSettings = () => {
    updateGeneralSettingsMutation.mutate(generalSettings);
  };

  const isAdmin = user?.role === 'ADMIN';

  const tabs = [
    { id: 'company', label: 'Empresa', icon: Building2 },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    ...(isAdmin ? [{ id: 'permissions', label: 'Permissões', icon: Shield }] : []),
    ...(isAdmin ? [{ id: 'general', label: 'Geral', icon: Sliders }] : []),
    { id: 'profile', label: 'Meu Perfil', icon: User },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Gerencie as configurações do sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Company Settings */}
      {activeTab === 'company' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Dados da Empresa
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Informações exibidas nos documentos
              </p>
            </div>
          </div>

          <form
            onSubmit={companyForm.handleSubmit((data) => updateCompanyMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Nome da Empresa *</label>
                <input
                  {...companyForm.register('name')}
                  className={`input ${companyForm.formState.errors.name ? 'input-error' : ''}`}
                  placeholder="Nome da empresa"
                />
                {companyForm.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {companyForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">CNPJ/CPF</label>
                <input
                  {...companyForm.register('document')}
                  className="input"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="label">Telefone</label>
                <input
                  {...companyForm.register('phone')}
                  className="input"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">E-mail</label>
                <input
                  type="email"
                  {...companyForm.register('email')}
                  className={`input ${companyForm.formState.errors.email ? 'input-error' : ''}`}
                  placeholder="empresa@email.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Endereço</label>
                <input
                  {...companyForm.register('address')}
                  className="input"
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div>
                <label className="label">Cidade</label>
                <input
                  {...companyForm.register('city')}
                  className="input"
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label className="label">Estado</label>
                <select {...companyForm.register('state')} className="input">
                  <option value="">Selecione</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>

              <div>
                <label className="label">CEP</label>
                <input
                  {...companyForm.register('zipCode')}
                  className="input"
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={updateCompanyMutation.isPending}
                className="btn-primary"
              >
                {updateCompanyMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Email Settings */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Configuração de E-mail (SMTP)
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Envie documentos e notificações por e-mail
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...notificationForm.register('emailEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <form
              onSubmit={notificationForm.handleSubmit((data) =>
                updateNotificationsMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Servidor SMTP</label>
                  <input
                    {...notificationForm.register('smtpHost')}
                    className="input"
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="label">Porta</label>
                  <input
                    type="number"
                    {...notificationForm.register('smtpPort', { valueAsNumber: true })}
                    className="input"
                    placeholder="587"
                  />
                </div>

                <div>
                  <label className="label">Usuário</label>
                  <input
                    {...notificationForm.register('smtpUser')}
                    className="input"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="label">Senha</label>
                  <input
                    type="password"
                    {...notificationForm.register('smtpPassword')}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">E-mail Remetente</label>
                  <input
                    {...notificationForm.register('smtpFrom')}
                    className="input"
                    placeholder="noreply@suaempresa.com"
                  />
                </div>

                <div className="md:col-span-2 pt-2 space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => testEmailMutation.mutate()}
                      disabled={testEmailMutation.isPending}
                      className="btn-secondary flex items-center gap-2"
                    >
                      {testEmailMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Testar Conexão
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowCustomEmailTest(!showCustomEmailTest)}
                      className="btn-secondary"
                    >
                      Outro Email
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {showCustomEmailTest && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2">
                          <input
                            type="email"
                            value={testEmailAddress}
                            onChange={(e) => setTestEmailAddress(e.target.value)}
                            placeholder="Digite um email para teste"
                            className="input"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => testEmailAddress && testCustomEmailMutation.mutate(testEmailAddress)}
                              disabled={!testEmailAddress || testCustomEmailMutation.isPending}
                              className="btn-primary text-sm"
                            >
                              {testCustomEmailMutation.isPending ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                'Enviar Teste'
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomEmailTest(false);
                                setTestEmailAddress('');
                              }}
                              className="btn-secondary text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {showCustomEmailTest 
                      ? 'Digite um email personalizado para testar a conexão SMTP' 
                      : 'Testa a conexão enviando um email para seu endereço cadastrado'
                    }
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* WhatsApp Settings */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Configuração WhatsApp (Evolution API)
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Envie notificações via WhatsApp
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...notificationForm.register('whatsappEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">URL da API</label>
                <input
                  {...notificationForm.register('evolutionApiUrl')}
                  className="input"
                  placeholder="https://api.evolution.com"
                />
              </div>

              <div>
                <label className="label">API Key</label>
                <input
                  type="password"
                  {...notificationForm.register('evolutionApiKey')}
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="label">Instância</label>
                <input
                  {...notificationForm.register('evolutionInstance')}
                  className="input"
                  placeholder="nome-da-instancia"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={notificationForm.handleSubmit((data) =>
                  updateNotificationsMutation.mutate(data)
                )}
                disabled={updateNotificationsMutation.isPending}
                className="btn-primary"
              >
                {updateNotificationsMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Permissions Settings - Admin Only */}
      {activeTab === 'permissions' && isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Controle de Acesso
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Configure permissões por nível hierárquico
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => resetPermissionsMutation.mutate()}
                disabled={resetPermissionsMutation.isPending}
                className="btn-secondary"
              >
                {resetPermissionsMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5" />
                    Resetar
                  </>
                )}
              </button>
              <button
                onClick={savePermissions}
                disabled={updatePermissionsMutation.isPending}
                className="btn-primary"
              >
                {updatePermissionsMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Roles List */}
          <div className="space-y-4">
            {permissions.map((role: any, roleIndex: number) => (
              <div key={role.role} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedRole(expandedRole === role.role ? null : role.role)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                      role.hierarchyLevel === 1 ? 'bg-red-500' :
                      role.hierarchyLevel === 2 ? 'bg-amber-500' :
                      role.hierarchyLevel === 3 ? 'bg-blue-500' :
                      'bg-slate-500'
                    }`}>
                      {role.hierarchyLevel}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900 dark:text-white">{role.displayName}</p>
                      <p className="text-sm text-slate-500">
                        Nível {role.hierarchyLevel} • {role.permissions.filter((p: any) => p.view).length} módulos acessíveis
                      </p>
                    </div>
                  </div>
                  {expandedRole === role.role ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedRole === role.role && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm mt-4">
                            <thead>
                              <tr className="text-slate-500 dark:text-slate-400">
                                <th className="text-left py-2 font-medium">Módulo</th>
                                {Object.keys(actionLabels).map(action => (
                                  <th key={action} className="text-center py-2 font-medium px-3">
                                    {actionLabels[action]}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {role.permissions.map((perm: any) => {
                                const module = systemModules.find(m => m.id === perm.module);
                                return (
                                  <tr key={perm.module} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="py-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{module?.icon}</span>
                                        <span className="text-slate-700 dark:text-slate-300">{module?.label}</span>
                                      </div>
                                    </td>
                                    {Object.keys(actionLabels).map(action => (
                                      <td key={action} className="text-center py-3">
                                        <button
                                          onClick={() => handlePermissionChange(roleIndex, perm.module, action, !perm[action])}
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                            perm[action]
                                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                          }`}
                                        >
                                          {perm[action] ? <Check className="w-4 h-4" /> : <span className="w-4 h-4" />}
                                        </button>
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* General Settings - Admin Only */}
      {activeTab === 'general' && isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Sliders className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Configurações Gerais
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Parâmetros globais do sistema
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendas */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                💰 Vendas
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Aprovação para descontos</p>
                    <p className="text-xs text-slate-500">Exigir aprovação de gerente</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettings.requireApprovalForDiscounts}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, requireApprovalForDiscounts: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Desconto máximo (%)
                  </label>
                  <input
                    type="number"
                    value={generalSettings.maxDiscountPercent}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, maxDiscountPercent: Number(e.target.value) }))}
                    className="input w-32"
                  />
                </div>
              </div>
            </div>

            {/* Estoque */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                📦 Estoque
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Permitir estoque negativo</p>
                    <p className="text-xs text-slate-500">Vender sem estoque</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettings.allowNegativeStock}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, allowNegativeStock: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Alerta estoque baixo
                  </label>
                  <input
                    type="number"
                    value={generalSettings.lowStockThreshold}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, lowStockThreshold: Number(e.target.value) }))}
                    className="input w-32"
                  />
                </div>
              </div>
            </div>

            {/* Garantia */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                🛡️ Garantia
              </h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dias de garantia padrão
                </label>
                <input
                  type="number"
                  value={generalSettings.warrantyDays}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, warrantyDays: Number(e.target.value) }))}
                  className="input w-32"
                />
              </div>
            </div>

            {/* Fidelidade */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                ⭐ Programa de Fidelidade
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pontos por R$
                  </label>
                  <input
                    type="number"
                    value={generalSettings.loyaltyPointsPerReal}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, loyaltyPointsPerReal: Number(e.target.value) }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Valor do ponto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={generalSettings.loyaltyPointsValue}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, loyaltyPointsValue: Number(e.target.value) }))}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              onClick={saveGeneralSettings}
              disabled={updateGeneralSettingsMutation.isPending}
              className="btn-primary"
            >
              {updateGeneralSettingsMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Meu Perfil
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Atualize suas informações pessoais
              </p>
            </div>
          </div>

          <form
            onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}
            className="space-y-6"
          >
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profileData?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Camera className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">
                  {profileData?.name}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {profileData?.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome *</label>
                <input
                  {...profileForm.register('name')}
                  className={`input ${profileForm.formState.errors.name ? 'input-error' : ''}`}
                  placeholder="Seu nome"
                />
                {profileForm.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">E-mail *</label>
                <input
                  type="email"
                  {...profileForm.register('email')}
                  className={`input ${profileForm.formState.errors.email ? 'input-error' : ''}`}
                  placeholder="seu@email.com"
                />
                {profileForm.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Alterar Senha
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Senha Atual</label>
                  <input
                    type="password"
                    {...profileForm.register('currentPassword')}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="label">Nova Senha</label>
                  <input
                    type="password"
                    {...profileForm.register('newPassword')}
                    className={`input ${profileForm.formState.errors.newPassword ? 'input-error' : ''}`}
                    placeholder="••••••••"
                  />
                  {profileForm.formState.errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {profileForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Confirmar Senha</label>
                  <input
                    type="password"
                    {...profileForm.register('confirmPassword')}
                    className={`input ${profileForm.formState.errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="••••••••"
                  />
                  {profileForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {profileForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="btn-primary"
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Perfil
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  X,
  Loader2,
  Mail,
  Phone,
  Shield,
  MoreVertical,
  UserCheck,
  UserX,
  Key,
  UserPlus,
  Copy,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { usersApi, invitationsApi } from '@/lib/api';
import { showApiError } from '@/lib/error-handler';
import { formatDateTime } from '@/lib/utils';
import { ViewToggle, useViewMode } from '@/components/ui/ViewToggle';

const userSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'SELLER', 'VIEWER']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'MANAGER', 'SELLER', 'VIEWER']),
});

type UserForm = z.infer<typeof userSchema>;
type InviteForm = z.infer<typeof inviteSchema>;

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  SELLER: 'Vendedor',
  VIEWER: 'Visualizador',
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
  MANAGER: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  SELLER: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  VIEWER: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
};

const inviteStatusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

const inviteStatusColors: Record<string, string> = {
  PENDING: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  ACCEPTED: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  EXPIRED: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  CANCELLED: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
};

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'invites'>('all');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const { view, setView } = useViewMode('usuarios', 'list');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'SELLER',
      status: 'ACTIVE',
    },
  });

  const {
    register: registerInvite,
    handleSubmit: handleSubmitInvite,
    reset: resetInvite,
    formState: { errors: inviteErrors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'SELLER',
    },
  });

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersApi.getAll({ search, limit: 100 }).then((res) => res.data),
  });

  // Fetch invitations
  const { data: invitationsData, isLoading: invitationsLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => invitationsApi.getAll().then((res) => res.data),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: UserForm) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao criar usuário');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserForm> }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado!');
      closeModal();
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar usuário');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário excluído!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao excluir usuário');
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      usersApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status atualizado!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao atualizar status');
    },
  });

  // Create invitation mutation
  const createInviteMutation = useMutation({
    mutationFn: (data: InviteForm) => invitationsApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setInviteLink(response.data.inviteLink);
      toast.success('Convite criado com sucesso!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao criar convite');
    },
  });

  // Cancel invitation mutation
  const cancelInviteMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Convite cancelado!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao cancelar convite');
    },
  });

  // Resend invitation mutation
  const resendInviteMutation = useMutation({
    mutationFn: (id: string) => invitationsApi.resend(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setInviteLink(response.data.inviteLink);
      toast.success('Convite reenviado!');
    },
    onError: (error: any) => {
      showApiError(error, 'Erro ao reenviar convite');
    },
  });

  const openModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      reset({
        name: user.name,
        email: user.email,
        password: '',
        phone: user.phone || '',
        role: user.role,
        status: user.status || 'ACTIVE',
      });
    } else {
      setEditingUser(null);
      reset({
        role: 'SELLER',
        status: 'ACTIVE',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    reset();
  };

  const openInviteModal = () => {
    setInviteLink(null);
    resetInvite({ role: 'SELLER' });
    setShowInviteModal(true);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteLink(null);
    resetInvite();
  };

  const onSubmit = (data: UserForm) => {
    // Remove password if empty (for updates)
    const payload = { ...data };
    if (!payload.password) {
      delete payload.password;
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: payload });
    } else {
      createMutation.mutate(data);
    }
  };

  const onSubmitInvite = (data: InviteForm) => {
    createInviteMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteMutation.mutate(id);
    }
    setActiveDropdown(null);
  };

  const handleToggleActive = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleActiveMutation.mutate({ id, status: newStatus });
    setActiveDropdown(null);
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Link copiado!');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Usuários</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {usersData?.data?.length || 0} usuários cadastrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle 
            storageKey="usuarios" 
            defaultView="list" 
            onViewChange={setView}
          />
          <button onClick={openInviteModal} className="btn-secondary text-sm py-2">
            <UserPlus className="w-4 h-4" />
            Convidar
          </button>
          <button onClick={() => openModal()} className="btn-primary text-sm py-2">
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4 inline-block mr-2" />
          Todos ({(usersData?.data?.length || 0) + (invitationsData?.filter((i: any) => i.status === 'PENDING').length || 0)})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <UserCheck className="w-4 h-4 inline-block mr-2" />
          Cadastrados ({usersData?.data?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('invites')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'invites'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4 inline-block mr-2" />
          Convites Pendentes ({invitationsData?.filter((i: any) => i.status === 'PENDING').length || 0})
        </button>
      </div>

      {/* Tab: Todos (Usuários + Convites Pendentes) */}
      {activeTab === 'all' && (
        <>
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuários e convites..."
              className="input pl-9 py-2 text-sm"
            />
          </div>

          {/* Loading */}
          {(isLoading || invitationsLoading) && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          )}

          {/* Lista unificada */}
          {!isLoading && !invitationsLoading && (
            <div className="space-y-3">
              {/* Convites Pendentes */}
              {invitationsData?.filter((i: any) => i.status === 'PENDING').length > 0 && (
                <>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Convites Pendentes
                  </div>
                  {invitationsData
                    .filter((inv: any) => inv.status === 'PENDING' && (!search || inv.email.toLowerCase().includes(search.toLowerCase())))
                    .map((invite: any) => (
                      <motion.div
                        key={`invite-${invite.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900 dark:text-white">{invite.email}</p>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  Aguardando cadastro
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[invite.role]}`}>
                                  {roleLabels[invite.role]}
                                </span>
                                <span>Convidado em {formatDateTime(invite.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => resendInviteMutation.mutate(invite.id)}
                              disabled={resendInviteMutation.isPending}
                              className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                              title="Reenviar convite"
                            >
                              <RefreshCw className={`w-4 h-4 ${resendInviteMutation.isPending ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => cancelInviteMutation.mutate(invite.id)}
                              className="p-2 text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:text-slate-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20 rounded-lg"
                              title="Cancelar convite"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </>
              )}

              {/* Usuários Cadastrados */}
              {usersData?.data?.length > 0 && (
                <>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-4">
                    <UserCheck className="w-4 h-4" />
                    Usuários Cadastrados
                  </div>
                  {usersData.data
                    .filter((user: any) => !search || user.name?.toLowerCase().includes(search.toLowerCase()) || user.email?.toLowerCase().includes(search.toLowerCase()))
                    .map((user: any) => (
                      <motion.div
                        key={`user-${user.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  user.status === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                  {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                <span>{user.email}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                                  {roleLabels[user.role]}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(user.id, user.status)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.status === 'ACTIVE'
                                  ? 'text-warning-600 hover:bg-warning-50 dark:text-warning-400 dark:hover:bg-warning-900/20'
                                  : 'text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-900/20'
                              }`}
                              title={user.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                            >
                              {user.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openModal(user)}
                              className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-2 text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:text-slate-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20 rounded-lg"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </>
              )}

              {/* Empty state */}
              {(usersData?.data?.length === 0 && invitationsData?.filter((i: any) => i.status === 'PENDING').length === 0) && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Nenhum usuário encontrado
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Comece adicionando um novo usuário ou enviando um convite.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'users' && (
        <>
          {/* Busca compacta */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuários..."
              className="input pl-9 py-2 text-sm"
            />
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          )}

          {/* Card View */}
          {!isLoading && view === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usersData?.data && usersData.data.length > 0 ? (
                usersData.data.map((user: any) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-lg">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                            {roleLabels[user.role]}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'ACTIVE' 
                          ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-success-500' : 'bg-slate-400'}`} />
                        {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Phone className="w-4 h-4" />
                          {user.phone}
                        </div>
                      )}
                      {user.lastLogin && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          Último acesso: {formatDateTime(user.lastLogin)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => handleToggleActive(user.id, user.status)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.status === 'ACTIVE'
                            ? 'text-warning-600 hover:bg-warning-50 dark:text-warning-400 dark:hover:bg-warning-900/20'
                            : 'text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-900/20'
                        }`}
                        title={user.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                      >
                        {user.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openModal(user)}
                        className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-slate-600 hover:text-danger-600 hover:bg-danger-50 dark:text-slate-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full card text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Nenhum usuário encontrado
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Crie ou convide novos usuários
                  </p>
                  <button onClick={() => openModal()} className="btn-primary">
                    <Plus className="w-5 h-5" />
                    Novo Usuário
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Lista de usuários - Table View */}
          {!isLoading && view === 'list' && usersData?.data && usersData.data.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Usuário</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden sm:table-cell">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Função</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersData.data.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium text-xs">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'ACTIVE' 
                          ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-success-500' : 'bg-slate-400'}`} />
                        {user.status === 'ACTIVE' ? 'Ativo' : user.status === 'INACTIVE' ? 'Inativo' : 'Suspenso'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-end">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {activeDropdown === user.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-8 z-10 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1"
                            >
                              <button
                                onClick={() => { openModal(user); setActiveDropdown(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <Edit2 className="w-4 h-4" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleToggleActive(user.id, user.status)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                {user.status === 'ACTIVE' ? (
                                  <>
                                    <UserX className="w-4 h-4" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4" />
                                    Ativar
                                  </>
                                )}
                              </button>
                              <hr className="my-1 border-slate-200 dark:border-slate-700" />
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !isLoading && view === 'list' && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Nenhum usuário encontrado</p>
          <button onClick={() => openModal()} className="btn-primary text-sm mt-4">
            <Plus className="w-4 h-4" />
            Adicionar Usuário
          </button>
        </div>
          )}
        </>
      )}

      {/* Tab de Convites */}
      {activeTab === 'invites' && (
        <>
          {invitationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : invitationsData && invitationsData.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Função</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 hidden sm:table-cell">Expira em</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitationsData.map((invitation: any) => (
                      <tr key={invitation.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-900 dark:text-white">{invitation.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[invitation.role] || roleColors.SELLER}`}>
                            {roleLabels[invitation.role] || invitation.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${inviteStatusColors[invitation.status]}`}>
                            {inviteStatusLabels[invitation.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                            <Clock className="w-3 h-3" />
                            {new Date(invitation.expiresAt).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {invitation.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => resendInviteMutation.mutate(invitation.id)}
                                className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                                title="Reenviar convite"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => cancelInviteMutation.mutate(invitation.id)}
                                className="p-1.5 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg"
                                title="Cancelar convite"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {invitation.status === 'ACCEPTED' && (
                            <CheckCircle className="w-4 h-4 text-success-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <UserPlus className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Nenhum convite enviado</p>
              <button onClick={openInviteModal} className="btn-primary text-sm mt-4">
                <UserPlus className="w-4 h-4" />
                Convidar Usuário
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de Criação/Edição */}
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome *
                  </label>
                  <input
                    {...register('name')}
                    className={`input text-sm ${errors.name ? 'border-danger-500' : ''}`}
                    placeholder="Nome completo"
                  />
                  {errors.name && (
                    <p className="text-danger-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className={`input text-sm ${errors.email ? 'border-danger-500' : ''}`}
                    placeholder="email@exemplo.com"
                  />
                  {errors.email && (
                    <p className="text-danger-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Senha {!editingUser && '*'}
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    className={`input text-sm ${errors.password ? 'border-danger-500' : ''}`}
                    placeholder={editingUser ? 'Deixe vazio para manter a atual' : 'Mínimo 6 caracteres'}
                  />
                  {errors.password && (
                    <p className="text-danger-500 text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Função *
                  </label>
                  <select {...register('role')} className="input text-sm">
                    <option value="VIEWER">Visualizador</option>
                    <option value="SELLER">Vendedor</option>
                    <option value="MANAGER">Gerente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select {...register('status')} className="input text-sm">
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                    <option value="SUSPENDED">Suspenso</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button type="button" onClick={closeModal} className="btn-secondary text-sm">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn-primary text-sm"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingUser ? (
                      'Salvar'
                    ) : (
                      'Criar'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Convite */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Convidar Usuário
                </h2>
                <button
                  onClick={closeInviteModal}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {inviteLink ? (
                <div className="p-4 space-y-4">
                  <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4 text-center">
                    <CheckCircle className="w-10 h-10 text-success-500 mx-auto mb-2" />
                    <p className="text-success-700 dark:text-success-300 font-medium mb-1">
                      Convite criado com sucesso!
                    </p>
                    <p className="text-success-600 dark:text-success-400 text-sm">
                      Compartilhe o link abaixo com o usuário
                    </p>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Link do convite:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-700 dark:text-slate-300"
                      />
                      <button
                        onClick={copyInviteLink}
                        className="p-2 bg-primary-500 text-white rounded hover:bg-primary-600"
                        title="Copiar link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={closeInviteModal}
                    className="w-full btn-primary text-sm"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitInvite(onSubmitInvite)} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...registerInvite('email')}
                      className={`input text-sm ${inviteErrors.email ? 'border-danger-500' : ''}`}
                      placeholder="email@exemplo.com"
                    />
                    {inviteErrors.email && (
                      <p className="text-danger-500 text-xs mt-1">{inviteErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Função
                    </label>
                    <select {...registerInvite('role')} className="input text-sm">
                      <option value="SELLER">Vendedor</option>
                      <option value="MANAGER">Gerente</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="VIEWER">Visualizador</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={closeInviteModal} className="btn-secondary text-sm">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createInviteMutation.isPending}
                      className="btn-primary text-sm"
                    >
                      {createInviteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Enviar Convite
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fechar dropdown ao clicar fora */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
}

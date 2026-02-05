'use client';

import { useEffect, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store';
import { authApi } from '@/lib/api';

/**
 * Hook para garantir que a autenticação persista mesmo após limpeza de cache.
 * Verifica cookies como fonte primária e revalida tokens se necessário.
 */
export function useAuthHydration() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const { 
    isAuthenticated, 
    token, 
    user,
    setAuth, 
    logout, 
    hydrateFromCookies,
    _hasHydrated 
  } = useAuthStore();

  // Função para validar e restaurar sessão
  const validateAndRestoreSession = useCallback(async () => {
    const cookieToken = Cookies.get('token');
    const cookieRefresh = Cookies.get('refreshToken');
    
    // Se não tem token em lugar nenhum, não está autenticado
    if (!cookieToken && !cookieRefresh) {
      setIsHydrated(true);
      return false;
    }

    // Se tem token mas não tem usuário, tenta buscar perfil
    if ((cookieToken || token) && !user) {
      setIsValidating(true);
      try {
        // authApi.profile() já retorna res.data diretamente
        const userData = await authApi.profile();
        
        // Restaura a sessão completa
        setAuth(
          userData, 
          cookieToken || token || '', 
          cookieRefresh || undefined
        );
        
        setIsValidating(false);
        setIsHydrated(true);
        return true;
      } catch (error) {
        // Token inválido, tenta refresh
        if (cookieRefresh) {
          try {
            const refreshResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'https://sistema-lojista-production.up.railway.app/api'}/auth/refresh`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: cookieRefresh }),
              }
            );
            
            if (refreshResponse.ok) {
              const data = await refreshResponse.json();
              setAuth(data.user, data.accessToken, data.refreshToken);
              setIsValidating(false);
              setIsHydrated(true);
              return true;
            }
          } catch (refreshError) {
            console.error('Refresh token failed:', refreshError);
          }
        }
        
        // Falhou, limpa tudo
        logout();
        setIsValidating(false);
        setIsHydrated(true);
        return false;
      }
    }
    
    setIsHydrated(true);
    return isAuthenticated;
  }, [token, user, isAuthenticated, setAuth, logout]);

  // Hydration inicial
  useEffect(() => {
    // Primeiro, tenta hidratar do cookie
    hydrateFromCookies();

    // Valida sessão após hidratação dos cookies
    validateAndRestoreSession();
  }, [hydrateFromCookies, validateAndRestoreSession]);

  // Listener para mudanças de storage (para sincronizar entre abas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-storage' || e.key === 'backup_token') {
        hydrateFromCookies();
        validateAndRestoreSession();
      }
    };

    // Listener para quando a página volta ao foco (útil quando usuário fica muito tempo fora)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Revalida tokens quando a aba volta ao foco
        const cookieToken = Cookies.get('token');
        if (isAuthenticated && !cookieToken) {
          // Cookie foi limpo mas estava autenticado, tenta restaurar
          hydrateFromCookies();
          validateAndRestoreSession();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, hydrateFromCookies, validateAndRestoreSession]);

  return {
    isHydrated,
    isValidating,
    isAuthenticated: isHydrated ? isAuthenticated : false,
  };
}

/**
 * Provider component para usar no layout principal
 */
export function AuthHydrationCheck({ children }: { children: React.ReactNode }) {
  const { isHydrated, isValidating } = useAuthHydration();

  // Mostra loading enquanto hidrata
  if (!isHydrated || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

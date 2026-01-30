import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

// Configuração de cookies com atributos robustos
const COOKIE_OPTIONS = {
  expires: 30,
  path: '/',
  sameSite: 'lax' as const,
  // Em produção, usar secure: true
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  expires: 90,
};

// Helper para salvar token de forma segura
const saveTokenToCookie = (name: string, value: string, options = COOKIE_OPTIONS) => {
  if (typeof window !== 'undefined') {
    Cookies.set(name, value, options);
    // Backup no localStorage caso cookies falhem
    try {
      localStorage.setItem(`backup_${name}`, value);
    } catch (e) {
      console.warn('localStorage not available');
    }
  }
};

// Helper para recuperar token (cookies primeiro, depois localStorage)
const getTokenFromStorage = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Primeiro tenta cookies
  let value = Cookies.get(name);
  
  // Se não encontrou, tenta localStorage backup
  if (!value) {
    try {
      value = localStorage.getItem(`backup_${name}`) || undefined;
      // Se encontrou no backup, restaura o cookie
      if (value) {
        const options = name === 'refreshToken' ? REFRESH_COOKIE_OPTIONS : COOKIE_OPTIONS;
        Cookies.set(name, value, options);
      }
    } catch (e) {
      console.warn('localStorage not available');
    }
  }
  
  return value || null;
};

// Helper para remover token de ambos os storages
const removeTokenFromStorage = (name: string) => {
  if (typeof window !== 'undefined') {
    Cookies.remove(name, { path: '/' });
    try {
      localStorage.removeItem(`backup_${name}`);
    } catch (e) {
      console.warn('localStorage not available');
    }
  }
};

// Storage customizado que usa cookies como primary e localStorage como backup
const cookieStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    // Para auth-storage, usamos localStorage como backup do estado completo
    const cookieValue = Cookies.get(name);
    if (cookieValue) return cookieValue;
    
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    
    // Salva no cookie (máximo 4KB por cookie)
    try {
      // Se o valor for muito grande para cookie, só usa localStorage
      if (value.length < 3800) {
        Cookies.set(name, value, { ...COOKIE_OPTIONS, expires: 365 });
      }
      localStorage.setItem(name, value);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    
    Cookies.remove(name, { path: '/' });
    try {
      localStorage.removeItem(name);
    } catch (e) {
      console.warn('localStorage not available');
    }
  },
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  hydrateFromCookies: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
      
      // Hydrata o estado a partir dos cookies (útil após limpeza de localStorage)
      hydrateFromCookies: () => {
        const token = getTokenFromStorage('token');
        const refreshToken = getTokenFromStorage('refreshToken');
        
        if (token || refreshToken) {
          set({
            token,
            refreshToken,
            // Se tem token, marca como potencialmente autenticado
            // O interceptor vai validar e atualizar o user
            isAuthenticated: !!token,
          });
        }
      },
      
      setAuth: (user, token, refreshToken) => {
        // Salva tokens com configuração robusta
        saveTokenToCookie('token', token, COOKIE_OPTIONS);
        if (refreshToken) {
          saveTokenToCookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
        }
        
        // Também salva user no localStorage separado para redundância
        try {
          localStorage.setItem('auth_user', JSON.stringify(user));
        } catch (e) {
          console.warn('Could not save user to localStorage');
        }
        
        set({ 
          user, 
          token, 
          refreshToken: refreshToken || null, 
          isAuthenticated: true,
          _hasHydrated: true,
        });
      },
      
      logout: () => {
        removeTokenFromStorage('token');
        removeTokenFromStorage('refreshToken');
        
        try {
          localStorage.removeItem('auth_user');
        } catch (e) {
          console.warn('Could not remove user from localStorage');
        }
        
        set({ 
          user: null, 
          token: null, 
          refreshToken: null, 
          isAuthenticated: false 
        });
      },
      
      updateUser: (userData) => {
        set((state) => {
          const newUser = state.user ? { ...state.user, ...userData } : null;
          
          // Atualiza backup no localStorage
          if (newUser) {
            try {
              localStorage.setItem('auth_user', JSON.stringify(newUser));
            } catch (e) {
              console.warn('Could not update user in localStorage');
            }
          }
          
          return { user: newUser };
        });
      },
      
      setTokens: (token, refreshToken) => {
        saveTokenToCookie('token', token, COOKIE_OPTIONS);
        if (refreshToken) {
          saveTokenToCookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
        }
        set({ token, refreshToken: refreshToken || null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => cookieStorage),
      onRehydrateStorage: () => (state) => {
        // Após reidratar do storage, verifica cookies como fallback
        if (state) {
          state.setHasHydrated(true);
          
          // Se não tem token mas existe no cookie, recupera
          if (!state.token) {
            const cookieToken = getTokenFromStorage('token');
            const cookieRefresh = getTokenFromStorage('refreshToken');
            
            if (cookieToken) {
              state.setTokens(cookieToken, cookieRefresh || undefined);
              
              // Tenta recuperar user do backup
              try {
                const userBackup = localStorage.getItem('auth_user');
                if (userBackup) {
                  const user = JSON.parse(userBackup);
                  state.updateUser(user);
                }
              } catch (e) {
                console.warn('Could not restore user from backup');
              }
            }
          }
        }
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  discount: number;
  addItem: (item: Omit<CartItem, 'id' | 'total'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemDiscount: (id: string, discount: number) => void;
  removeItem: (id: string) => void;
  setCustomer: (customerId: string | null, customerName: string | null) => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  customerName: null,
  discount: 0,
  
  addItem: (item) => {
    const existingItem = get().items.find((i) => i.productId === item.productId);
    
    if (existingItem) {
      set((state) => ({
        items: state.items.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                total: (i.quantity + item.quantity) * i.price * (1 - i.discount / 100),
              }
            : i
        ),
      }));
    } else {
      const newItem: CartItem = {
        ...item,
        id: crypto.randomUUID(),
        total: item.quantity * item.price * (1 - item.discount / 100),
      };
      set((state) => ({ items: [...state.items, newItem] }));
    }
  },
  
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id
          ? { ...i, quantity, total: quantity * i.price * (1 - i.discount / 100) }
          : i
      ),
    }));
  },
  
  updateItemDiscount: (id, discount) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id
          ? { ...i, discount, total: i.quantity * i.price * (1 - discount / 100) }
          : i
      ),
    }));
  },
  
  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },
  
  setCustomer: (customerId, customerName) => {
    set({ customerId, customerName });
  },
  
  setDiscount: (discount) => {
    set({ discount });
  },
  
  clearCart: () => {
    set({ items: [], customerId: null, customerName: null, discount: 0 });
  },
  
  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.total, 0);
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().discount;
    return subtotal * (1 - discount / 100);
  },
}));

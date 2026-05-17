import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';
import { MOCK_USERS, MOCK_PASSWORDS } from '../lib/mockData';
import { generateId, validateEmail, validatePassword } from '../lib/utils';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  inviteCode?: string;
}

// Simulate JWT token generation
function generateToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: userId, iat: Date.now(), exp: Date.now() + 86400000 }));
  const signature = btoa(`${userId}-${Date.now()}`);
  return `${header}.${payload}.${signature}`;
}

// In-memory user registry (extends mock data)
let userRegistry: User[] = [...MOCK_USERS];
let passwordRegistry: Record<string, string> = { ...MOCK_PASSWORDS };

export { userRegistry, passwordRegistry };

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        await new Promise((r) => setTimeout(r, 800)); // simulate network

        const user = userRegistry.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
          set({ isLoading: false, error: 'Credenciales incorrectas.' });
          return { success: false, error: 'Credenciales incorrectas.' };
        }

        if (user.status === 'blocked') {
          set({ isLoading: false, error: 'Tu cuenta está bloqueada. Contacta con el administrador.' });
          return { success: false, error: 'Tu cuenta está bloqueada.' };
        }

        const storedPassword = passwordRegistry[user.email];
        if (storedPassword !== password) {
          set({ isLoading: false, error: 'Credenciales incorrectas.' });
          return { success: false, error: 'Credenciales incorrectas.' };
        }

        const token = generateToken(user.id);
        const updatedUser = { ...user, lastLogin: new Date() };
        userRegistry = userRegistry.map((u) => (u.id === user.id ? updatedUser : u));

        set({ user: updatedUser, token, isAuthenticated: true, isLoading: false, error: null });
        return { success: true };
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        await new Promise((r) => setTimeout(r, 1000));

        if (!validateEmail(data.email)) {
          set({ isLoading: false });
          return { success: false, error: 'Correo electrónico inválido.' };
        }

        const passValidation = validatePassword(data.password);
        if (!passValidation.valid) {
          set({ isLoading: false });
          return { success: false, error: passValidation.errors[0] };
        }

        const exists = userRegistry.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
        if (exists) {
          set({ isLoading: false });
          return { success: false, error: 'Ya existe una cuenta con ese correo.' };
        }

        const newUser: User = {
          id: generateId(),
          name: data.name,
          email: data.email,
          role: data.role,
          status: 'active',
          createdAt: new Date(),
          classIds: [],
        };

        userRegistry = [...userRegistry, newUser];
        passwordRegistry[newUser.email] = data.password;

        const token = generateToken(newUser.id);
        set({ user: newUser, token, isAuthenticated: true, isLoading: false, error: null });
        return { success: true };
      },

      forgotPassword: async (email) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 800));
        const user = userRegistry.find((u) => u.email.toLowerCase() === email.toLowerCase());
        set({ isLoading: false });
        if (!user) return { success: false, error: 'No existe ninguna cuenta con ese correo.' };
        // In a real app, send reset email via backend
        return { success: true };
      },

      resetPassword: async (_token, password) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 800));
        const passValidation = validatePassword(password);
        if (!passValidation.valid) {
          set({ isLoading: false });
          return { success: false, error: passValidation.errors[0] };
        }
        set({ isLoading: false });
        return { success: true };
      },

      updateProfile: async (data) => {
        const currentUser = get().user;
        if (!currentUser) return { success: false, error: 'No autenticado.' };
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 600));
        const updated = { ...currentUser, ...data };
        userRegistry = userRegistry.map((u) => (u.id === updated.id ? updated : u));
        set({ user: updated, isLoading: false });
        return { success: true };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'edusync-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

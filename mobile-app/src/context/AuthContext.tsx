import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, TOKEN_KEY, USER_KEY } from '../constants/api';
import {
  requestPermissionAndGetToken,
  onTokenRefresh,
} from '../services/firebase';

// ----- Types -----
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'driver';
  isAvailable: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'client' | 'driver';
}

// ----- Context -----
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => { },
  register: async () => { },
  logout: async () => { },
  clearError: () => { },
});

// ----- Provider -----
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Send FCM token to server
  const registerFcmToken = useCallback(async () => {
    const token = await requestPermissionAndGetToken();
    if (token) {
      try {
        await api.patch('/auth/fcm-token', { fcmToken: token });
      } catch {
        // Non-fatal: continue even if FCM token update fails
      }
    }
  }, []);

  // Session restoration on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Validate token by hitting /me
        const { data } = await api.get('/auth/me');
        if (data.success) {
          setUser(data.user);
          await registerFcmToken();
        }
      } catch {
        // Token invalid or expired — clear it
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [registerFcmToken]);

  // FCM token refresh listener
  useEffect(() => {
    const unsubscribe = onTokenRefresh((newToken) => {
      api.patch('/auth/fcm-token', { fcmToken: newToken }).catch(() => { });
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("going to call login api <<<<<<");
      console.log(`email <<<<<<${email}<<`);
      console.log(`password <<<<<<${password}<<`);
      const { data } = await api.post('/auth/login', { email, password });
      console.log("login api response <<<<<<", data);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      await registerFcmToken();
    } catch (e: unknown) {
      console.log("login api error <<<<<<", e);
      setError(e instanceof Error ? e.message : 'Login failed.');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [registerFcmToken]);

  const register = useCallback(async (formData: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("formdata <<<<<<", formData);
      const { data } = await api.post('/auth/register', formData);
      console.log("register api response <<<<<<", data);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      await registerFcmToken();
    } catch (e: unknown) {
      console.log("register api error <<<<<<", e);
      setError(e instanceof Error ? e.message : 'Registration failed.');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [registerFcmToken]);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

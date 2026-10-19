'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../types/auth';
import { getAuthProvider } from '../services/auth/auth-factory';

let globalUser: AuthUser | null = null;
let globalLoading = true;
let isInitialized = false;
const listeners = new Set<(user: AuthUser | null) => void>();

function notifyUserChange(user: AuthUser | null) {
  globalUser = user;
  globalLoading = false;
  listeners.forEach((listener) => listener(user));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('quiz-auth-change', { detail: user }));
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(globalUser);
  const [loading, setLoading] = useState<boolean>(globalLoading);
  const [error, setError] = useState<string | null>(null);

  const authProvider = getAuthProvider();

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await authProvider.getUser();
      notifyUserChange(currentUser);
      setUser(currentUser);
    } catch {
      notifyUserChange(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [authProvider]);

  useEffect(() => {
    const listener = (u: AuthUser | null) => {
      setUser(u);
      setLoading(false);
    };
    listeners.add(listener);

    if (!isInitialized) {
      isInitialized = true;
      loadUser();
    } else {
      setUser(globalUser);
      setLoading(globalLoading);
    }

    return () => {
      listeners.delete(listener);
    };
  }, [loadUser]);

  const login = async (credentials: { email: string; password: string }) => {
    setError(null);
    try {
      const result = await authProvider.login(credentials);
      notifyUserChange(result.user);
      setUser(result.user);
      return result;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (data: { email: string; password: string; name?: string; displayName?: string; locale?: string }) => {
    setError(null);
    try {
      const result = await authProvider.register(data);
      if (result.user) {
        notifyUserChange(result.user);
        setUser(result.user);
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const verifyEmail = async (token: string) => {
    setError(null);
    return authProvider.verifyEmail(token);
  };

  const logout = async () => {
    try {
      await authProvider.logout();
    } finally {
      notifyUserChange(null);
      setUser(null);
    }
  };

  const requestPasswordReset = async (email: string) => {
    setError(null);
    return authProvider.requestPasswordReset(email);
  };

  const resetPassword = async (data: { token: string; newPassword: string }) => {
    setError(null);
    return authProvider.resetPassword(data);
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    verifyEmail,
    logout,
    requestPasswordReset,
    resetPassword,
    refreshUser: loadUser,
  };
}


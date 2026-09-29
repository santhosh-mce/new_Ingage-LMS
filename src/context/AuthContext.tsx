"use client";
import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { UserProfile } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setCredentials,
  updateUserProfile,
  fetchCurrentUser,
  logoutUserThunk,
  clearCredentials,
} from '../store/slices/authSlice';

export interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  token: string | null;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<UserProfile>) => void;
  refreshUser: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user: currentUser, token, isAuthenticated, loading: isAuthLoading } = useAppSelector(
    (state) => state.auth
  );

  // Initial validation & refresh on mount
  useEffect(() => {
    const existingToken = localStorage.getItem('ingage_token');
    if (existingToken) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  // Synchronize across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ingage_token' || e.key === 'ingage_user') {
        const storedToken = localStorage.getItem('ingage_token');
        const storedUser = localStorage.getItem('ingage_user');
        if (storedToken && storedUser) {
          try {
            const user = JSON.parse(storedUser);
            dispatch(setCredentials({ token: storedToken, user }));
          } catch {
            // ignore
          }
        } else if (!storedToken) {
          dispatch(clearCredentials());
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch]);

  const login = useCallback(
    (newToken: string, userProfile: UserProfile) => {
      dispatch(setCredentials({ token: newToken, user: userProfile }));
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUserThunk());
  }, [dispatch]);

  const updateUser = useCallback(
    (updates: Partial<UserProfile>) => {
      dispatch(updateUserProfile(updates));
    },
    [dispatch]
  );

  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    const result = await dispatch(fetchCurrentUser());
    if (fetchCurrentUser.fulfilled.match(result)) {
      return result.payload;
    }
    return null;
  }, [dispatch]);

  const value: AuthContextType = {
    currentUser,
    isAuthenticated,
    isAuthLoading,
    token,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

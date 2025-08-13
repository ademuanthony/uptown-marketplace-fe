'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User as FirebaseUser } from 'firebase/auth';
import { authService, User, AuthResponse, RegisterCredentials } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  updateUser: (updates: Partial<User>) => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async firebaseUser => {
      console.info('Auth state changed:', firebaseUser?.uid);
      setFirebaseUser(firebaseUser);
      setAuthError(null); // Clear any previous auth errors

      if (firebaseUser) {
        try {
          const user = await authService.getCurrentUser();
          setUser(user);
          setAuthError(null);
        } catch (error: unknown) {
          console.error('Error getting current user:', error);

          // Check if this is an authorization error that requires logout
          const errorMessage = (error as Error)?.message || '';
          const isAuthError =
            errorMessage.toLowerCase().includes('user not registered') ||
            errorMessage.toLowerCase().includes('user not found') ||
            errorMessage.toLowerCase().includes('unauthorized') ||
            errorMessage.toLowerCase().includes('invalid token');

          if (isAuthError) {
            console.warn('Authorization error detected, signing out user to prevent infinite loop');
            setAuthError(errorMessage);

            // Sign out to prevent infinite retries
            try {
              await authService.signOut();
            } catch (signOutError) {
              console.error('Error during automatic signout:', signOutError);
            }

            // Don't redirect here, let the auth state change handle it
            return;
          }

          setUser(null);
        }
      } else {
        setUser(null);
        setAuthError(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setAuthError(null); // Clear any previous errors
    try {
      const response = await authService.signIn({ email, password });
      setUser(response.user);
      setAuthError(null);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    setLoading(true);
    setAuthError(null); // Clear any previous errors
    try {
      const response = await authService.signUp(credentials);
      setUser(response.user);
      setAuthError(null);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setFirebaseUser(null);
      setAuthError(null); // Clear any auth errors
      // Redirect to home page after successful logout
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    try {
      return await authService.refreshToken();
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };

  const updateUser = (updates: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const clearAuthError = (): void => {
    setAuthError(null);
  };

  const value = {
    user,
    firebaseUser,
    loading,
    authError,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

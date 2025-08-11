'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User as FirebaseUser } from 'firebase/auth';
import { authService, User, LoginCredentials, RegisterCredentials } from '@/services/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const router = useRouter();

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = authService.onAuthStateChanged(
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            // Get user data from backend
            const user = await authService.getCurrentUser();
            if (user) {
              setAuthState({
                user,
                isLoading: false,
                isAuthenticated: true,
              });
            } else {
              // If no user data from backend, sign out
              await authService.signOut();
              setAuthState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
              });
            }
          } catch (error) {
            console.error('Error getting user data:', error);
            // In case of backend errors, try to maintain auth state with cached data
            const cachedUser = localStorage.getItem('user');
            const cachedToken = localStorage.getItem('auth_token');

            if (cachedUser && cachedToken) {
              console.warn('Using cached user data due to backend error');
              setAuthState({
                user: JSON.parse(cachedUser),
                isLoading: false,
                isAuthenticated: true,
              });
            } else {
              setAuthState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
              });
            }
          }
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      },
    );

    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { user, token } = await authService.signIn(credentials);
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
      return { user, token };
    } catch (error) {
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      const { user, token } = await authService.signUp(credentials);
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
      return { user, token };
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      // Redirect to home page after successful logout
      router.push('/');
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { user, token } = await authService.signInWithGoogle();
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
      return { user, token };
    } catch (error) {
      throw error;
    }
  };

  const loginWithFacebook = async () => {
    try {
      const { user, token } = await authService.signInWithFacebook();
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
      return { user, token };
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      return await authService.refreshToken();
    } catch (error) {
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    setAuthState(prev => ({
      ...prev,
      user: updatedUser,
    }));
  };

  return {
    ...authState,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithFacebook,
    resetPassword,
    refreshToken,
    updateUser,
  };
}

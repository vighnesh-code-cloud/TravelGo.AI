import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: (override?: Partial<User>) => Promise<User>;
  signInWithEmail: (email: string, name?: string) => Promise<User>;
  signOut: () => Promise<void>;
  isModalOpen: boolean;
  openAuthModal: (onSuccessCallback?: () => void) => void;
  closeAuthModal: () => void;
  pendingSuccessAction: (() => void) | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingSuccessAction, setPendingSuccessAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = authService.subscribe((u) => {
      setUser(u);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const openAuthModal = (onSuccessCallback?: () => void) => {
    if (onSuccessCallback) {
      setPendingSuccessAction(() => onSuccessCallback);
    } else {
      setPendingSuccessAction(null);
    }
    setIsModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsModalOpen(false);
    setPendingSuccessAction(null);
  };

  const signInWithGoogle = async (override?: Partial<User>) => {
    const signedUser = await authService.signInWithGoogle(override);
    if (pendingSuccessAction) {
      pendingSuccessAction();
      setPendingSuccessAction(null);
    }
    setIsModalOpen(false);
    return signedUser;
  };

  const signInWithEmail = async (email: string, name?: string) => {
    const signedUser = await authService.signInWithEmail(email, name);
    if (pendingSuccessAction) {
      pendingSuccessAction();
      setPendingSuccessAction(null);
    }
    setIsModalOpen(false);
    return signedUser;
  };

  const signOut = async () => {
    await authService.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        isModalOpen,
        openAuthModal,
        closeAuthModal,
        pendingSuccessAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

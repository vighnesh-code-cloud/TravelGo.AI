/**
 * Authentication Service for TravelGo.AI
 * Provides a clean architecture ready for Google OAuth integration in production,
 * with reactive session management.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: 'google' | 'email';
  createdAt: string;
}

type AuthListener = (user: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: Set<AuthListener> = new Set();
  private storageKey = 'travelgo_auth_user';

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      } else {
        this.currentUser = null;
      }
    } catch {
      this.currentUser = null;
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.currentUser));
  }

  /**
   * Google Sign-In Flow
   * Designed to connect with Google OAuth 2.0 Client ID upon deployment.
   * In local/development mode, prompts or completes standard Google identity profile.
   */
  public async signInWithGoogle(userOverride?: Partial<User>): Promise<User> {
    // If Google OAuth Client ID is configured in the future, standard Google Identity Services
    // tokenClient / credential response will populate this.
    const googleUser: User = {
      id: userOverride?.id || `google-${Date.now()}`,
      name: userOverride?.name || 'Traveler',
      email: userOverride?.email || 'traveler@gmail.com',
      avatarUrl: userOverride?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userOverride?.name || 'Traveler')}`,
      provider: 'google',
      createdAt: new Date().toISOString()
    };

    this.currentUser = googleUser;
    localStorage.setItem(this.storageKey, JSON.stringify(googleUser));
    this.notify();
    return googleUser;
  }

  /**
   * Email/Passwordless Sign-In
   */
  public async signInWithEmail(email: string, name?: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || cleanEmail.split('@')[0] || 'Traveler';

    const emailUser: User = {
      id: `email-${Date.now()}`,
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      email: cleanEmail,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
      provider: 'email',
      createdAt: new Date().toISOString()
    };

    this.currentUser = emailUser;
    localStorage.setItem(this.storageKey, JSON.stringify(emailUser));
    this.notify();
    return emailUser;
  }

  /**
   * Sign Out
   */
  public async signOut(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
    this.notify();
  }
}

export const authService = new AuthService();

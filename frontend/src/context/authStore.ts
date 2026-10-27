import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  institute_id?: string | null;
  designation?: string | null;
  preferred_language?: string;
  mfa_enabled?: boolean;
}

export interface MFAChallenge {
  challenge_id: string;
  demo_otp_hint?: string | null;
  email: string;
  message: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaChallenge: MFAChallenge | null;
  sessionExpiresAt: number | null;
  isSessionExpiring: boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean; demoHint?: string }>;
  verifyOtp: (otpCode: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  extendSession: () => Promise<void>;
  dismissExpiryWarning: () => void;
  checkSessionExpiry: () => void;
}

const API_BASE = 'http://localhost:8000';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try {
      const saved = localStorage.getItem('satyapan_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('satyapan_token') || null,
  isAuthenticated: !!localStorage.getItem('satyapan_token'),
  isLoading: false,
  mfaChallenge: null,
  sessionExpiresAt: (() => {
    const saved = localStorage.getItem('satyapan_expiry');
    return saved ? parseInt(saved, 10) : null;
  })(),
  isSessionExpiring: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, mfaChallenge: null });
    try {
      const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Authentication failed. Please check your credentials.');
      }

      const data = await resp.json();

      // Check if MFA is required
      if (data.mfa_required) {
        const challenge: MFAChallenge = {
          challenge_id: data.challenge_id,
          demo_otp_hint: data.demo_otp_hint,
          email,
          message: data.message
        };
        set({ mfaChallenge: challenge, isLoading: false });
        return { mfaRequired: true, demoHint: data.demo_otp_hint };
      }

      // Direct login (non-MFA role)
      const token = data.access_token;
      const userProfile: UserProfile = {
        id: data.user_id,
        name: data.name,
        email,
        role: data.role,
        institute_id: data.institute_id
      };

      const expiresAt = Date.now() + 15 * 60 * 1000;
      localStorage.setItem('satyapan_token', token);
      localStorage.setItem('satyapan_user', JSON.stringify(userProfile));
      localStorage.setItem('satyapan_expiry', expiresAt.toString());

      set({
        user: userProfile,
        token,
        isAuthenticated: true,
        isLoading: false,
        sessionExpiresAt: expiresAt,
        isSessionExpiring: false
      });

      return { mfaRequired: false };
    } catch (err: any) {
      set({ isLoading: false });
      throw err;
    }
  },

  verifyOtp: async (otpCode: string) => {
    const { mfaChallenge } = get();
    if (!mfaChallenge) {
      throw new Error('No pending MFA challenge found. Please sign in again.');
    }

    set({ isLoading: true });
    try {
      const resp = await fetch(`${API_BASE}/auth/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: mfaChallenge.challenge_id,
          otp_code: otpCode.trim()
        })
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Incorrect 6-digit OTP verification code.');
      }

      const data = await resp.json();
      const token = data.access_token;
      const userProfile: UserProfile = {
        id: data.user_id,
        name: data.name,
        email: mfaChallenge.email,
        role: data.role,
        institute_id: data.institute_id
      };

      const expiresAt = Date.now() + 15 * 60 * 1000;
      localStorage.setItem('satyapan_token', token);
      localStorage.setItem('satyapan_user', JSON.stringify(userProfile));
      localStorage.setItem('satyapan_expiry', expiresAt.toString());

      set({
        user: userProfile,
        token,
        isAuthenticated: true,
        isLoading: false,
        mfaChallenge: null,
        sessionExpiresAt: expiresAt,
        isSessionExpiring: false
      });

      return userProfile;
    } catch (err: any) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const { token } = get();
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('satyapan_token');
      localStorage.removeItem('satyapan_user');
      localStorage.removeItem('satyapan_expiry');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        mfaChallenge: null,
        sessionExpiresAt: null,
        isSessionExpiring: false
      });
    }
  },

  extendSession: async () => {
    try {
      const resp = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      });
      if (resp.ok) {
        const data = await resp.json();
        const newToken = data.access_token;
        const expiresAt = Date.now() + 15 * 60 * 1000;
        localStorage.setItem('satyapan_token', newToken);
        localStorage.setItem('satyapan_expiry', expiresAt.toString());
        set({
          token: newToken,
          sessionExpiresAt: expiresAt,
          isSessionExpiring: false
        });
      }
    } catch {
      // If refresh fails, let user continue or logout
    }
  },

  dismissExpiryWarning: () => {
    set({ isSessionExpiring: false });
  },

  checkSessionExpiry: () => {
    const { sessionExpiresAt, isAuthenticated } = get();
    if (!isAuthenticated || !sessionExpiresAt) return;

    const remainingMs = sessionExpiresAt - Date.now();
    // Warn if <= 60 seconds (60000ms) and > 0
    if (remainingMs > 0 && remainingMs <= 60000) {
      set({ isSessionExpiring: true });
    } else if (remainingMs <= 0) {
      // Expired
      get().logout();
    }
  }
}));

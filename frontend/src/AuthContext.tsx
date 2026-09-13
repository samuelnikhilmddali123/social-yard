import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, onAuthStateChanged, logout as firebaseLogout, loginWithGoogle as firebaseLoginWithGoogle } from './firebase';
import API from './services/api';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  profileCompleted?: boolean;
  authProvider?: string;
  companyName?: string;
  gst?: string;
  businessType?: string;
  profilePic?: string;
  photoURL?: string;
  hasUsedFreeTrial?: boolean;
};

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  setAuthData: (token: string, user: AppUser) => void;
  updateUser: (user: AppUser) => void;
  refreshUser: () => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const persistUser = useCallback((newUser: AppUser) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('userRole', newUser.role || '');
    localStorage.setItem('userName', newUser.name || '');
    localStorage.setItem('userEmail', newUser.email || '');
    if (newUser.phone) localStorage.setItem('userPhone', newUser.phone);
    setUser(newUser);
  }, []);

  const refreshUser = useCallback(async (): Promise<AppUser | null> => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return null;
    try {
      const res = await API.get('/auth/me');
      const updated = res.data.user as AppUser;
      persistUser(updated);
      return updated;
    } catch {
      return null;
    }
  }, [persistUser]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserStr = localStorage.getItem('user');

    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      API.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      if (storedUserStr) {
        try {
          setUser(JSON.parse(storedUserStr));
        } catch (e) {
          console.error('Failed to parse stored user', e);
        }
      }
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, () => {});
    return () => unsubscribe();
  }, [refreshUser]);

  useEffect(() => {
    if (isAuthenticated && token && user && user.role === 'admin') {
      const registerFCM = async () => {
        try {
          const { requestFcmToken } = await import('./firebase');
          const fcmToken = await requestFcmToken();
          if (fcmToken) {
            await API.post('/auth/save-fcm-token', { token: fcmToken });
            console.log('✅ FCM token registered on backend:', fcmToken);
          }
        } catch (err) {
          console.warn('FCM registration skipped or failed:', err);
        }
      };
      const timer = setTimeout(registerFCM, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, token, user]);

  const setAuthData = (newToken: string, newUser: AppUser) => {
    localStorage.setItem('token', newToken);
    persistUser(newUser);
    setToken(newToken);
    setIsAuthenticated(true);
    API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const updateUser = (newUser: AppUser) => {
    persistUser(newUser);
  };

  const loginWithGoogle = async () => {
    try {
      return await firebaseLoginWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
    } catch (error) {
      console.error('Firebase logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userPhone');

      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      delete API.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        loginWithGoogle,
        logout,
        setAuthData,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/** Regular users must complete profile before booking flows. */
export function needsProfileCompletion(user: AppUser | null): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'government') return false;
  return user.profileCompleted === false;
}

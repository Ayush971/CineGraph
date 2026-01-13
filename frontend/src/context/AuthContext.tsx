import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../services/api';
import type { User, UserLogin, UserCreate } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      authAPI
        .getMe()
        .then((response) => {
          setUser(response.data.user);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: UserLogin) => {
    const response = await authAPI.login(credentials);
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    setUser(userData);
  };

  const register = async (userData: UserCreate) => {
    const response = await authAPI.register(userData);
    const { access_token, user: newUser } = response.data;
    
    localStorage.setItem('token', access_token);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
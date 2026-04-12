import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';
import { api } from '../src/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  simulateLogin: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return (parsed.uid && parsed.role) ? parsed : null;
      } catch { return null; }
    }
    return null;
  });
  
  const [loading, setLoading] = useState(false);

  const login = async (identifier: string, password: string) => {
    try {
      const result = await api.post('/auth/login', {
        username: identifier,
        password,
      });

      // Store JWT token
      if (result.token) {
        localStorage.setItem('token', result.token);
      }

      if (result.type === 'staff') {
        const foundUser: User = {
          uid: result.user.uid || String(result.user.id),
          name: result.user.name || result.user.full_name,
          email: result.user.email || '',
          role: result.user.role,
          clinicIds: result.user.clinicIds || [],
          isActive: result.user.isActive !== false,
          createdAt: Date.now(),
          createdBy: 'system',
          updatedAt: Date.now(),
          updatedBy: 'system',
          isArchived: false,
        };

        if (!foundUser.isActive) {
          throw new Error('account_inactive');
        }

        localStorage.setItem('user', JSON.stringify(foundUser));
        setUser(foundUser);
        return;
      }

      throw new Error('invalid_credentials');
    } catch (error: any) {
      if (error.message?.includes('Invalid credentials') || error.message?.includes('401')) {
        throw new Error('invalid_credentials');
      }
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const simulateLogin = (newUser: User) => {
    if (window.location.hostname !== 'localhost') return;
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, simulateLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
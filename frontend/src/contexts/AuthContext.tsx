import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types/user';
import tokenService from '../services/tokenService';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => tokenService.getToken() ?? null);
  const [user, setUser] = useState<User | null>(null);

  const login = (newToken: string, userData: User): void => {
    setToken(newToken);
    setUser(userData);
    tokenService.setToken(newToken);
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
    tokenService.removeToken();
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
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
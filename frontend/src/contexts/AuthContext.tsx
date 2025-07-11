import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types/user';
import tokenService from '../services/tokenService';
import { GoogleOAuthProvider } from '@react-oauth/google';
import configService from '../services/configService';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasGoogleAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => tokenService.getToken() ?? null);
  const [user, setUser] = useState<User | null>(null);
  const [googleClientId, setGoogleClientId] = useState<string>('');

  useEffect(() => {
    const loadGoogleConfig = async () => {
      try {
        const config = await configService.getConfig();
        setGoogleClientId(config.googleClientId);
      } catch (error) {
        console.error('Failed to fetch Google Client ID:', error);
      }
    };

    loadGoogleConfig();
  }, []);

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

  const authContextValue = { 
    token, 
    user, 
    login, 
    logout,
    hasGoogleAuth: !!googleClientId 
  };

  // if Google Client ID, only render the normal interface
  if (!googleClientId) {
    return (
      <AuthContext.Provider value={authContextValue}>
        {children}
      </AuthContext.Provider>
    );
  }

  // if Google Client ID, render the interface with Google OAuth
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthContext.Provider value={authContextValue}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
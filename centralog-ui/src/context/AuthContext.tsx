import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthResponse } from '../services/api';

interface AuthContextType {
  user: Omit<AuthResponse, 'token'> | null;
  token: string | null;
  isAuthenticated: boolean;
  loginSession: (authData: AuthResponse) => void;
  logoutSession: () => void;
  hasClearance: (allowedRoles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Omit<AuthResponse, 'token'> | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('cl_session_token');
    const savedUserData = sessionStorage.getItem('cl_user_metadata');

    if (savedToken && savedUserData) {
      setToken(savedToken);
      setUser(JSON.parse(savedUserData));
    }
  }, []);

  const loginSession = (authData: AuthResponse) => {
    const { token: jwtToken, ...metaData } = authData;
    
    sessionStorage.setItem('cl_session_token', jwtToken);
    sessionStorage.setItem('cl_user_metadata', JSON.stringify(metaData));
    
    setToken(jwtToken);
    setUser(metaData);
  };

  const logoutSession = () => {
    sessionStorage.removeItem('cl_session_token');
    sessionStorage.removeItem('cl_user_metadata');
    setToken(null);
    setUser(null);
  };

  const hasClearance = (allowedRoles: string[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.roleName);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      loginSession,
      logoutSession,
      hasClearance
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth loop execution failure: Scope must reside within a valid AuthProvider wrapper.');
  }
  return context;
};
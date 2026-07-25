import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isAuthenticated: boolean;
  serverUrl: string | null;
}

interface AuthContextType extends AuthState {
  login: (serverUrl: string, username?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    serverUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const url = await AsyncStorage.getItem('serverUrl');
        if (url) {
          setAuthState({ isAuthenticated: true, serverUrl: url });
        }
      } catch (error) {
        console.error('Error loading auth data', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const login = async (serverUrl: string, username?: string, password?: string) => {
    try {
      await AsyncStorage.setItem('serverUrl', serverUrl);
      if (username) await AsyncStorage.setItem('username', username);
      if (password) await AsyncStorage.setItem('password', password);

      setAuthState({ isAuthenticated: true, serverUrl });
    } catch (error) {
      console.error('Error saving auth data', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('serverUrl');
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('password');
      setAuthState({ isAuthenticated: false, serverUrl: null });
    } catch (error) {
      console.error('Error removing auth data', error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

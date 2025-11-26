import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  role: string;
  avatar?: string | null;
};

type AuthContextType = {
  user: Profile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@slipsgutta_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sjekk om bruker er logget inn ved oppstart
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase er ikke konfigurert');
    }

    try {
      // Hent bruker fra databasen
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, password, role, avatar')
        .eq('username', username)
        .single();

      if (error || !data) {
        throw new Error('Feil brukernavn eller passord');
      }

      // Verifiser passord (enkel sammenligning)
      // TODO: I produksjon bør dette bruke bcrypt eller lignende
      if (data.password !== password) {
        throw new Error('Feil brukernavn eller passord');
      }

      // Opprett bruker-objekt uten passord
      const userProfile: Profile = {
        id: data.id,
        username: data.username,
        display_name: data.display_name,
        role: data.role,
        avatar: data.avatar,
      };

      // Lagre bruker i state og AsyncStorage
      setUser(userProfile);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth må brukes innenfor AuthProvider');
  }
  return context;
}

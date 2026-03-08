
import React, { createContext, useState, useContext, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);
  const [user, setUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setIsAuthenticated(pb.authStore.isValid);
      setUser(model);
    });

    setLoading(false);

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      setIsAuthenticated(true);
      setUser(authData.record);
      return authData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('auth_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.error('[Auth Init Error]:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { user: userData, token: jwtToken } = res.data;
    
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('auth_token', jwtToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    const { user: newUser, token: jwtToken } = res.data;
    setUser(newUser);
    setToken(jwtToken);
    localStorage.setItem('auth_token', jwtToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const updateProfile = async (profileData) => {
    const res = await authService.updateMe(profileData);
    const updatedUser = res.data.user;
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    if (Array.isArray(roles)) return roles.includes(user.role);
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        role: user?.role,
        register,
        login,
        logout,
        updateProfile,
        hasRole,
      }}
    >
      {children}
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

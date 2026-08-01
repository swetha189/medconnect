import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('medconnect_token');
      const savedUser = localStorage.getItem('medconnect_user');

      if (token && savedUser) {
        try {
          // Verify with server profile check
          const profile = await api.get('/auth/profile');
          // Update in case details changed
          const updatedUser = {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            firstName: profile.firstName,
            lastName: profile.lastName,
            patientId: profile.patient?.id || null,
            doctorId: profile.doctor?.id || null
          };
          setUser(updatedUser);
          localStorage.setItem('medconnect_user', JSON.stringify(updatedUser));
        } catch (error) {
          console.error('Session restore failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('medconnect_token', data.token);
      localStorage.setItem('medconnect_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerPatient = async (registrationData) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/register', registrationData);
      localStorage.setItem('medconnect_token', data.token);
      localStorage.setItem('medconnect_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('medconnect_token');
    localStorage.removeItem('medconnect_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerPatient, logout }}>
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

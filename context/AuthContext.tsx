// context/AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedRole = await AsyncStorage.getItem('role');
        const storedUserId = await AsyncStorage.getItem('user_id');
        const storedUser = await AsyncStorage.getItem('user');

        console.log('🔐 Loaded from storage:', {
          storedToken,
          storedRole,
          storedUserId,
          storedUser,
        });

        if (storedToken && storedRole && storedUserId && storedUser) {
          setToken(storedToken);
          setRole(storedRole);
          setUserId(storedUserId);
          setUser(JSON.parse(storedUser));
          setIsLoggedIn(true);
          console.log('✅ Auth restored from storage');
        } else {
          console.log('❌ Incomplete auth data in storage');
        }
      } catch (error) {
        console.error('⚠️ Error loading stored auth:', error);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (token, role, user_id, user) => {
    console.log('🔓 Logging in with:', { token, role, user_id, user });

    setToken(token);
    setRole(role);
    setUserId(user_id);
    setUser(user);
    setIsLoggedIn(true);

    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('user_id', user_id.toString());
      await AsyncStorage.setItem('user', JSON.stringify(user));
      console.log('💾 Auth saved to storage');
    } catch (error) {
      console.error('⚠️ Error saving auth data:', error);
    }
  };

  const logout = async () => {
    console.log('🚪 Logging out...');
    setToken(null);
    setRole(null);
    setUserId(null);
    setUser(null);
    setIsLoggedIn(false);

    try {
      await AsyncStorage.clear();
      console.log('🧹 Auth data cleared from storage');
    } catch (error) {
      console.error('⚠️ Error clearing storage:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        token,
        role,
        userId,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

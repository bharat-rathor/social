import React, { createContext, useContext, useState, useEffect } from 'react';
import { getData, setData, removeData } from '../utils/localStorage';
import { DEMO_USERS, DEFAULT_USER_PHOTO } from '../data/users';
import { apiRegister, apiLogin, apiUpdateProfile } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    // Seed demo users if not present or migrate away from cartoon avatars
    const existing = getData('users', null);
    if (!existing) {
      setData('users', DEMO_USERS);
    } else if (existing.some(u => typeof u.image === 'string' && u.image.includes('dicebear'))) {
      // Auto-migrate cached users with cartoon avatars to realistic human photos
      const migrated = existing.map(u => {
        const demoMatch = DEMO_USERS.find(d => d.id === u.id);
        if (demoMatch) return { ...u, image: demoMatch.image };
        if (u.image.includes('dicebear')) return { ...u, image: DEFAULT_USER_PHOTO };
        return u;
      });
      setData('users', migrated);
    }

    const saved = getData('currentUser', null) || getData('current_user', null);
    if (saved && typeof saved.image === 'string' && saved.image.includes('dicebear')) {
      const demoMatch = DEMO_USERS.find(d => d.id === saved.id);
      saved.image = demoMatch ? demoMatch.image : DEFAULT_USER_PHOTO;
      setData('currentUser', saved);
      setData('current_user', saved);
    }
    setCurrentUser(saved);
    setIsLoading(false);
  }, []);

  const register = async ({ name, email, password }, autoLogin = false) => {
    let newUser;
    try {
      newUser = await apiRegister({ name, email, password, image: DEFAULT_USER_PHOTO });
    } catch (err) {
      if (err.message && err.message.includes('already exists')) throw err;
      // Local fallback
      const users = getData('users', DEMO_USERS);
      const emailLower = email.toLowerCase().trim();
      if (users.find(u => u.email.toLowerCase() === emailLower)) {
        throw new Error('An account with this email already exists.');
      }
      newUser = {
        id: Date.now(),
        name: name.trim(),
        email: emailLower,
        password,
        age: null,
        gender: null,
        preference: null,
        area: '',
        city: '',
        bio: '',
        interests: [],
        image: DEFAULT_USER_PHOTO,
        online: false,
        lastSeen: null,
        isPremium: false,
        isProfileComplete: false,
        createdAt: new Date().toISOString()
      };
    }

    const currentUsers = getData('users', DEMO_USERS);
    const updatedUsers = [...currentUsers.filter(u => u.id !== newUser.id), newUser];
    setData('users', updatedUsers);

    if (autoLogin) {
      setData('currentUser', newUser);
      setData('current_user', newUser);
      setCurrentUser(newUser);
    }
    return newUser;
  };

  const login = async ({ email, password }) => {
    let user;
    try {
      user = await apiLogin({ email, password });
    } catch (err) {
      // Local fallback
      const users = getData('users', DEMO_USERS);
      user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
      );
      if (!user) throw new Error('Invalid email or password.');
    }

    const updated = { ...user, online: true };
    const users = getData('users', DEMO_USERS);
    const updatedUsers = users.map(u => u.id === updated.id ? updated : u);
    setData('users', updatedUsers);
    setData('currentUser', updated);
    setData('current_user', updated);
    setCurrentUser(updated);
    return updated;
  };

  const logout = () => {
    if (currentUser) {
      const users = getData('users', []);
      const updated = users.map(u =>
        u.id === currentUser.id
          ? { ...u, online: false, lastSeen: new Date().toISOString() }
          : u
      );
      setData('users', updated);
    }
    removeData('currentUser');
    removeData('current_user');
    setCurrentUser(null);
  };

  const updateProfile = async (profileData) => {
    const updatedData = { ...currentUser, ...profileData, isProfileComplete: true };
    try {
      await apiUpdateProfile(updatedData);
    } catch (e) {
      console.warn('API update profile fallback to local:', e);
    }
    const users = getData('users', []);
    const updatedUsers = users.map(u => u.id === updatedData.id ? updatedData : u);
    setData('users', updatedUsers);
    setData('currentUser', updatedData);
    setData('current_user', updatedData);
    setCurrentUser(updatedData);
    return updatedData;
  };

  const refreshCurrentUser = () => {
    const users = getData('users', []);
    const fresh = users.find(u => u.id === currentUser?.id);
    if (fresh) {
      setData('currentUser', fresh);
      setData('current_user', fresh);
      setCurrentUser(fresh);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoading,
      isAuthenticated: !!currentUser,
      register,
      login,
      logout,
      updateProfile,
      refreshCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;

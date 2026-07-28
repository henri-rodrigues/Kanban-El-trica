import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  saveFirestoreDoc, 
  subscribeFirestoreCollection, 
  isFirebaseActive 
} from '../services/firebase';

const AuthContext = createContext();

export const DEFAULT_USERS = [
  {
    id: 'usr-admin',
    name: 'Administrador Geral',
    email: 'admin@omnifield.com',
    password: 'admin',
    role: 'administrador',
    avatarColor: '#0284c7',
    userColorTag: '#0284c7',
    title: 'Gerente de Comissionamento',
    dailyRate: 500
  },
  {
    id: 'usr-operador',
    name: 'Carlos Eduardo',
    email: 'operador@omnifield.com',
    password: '123',
    role: 'usuario',
    avatarColor: '#059669',
    userColorTag: '#059669',
    title: 'Técnico Especialista HVAC',
    dailyRate: 250
  }
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('omnifield_users_auth_v4');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('omnifield_active_user_v4');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return users[0]; // Default logged-in user
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('omnifield_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('omnifield_users_auth_v4', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('omnifield_active_user_v4', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('omnifield_active_user_v4');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('omnifield_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync users real-time from Firestore
  useEffect(() => {
    if (isFirebaseActive()) {
      const unsubUsers = subscribeFirestoreCollection('users', (data) => {
        if (data.length) setUsers(data);
      });
      return () => unsubUsers();
    }
  }, []);

  const loginWithPassword = (emailOrName, password) => {
    const found = users.find(u => 
      (u.email?.toLowerCase() === emailOrName?.toLowerCase() || u.name?.toLowerCase() === emailOrName?.toLowerCase()) &&
      (u.password === password || !u.password)
    );

    if (found) {
      setCurrentUser(found);
      return { success: true, user: found };
    }
    return { success: false, message: 'Usuário ou senha incorretos.' };
  };

  const registerNewUser = (userData) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      avatarColor: userData.role === 'administrador' ? '#0284c7' : '#059669',
      userColorTag: userData.role === 'administrador' ? '#0284c7' : '#059669',
      dailyRate: parseFloat(userData.dailyRate) || 250,
      ...userData
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    if (isFirebaseActive()) saveFirestoreDoc('users', newUser.id, newUser);
    return newUser;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (newRole) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role: newRole };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    if (isFirebaseActive()) saveFirestoreDoc('users', currentUser.id, updated);
  };

  const updateUserDailyRate = (userId, newRate) => {
    const rateNum = parseFloat(newRate) || 0;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, dailyRate: rateNum };
        if (isFirebaseActive()) saveFirestoreDoc('users', userId, updated);
        return updated;
      }
      return u;
    }));

    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, dailyRate: rateNum }));
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        loginWithPassword,
        registerNewUser,
        logout,
        switchRole,
        updateUserDailyRate,
        theme,
        toggleTheme,
        isAdmin: currentUser?.role === 'administrador',
        isUser: currentUser?.role === 'usuario' || currentUser?.role === 'administrador'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

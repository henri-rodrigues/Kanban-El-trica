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
    status: 'approved', // 'approved' | 'pending_approval' | 'rejected'
    gradientId: 'cyan',
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
    status: 'approved',
    gradientId: 'emerald',
    userColorTag: '#059669',
    title: 'Técnico Especialista HVAC',
    dailyRate: 250
  }
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('omnifield_users_approval_v5');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('omnifield_active_user_v5');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return users[0];
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('omnifield_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('omnifield_users_approval_v5', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('omnifield_active_user_v5', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('omnifield_active_user_v5');
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

    if (!found) {
      return { success: false, message: 'Usuário ou senha incorretos.' };
    }

    if (found.status === 'pending_approval') {
      return { success: false, message: 'Sua conta está pendente de aprovação pelo Administrador.' };
    }

    if (found.status === 'rejected') {
      return { success: false, message: 'Sua solicitação de acesso foi recusada.' };
    }

    setCurrentUser(found);
    return { success: true, user: found };
  };

  const registerRequestUser = (userData) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      status: 'pending_approval', // Requires Admin approval
      role: 'usuario',
      gradientId: userData.gradientId || 'cyan',
      userColorTag: '#0284c7',
      dailyRate: 250,
      title: 'Técnico Operacional',
      createdAt: new Date().toISOString(),
      ...userData
    };

    setUsers(prev => [...prev, newUser]);
    if (isFirebaseActive()) saveFirestoreDoc('users', newUser.id, newUser);
    return newUser;
  };

  const approveUser = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, status: 'approved' };
        if (isFirebaseActive()) saveFirestoreDoc('users', userId, updated);
        return updated;
      }
      return u;
    }));
  };

  const rejectUser = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, status: 'rejected' };
        if (isFirebaseActive()) saveFirestoreDoc('users', userId, updated);
        return updated;
      }
      return u;
    }));
  };

  const updateUserProfileByAdmin = (userId, profileFields) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, ...profileFields };
        if (isFirebaseActive()) saveFirestoreDoc('users', userId, updated);
        return updated;
      }
      return u;
    }));

    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...profileFields }));
    }
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

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        loginWithPassword,
        registerRequestUser,
        approveUser,
        rejectUser,
        updateUserProfileByAdmin,
        logout,
        switchRole,
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

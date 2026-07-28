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
    role: 'administrador',
    avatarColor: '#0284c7',
    userColorTag: '#0284c7',
    title: 'Gerente de Comissionamento',
    dailyRate: 500
  },
  {
    id: 'usr-operador',
    name: 'Operador de Campo',
    email: 'operador@omnifield.com',
    role: 'usuario',
    avatarColor: '#059669',
    userColorTag: '#059669',
    title: 'Técnico Especialista HVAC',
    dailyRate: 250
  }
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('omnifield_users_v3');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('omnifield_active_user_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return users[0];
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('omnifield_theme') || 'dark';
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('omnifield_users_v3', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('omnifield_active_user_v3', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('omnifield_active_user_v3');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('omnifield_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Real-time synchronization with Firestore users collection
  useEffect(() => {
    if (isFirebaseActive()) {
      const unsubUsers = subscribeFirestoreCollection('users', (data) => {
        if (data.length) setUsers(data);
      });
      return () => unsubUsers();
    }
  }, []);

  const login = (user) => {
    setCurrentUser(user);
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

  const addUser = (userData) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      avatarColor: userData.role === 'administrador' ? '#0284c7' : '#059669',
      userColorTag: userData.role === 'administrador' ? '#0284c7' : '#059669',
      dailyRate: 250,
      ...userData
    };

    setUsers(prev => [...prev, newUser]);
    if (isFirebaseActive()) saveFirestoreDoc('users', newUser.id, newUser);
    return newUser;
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        login,
        logout,
        switchRole,
        updateUserDailyRate,
        addUser,
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

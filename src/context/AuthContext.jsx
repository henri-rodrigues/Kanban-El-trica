import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const MOCK_USERS_INITIAL = [
  {
    id: 'usr-1',
    name: 'Eng. Ricardo Silva',
    email: 'admin@omnifield.com',
    role: 'administrador',
    avatarColor: '#2563eb',
    userColorTag: '#2563eb',
    title: 'Gerente Geral de Comissionamento',
    dailyRate: 500 // R$ 500/dia
  },
  {
    id: 'usr-2',
    name: 'Carlos Eduardo',
    email: 'operador@omnifield.com',
    role: 'usuario',
    avatarColor: '#d97706',
    userColorTag: '#d97706',
    title: 'Técnico Especialista HVAC',
    dailyRate: 250 // R$ 250/dia
  },
  {
    id: 'usr-3',
    name: 'Mariana Costa',
    email: 'engenharia@omnifield.com',
    role: 'usuario',
    avatarColor: '#059669',
    userColorTag: '#059669',
    title: 'Engenheira de Automação & Elétrica',
    dailyRate: 350 // R$ 350/dia
  }
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('omnifield_users_list');
    return saved ? JSON.parse(saved) : MOCK_USERS_INITIAL;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('omnifield_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return users[0];
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('omnifield_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('omnifield_users_list', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('omnifield_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('omnifield_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const login = (user) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (newRole) => {
    setCurrentUser(prev => ({
      ...prev,
      role: newRole
    }));
  };

  const updateUserDailyRate = (userId, newRate) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, dailyRate: parseFloat(newRate) || 0 } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, dailyRate: parseFloat(newRate) || 0 }));
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
        login,
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  saveFirestoreDoc,
  deleteFirestoreDoc,
  subscribeFirestoreCollection,
  isFirebaseActive,
  isCloudConfigured,
  watchCloudAuth,
  cloudSignIn,
  cloudCreateAccount,
  cloudResetPassword,
  cloudSignOut,
  cloudErrorMessage,
  fetchFirestoreDoc,
  claimAdminBootstrap
} from '../services/firebase';

const AuthContext = createContext();

// Usuários de demonstração (apenas locais). Quem ainda tem senha local é migrado
// para o Firebase Authentication no primeiro login com a nuvem ativa.
export const DEFAULT_USERS = [
  {
    id: 'usr-admin',
    name: 'Administrador Geral',
    email: 'admin@omnifield.com',
    password: 'admin',
    role: 'administrador',
    status: 'approved',
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

const stripSecrets = ({ password, ...rest }) => rest;
const sameEmail = (a, b) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
const fail = (message, extra = {}) => ({ success: false, message, ...extra });

const CREDENCIAL_INVALIDA = [
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/wrong-password',
  'auth/user-not-found'
];

const MSG_PENDENTE = 'Sua conta está pendente de aprovação pelo Administrador.';
const MSG_RECUSADA = 'Sua solicitação de acesso foi recusada.';

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('omnifield_users_approval_v5');
    try {
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('omnifield_active_user_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('omnifield_theme') || 'light';
  });

  // uid do usuário autenticado no Firebase (null = sem sessão na nuvem)
  const [cloudUid, setCloudUid] = useState(null);
  // false enquanto o Firebase ainda não informou se há sessão salva
  const [authReady, setAuthReady] = useState(() => !isCloudConfigured());

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

  // Sessão do Firebase Authentication
  useEffect(() => {
    if (!isCloudConfigured()) {
      setAuthReady(true);
      return undefined;
    }

    const stop = watchCloudAuth(async (fbUser) => {
      setCloudUid(fbUser ? fbUser.uid : null);

      if (!fbUser) {
        // Sessão local antiga (anterior à nuvem) não vale mais: exige novo login.
        setCurrentUser(null);
        setAuthReady(true);
        return;
      }

      try {
        const profile = await fetchFirestoreDoc('users', fbUser.uid);
        if (profile && profile.status === 'approved') {
          setCurrentUser(stripSecrets(profile));
        } else if (profile && (profile.status === 'pending_approval' || profile.status === 'rejected')) {
          await cloudSignOut();
          setCurrentUser(null);
        }
        // sem perfil: o fluxo de login (finishCloudLogin) cuida de criá-lo
      } catch (err) {
        console.error('Erro ao carregar perfil do usuário:', err);
      } finally {
        setAuthReady(true);
      }
    });

    return stop;
  }, []);

  // Usuários em tempo real (requer sessão na nuvem). Mantém quem ainda é só local (legado).
  useEffect(() => {
    if (!cloudUid || !isFirebaseActive()) return undefined;

    return subscribeFirestoreCollection('users', (remote) => {
      setUsers((prev) => {
        const legado = prev.filter(
          (u) => !u.uid && u.password && !remote.some((r) => sameEmail(r.email, u.email))
        );
        return [...remote, ...legado];
      });

      setCurrentUser((cur) => {
        if (!cur) return cur;
        const me = remote.find((u) => u.uid === cloudUid || u.id === cur.id);
        if (!me) return cur;
        if (me.status === 'rejected') return null;
        const mudou =
          me.role !== cur.role || me.status !== cur.status ||
          me.dailyRate !== cur.dailyRate || me.title !== cur.title;
        return mudou ? stripSecrets(me) : cur;
      });
    });
  }, [cloudUid]);

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------
  const activate = (profile) => {
    const user = stripSecrets(profile);
    setCurrentUser(user);
    setUsers((prev) => {
      const sem = prev.filter((u) => !(u.id === user.id || sameEmail(u.email, user.email)));
      return [...sem, user];
    });
    return { success: true, user };
  };

  // Login 100% local (nuvem não configurada, ou sem rede para quem ainda tem senha local).
  const localLogin = (known, password) => {
    if (!known || !known.password || known.password !== password) {
      return fail('Usuário ou senha incorretos.');
    }
    if (known.status === 'pending_approval') return fail(MSG_PENDENTE);
    if (known.status === 'rejected') return fail(MSG_RECUSADA);
    setCurrentUser(stripSecrets(known));
    return { success: true, user: known };
  };

  const pendingProfile = (base, fbUser) => ({
    ...base,
    id: base.id || fbUser.uid,
    uid: fbUser.uid,
    email: fbUser.email,
    role: 'usuario',
    status: 'pending_approval'
  });

  // Primeiro acesso de uma conta que ainda não tem perfil no Firestore.
  const createProfileAndFinish = async (fbUser, base) => {
    const profile = { ...stripSecrets(base), id: base.id || fbUser.uid, uid: fbUser.uid, email: fbUser.email, createdAt: base.createdAt || new Date().toISOString() };

    if (profile.role === 'administrador' && profile.status === 'approved') {
      try {
        await claimAdminBootstrap(fbUser.uid, profile);
        return activate(profile);
      } catch {
        // Já existe um administrador: segue como usuário pendente.
      }
    }

    const pending = pendingProfile(profile, fbUser);
    const salvo = await saveFirestoreDoc('users', fbUser.uid, pending);
    await cloudSignOut();
    if (!salvo) return fail('Conta criada na nuvem, mas não foi possível registrar o perfil. Verifique as regras do Firestore e tente novamente.');
    return fail('Seu acesso foi migrado para a nuvem e está aguardando a aprovação do Administrador.');
  };

  const finishCloudLogin = async (fbUser) => {
    let profile = await fetchFirestoreDoc('users', fbUser.uid);

    if (!profile) {
      const local = users.find((u) => sameEmail(u.email, fbUser.email));
      const base = local
        ? stripSecrets(local)
        : { name: fbUser.email.split('@')[0], gradientId: 'cyan', userColorTag: '#0284c7', dailyRate: 250, title: 'Técnico Operacional', role: 'usuario', status: 'pending_approval' };
      // Conta criada direto no console do Firebase: o primeiro a entrar vira administrador.
      return createProfileAndFinish(fbUser, local ? base : { ...base, role: 'administrador', status: 'approved' });
    }

    if (profile.status === 'pending_approval') {
      await cloudSignOut();
      return fail(MSG_PENDENTE);
    }
    if (profile.status === 'rejected') {
      await cloudSignOut();
      return fail(MSG_RECUSADA);
    }
    return activate(profile);
  };

  const migrateLegacy = async (legacy, legacyPassword, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return fail(
        'Para usar a nuvem, a senha precisa ter pelo menos 6 caracteres. Defina uma nova senha para continuar.',
        { needsNewPassword: true }
      );
    }
    try {
      const cred = await cloudCreateAccount(legacy.email, newPassword);
      return await createProfileAndFinish(cred.user, legacy);
    } catch (err) {
      if (err?.code === 'auth/email-already-in-use') {
        return fail('Este e-mail já tem conta na nuvem, mas a senha informada não confere. Use a senha da nuvem ou "Esqueci minha senha".');
      }
      return fail(cloudErrorMessage(err));
    }
  };

  const loginWithPassword = async (emailOrName, password) => {
    const ident = (emailOrName || '').trim().toLowerCase();
    const known = users.find(
      (u) => u.email?.toLowerCase() === ident || u.name?.toLowerCase() === ident
    );

    if (!isCloudConfigured()) return localLogin(known, password);

    const email = ident.includes('@') ? ident : known?.email;
    if (!email) return fail('Informe o e-mail cadastrado para entrar.');

    try {
      const cred = await cloudSignIn(email, password);
      return await finishCloudLogin(cred.user);
    } catch (err) {
      const code = err?.code;

      // Nuvem indisponível (sem rede) ou Authentication ainda não ativado no console:
      // quem tem senha local segue trabalhando; os dados sincronizam depois.
      if (['auth/network-request-failed', 'auth/configuration-not-found', 'auth/operation-not-allowed'].includes(code)) {
        const local = localLogin(known, password);
        return local.success ? local : fail(cloudErrorMessage(err));
      }

      if (CREDENCIAL_INVALIDA.includes(code)) {
        // Usuário antigo (só local): migra para a nuvem usando a senha que ele acabou de provar.
        const legacy = users.find((u) => !u.uid && sameEmail(u.email, email) && u.password && u.password === password);
        if (legacy) return migrateLegacy(legacy, password, password);
        return fail('Usuário ou senha incorretos.');
      }

      return fail(err?.code ? cloudErrorMessage(err) : err?.message || 'Não foi possível entrar.');
    }
  };

  // Segundo passo da migração quando a senha antiga é curta demais para o Firebase.
  const completeLegacyMigration = async (emailOrName, oldPassword, newPassword) => {
    const ident = (emailOrName || '').trim().toLowerCase();
    const legacy = users.find(
      (u) => !u.uid && u.password && u.password === oldPassword &&
        (u.email?.toLowerCase() === ident || u.name?.toLowerCase() === ident)
    );
    if (!legacy) return fail('Usuário ou senha atual incorretos.');
    return migrateLegacy(legacy, oldPassword, newPassword);
  };

  const resetPassword = async (email) => {
    if (!isCloudConfigured()) return fail('A nuvem não está configurada neste dispositivo.');
    if (!email || !email.includes('@')) return fail('Informe o seu e-mail no campo de usuário para receber o link.');
    try {
      await cloudResetPassword(email);
      return { success: true, message: 'Enviamos um link de redefinição de senha para o seu e-mail.' };
    } catch (err) {
      return fail(cloudErrorMessage(err));
    }
  };

  // ---------------------------------------------------------------------------
  // Cadastro e administração de usuários
  // ---------------------------------------------------------------------------
  const registerRequestUser = async (userData) => {
    const { password, ...dados } = userData;
    const base = {
      status: 'pending_approval',
      role: 'usuario',
      gradientId: dados.gradientId || 'cyan',
      userColorTag: '#0284c7',
      dailyRate: 250,
      title: 'Técnico Operacional',
      createdAt: new Date().toISOString(),
      ...dados
    };

    if (!isCloudConfigured()) {
      const newUser = { id: `usr-${Date.now()}`, ...base, password };
      setUsers((prev) => [...prev, newUser]);
      return { success: true, user: newUser };
    }

    try {
      const cred = await cloudCreateAccount(base.email, password);
      const profile = { ...base, id: cred.user.uid, uid: cred.user.uid, email: cred.user.email };
      const salvo = await saveFirestoreDoc('users', cred.user.uid, profile);
      await cloudSignOut();
      if (!salvo) return fail('Conta criada, mas não foi possível enviar a solicitação. Avise o Administrador.');
      return { success: true, user: profile };
    } catch (err) {
      return fail(cloudErrorMessage(err));
    }
  };

  // Escreve o perfil na nuvem (somente quem já tem conta na nuvem, ou seja, tem uid).
  const pushUser = (user) => {
    if (user?.uid && isFirebaseActive()) saveFirestoreDoc('users', user.uid, stripSecrets(user));
  };

  const approveUser = (userId) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id === userId) {
        const updated = { ...u, status: 'approved' };
        pushUser(updated);
        return updated;
      }
      return u;
    }));
  };

  const rejectUser = (userId) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id === userId) {
        const updated = { ...u, status: 'rejected' };
        pushUser(updated);
        return updated;
      }
      return u;
    }));
  };

  const updateUserProfileByAdmin = (userId, profileFields) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id === userId) {
        const updated = { ...u, ...profileFields };
        pushUser(updated);

        // Immediate local role update if editing current user
        if (currentUser?.id === userId) {
          setCurrentUser(stripSecrets(updated));
        }

        return updated;
      }
      return u;
    }));
  };

  const deleteUser = (userId) => {
    if (!currentUser || currentUser.role !== 'administrador') return;
    if (currentUser.id === userId) {
      alert('Você não pode excluir sua própria conta enquanto está logado.');
      return;
    }
    const alvo = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (alvo?.uid && isFirebaseActive()) deleteFirestoreDoc('users', alvo.uid);
  };

  const logout = () => {
    cloudSignOut().catch(() => {});
    setCurrentUser(null);
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
        completeLegacyMigration,
        resetPassword,
        registerRequestUser,
        approveUser,
        rejectUser,
        updateUserProfileByAdmin,
        deleteUser,
        logout,
        theme,
        toggleTheme,
        cloudUid,
        authReady,
        cloudEnabled: isCloudConfigured(),
        isAdmin: currentUser?.role === 'administrador',
        isUser: currentUser?.role === 'usuario' || currentUser?.role === 'administrador'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ADMIN_EMAIL,
  saveFirestoreDoc,
  deleteFirestoreDoc,
  subscribeFirestoreCollection,
  isFirebaseActive,
  isCloudConfigured,
  watchCloudAuth,
  cloudSignIn,
  cloudCreateAccount,
  cloudSetDisplayName,
  cloudResetPassword,
  cloudSignOut,
  cloudErrorMessage,
  fetchFirestoreDoc
} from '../services/firebase';
import { consumirFlagDeReset } from '../services/resetData';

const AuthContext = createContext();

const stripSecrets = ({ password, ...rest }) => rest;
const sameEmail = (a, b) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
const fail = (message, extra = {}) => ({ success: false, message, ...extra });

// Nenhuma etapa de rede pode deixar a tela "Enviando…" para sempre.
const comTimeout = (promessa, ms, mensagem) =>
  Promise.race([
    promessa,
    new Promise((_, rejeitar) =>
      setTimeout(() => rejeitar(Object.assign(new Error(mensagem), { code: 'app/timeout' })), ms)
    )
  ]);

const MSG_SEM_RESPOSTA =
  'O servidor não respondeu a tempo. Verifique a internet e desative bloqueadores de anúncios/privacidade para este site, e tente novamente.';

const MSG_PENDENTE = 'Sua solicitação de acesso está aguardando a aprovação do Administrador. Você poderá entrar assim que for aceito.';
const MSG_RECUSADA = 'Sua solicitação de acesso foi recusada.';

export const AuthProvider = ({ children }) => {
  // Sem usuários de demonstração: o sistema começa vazio.
  const [users, setUsers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('omnifield_users_approval_v5') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('omnifield_active_user_v5') || 'null');
      return parsed && parsed.id ? parsed : null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('omnifield_theme') || 'light');

  // uid do usuário autenticado no Firebase (null = sem sessão na nuvem)
  const [cloudUid, setCloudUid] = useState(null);
  // false enquanto o Firebase ainda não informou se há sessão salva
  const [authReady, setAuthReady] = useState(() => !isCloudConfigured());

  useEffect(() => {
    localStorage.setItem('omnifield_users_approval_v5', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) localStorage.setItem('omnifield_active_user_v5', JSON.stringify(currentUser));
    else localStorage.removeItem('omnifield_active_user_v5');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('omnifield_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ---------------------------------------------------------------------------
  // Perfil / sessão na nuvem
  // ---------------------------------------------------------------------------
  const activate = (profile) => {
    const user = stripSecrets(profile);
    setCurrentUser(user);
    setUsers((prev) => [...prev.filter((u) => u.id !== user.id && !sameEmail(u.email, user.email)), user]);
    return { success: true, user };
  };

  // Garante o perfil em users/{uid}. O dono do sistema é quem tem o e-mail ADMIN_EMAIL.
  const resolveSession = async (fbUser) => {
    const isAdminEmail = sameEmail(fbUser.email, ADMIN_EMAIL);
    let profile = await fetchFirestoreDoc('users', fbUser.uid);

    if (!profile) {
      profile = {
        id: fbUser.uid,
        uid: fbUser.uid,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        email: fbUser.email,
        gradientId: 'cyan',
        userColorTag: '#0284c7',
        dailyRate: isAdminEmail ? 500 : 250,
        title: isAdminEmail ? 'Administrador' : 'Técnico Operacional',
        role: isAdminEmail ? 'administrador' : 'usuario',
        status: isAdminEmail ? 'approved' : 'pending_approval',
        createdAt: new Date().toISOString()
      };
      if (!(await saveFirestoreDoc('users', fbUser.uid, profile))) {
        await cloudSignOut();
        return fail('Não foi possível registrar o seu perfil na nuvem. Verifique as regras do Firestore e tente novamente.');
      }
    } else if (isAdminEmail && (profile.role !== 'administrador' || profile.status !== 'approved')) {
      profile = { ...profile, role: 'administrador', status: 'approved' };
      await saveFirestoreDoc('users', fbUser.uid, profile);
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

  // Sessão do Firebase Authentication (inclui sessões salvas entre recarregamentos)
  useEffect(() => {
    if (!isCloudConfigured()) {
      setAuthReady(true);
      return undefined;
    }

    return watchCloudAuth(async (fbUser) => {
      // A flag vale só para a PRIMEIRA notificação (sessão salva de antes da limpeza).
      const resetouNestaCarga = consumirFlagDeReset();

      setCloudUid(fbUser ? fbUser.uid : null);

      if (!fbUser) {
        setCurrentUser(null);
        setAuthReady(true);
        return;
      }

      if (resetouNestaCarga) {
        await cloudSignOut();
        return;
      }

      try {
        const res = await resolveSession(fbUser);
        if (!res.success) setCurrentUser(null);
      } catch (err) {
        console.error('Erro ao carregar perfil do usuário:', err);
      } finally {
        setAuthReady(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Usuários em tempo real (só com sessão aprovada na nuvem)
  useEffect(() => {
    if (!cloudUid || !isFirebaseActive()) return undefined;

    return subscribeFirestoreCollection('users', (remote) => {
      setUsers(remote);

      setCurrentUser((cur) => {
        if (!cur) return cur;
        const me = remote.find((u) => u.uid === cloudUid);
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
  // Login e solicitação de cadastro
  // ---------------------------------------------------------------------------
  const loginWithPassword = async (emailOrName, password) => {
    const ident = (emailOrName || '').trim().toLowerCase();

    if (!isCloudConfigured()) {
      const known = users.find((u) => u.email?.toLowerCase() === ident || u.name?.toLowerCase() === ident);
      if (!known || known.password !== password) return fail('Usuário ou senha incorretos.');
      if (known.status === 'pending_approval') return fail(MSG_PENDENTE);
      if (known.status === 'rejected') return fail(MSG_RECUSADA);
      setCurrentUser(stripSecrets(known));
      return { success: true, user: known };
    }

    if (!ident.includes('@')) return fail('Informe o seu e-mail para entrar.');

    try {
      const cred = await comTimeout(cloudSignIn(ident, password), 25000, MSG_SEM_RESPOSTA);
      return await comTimeout(resolveSession(cred.user), 20000, MSG_SEM_RESPOSTA);
    } catch (err) {
      if (err?.code === 'app/timeout') await cloudSignOut().catch(() => {});
      return fail(err?.code === 'app/timeout' ? MSG_SEM_RESPOSTA : cloudErrorMessage(err));
    }
  };

  // Cria o cadastro e já deixa a solicitação pendente para o Administrador decidir.
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
      requestedAt: new Date().toISOString(),
      ...dados
    };

    if (!isCloudConfigured()) {
      // Modo local (sem nuvem): o primeiro cadastro vira administrador.
      const primeiro = users.length === 0;
      const newUser = {
        id: `usr-${Date.now()}`,
        ...base,
        password,
        role: primeiro ? 'administrador' : 'usuario',
        status: primeiro ? 'approved' : 'pending_approval'
      };
      setUsers((prev) => [...prev, newUser]);
      return {
        success: true,
        user: newUser,
        message: primeiro ? 'Conta de administrador criada. Já pode entrar.' : 'Solicitação enviada. Aguarde a aprovação do Administrador.'
      };
    }

    let cred;
    try {
      cred = await comTimeout(cloudCreateAccount(base.email, password), 25000, MSG_SEM_RESPOSTA);
    } catch (err) {
      return fail(err?.code === 'app/timeout' ? MSG_SEM_RESPOSTA : cloudErrorMessage(err));
    }

    // Perfil pendente: aparece direto para o Administrador. Se a gravação falhar, é refeita no primeiro login.
    const profile = { ...base, id: cred.user.uid, uid: cred.user.uid, email: cred.user.email };
    await comTimeout(cloudSetDisplayName(cred.user, base.name), 8000, '').catch(() => {});
    const salvo = await comTimeout(saveFirestoreDoc('users', cred.user.uid, profile), 12000, '').catch(() => false);
    await cloudSignOut().catch(() => {});

    if (!salvo) {
      return {
        success: true,
        user: profile,
        message: 'Cadastro criado. Entre com seu e-mail e senha para enviar a solicitação de acesso ao Administrador.'
      };
    }
    return {
      success: true,
      user: profile,
      message: 'Solicitação enviada ao Administrador! Aguarde a aprovação. Quando for aceito, entre com seu e-mail e senha.'
    };
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
  // Administração de usuários
  // ---------------------------------------------------------------------------
  const pushUser = (user) => {
    if (user?.uid && isFirebaseActive()) saveFirestoreDoc('users', user.uid, stripSecrets(user));
  };

  const approveUser = (userId) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      const updated = { ...u, status: 'approved' };
      pushUser(updated);
      return updated;
    }));
  };

  const rejectUser = (userId) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      const updated = { ...u, status: 'rejected' };
      pushUser(updated);
      return updated;
    }));
  };

  const updateUserProfileByAdmin = (userId, profileFields) => {
    const souDono = sameEmail(currentUser?.email, ADMIN_EMAIL);
    // Só o dono do sistema concede ou retira o perfil de administrador.
    const { role, ...demais } = profileFields;
    const campos = souDono ? profileFields : demais;
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      if (souDono && sameEmail(u.email, ADMIN_EMAIL) && role && role !== 'administrador') return u; // dono permanece admin
      const updated = { ...u, ...campos };
      pushUser(updated);
      if (currentUser?.id === userId) setCurrentUser(stripSecrets(updated));
      return updated;
    }));
  };

  const deleteUser = (userId) => {
    if (!currentUser || currentUser.role !== 'administrador') return;
    if (currentUser.id === userId) {
      alert('Você não pode excluir sua própria conta enquanto está logado.');
      return;
    }
    const alvo = users.find((u) => u.id === userId);
    if (alvo && sameEmail(alvo.email, ADMIN_EMAIL)) return; // dono do sistema não pode ser excluído
    if (alvo?.role === 'administrador' && !sameEmail(currentUser.email, ADMIN_EMAIL)) return; // só o dono remove administradores
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (alvo?.uid && isFirebaseActive()) deleteFirestoreDoc('users', alvo.uid);
  };

  const logout = () => {
    cloudSignOut().catch(() => {});
    setCurrentUser(null);
  };

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        loginWithPassword,
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
        isOwner: sameEmail(currentUser?.email, ADMIN_EMAIL) && currentUser?.role === 'administrador',
        isUser: currentUser?.role === 'usuario' || currentUser?.role === 'administrador'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

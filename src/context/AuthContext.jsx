import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ADMIN_EMAIL,
  saveFirestoreDoc,
  deleteFirestoreDoc,
  subscribeFirestoreCollection,
  isFirebaseActive,
  isCloudConfigured,
  getCloudUser,
  watchCloudAuth,
  cloudSignIn,
  cloudCreateAccount,
  cloudSetDisplayName,
  cloudSendVerification,
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

const MSG_PENDENTE = 'E-mail confirmado! Sua solicitação foi enviada ao Administrador e está aguardando aprovação. Você poderá entrar assim que for aceito.';
const MSG_RECUSADA = 'Sua solicitação de acesso foi recusada.';
const MSG_CONFIRMAR = 'Confirme seu e-mail para entrar: abra o link que enviamos para a sua caixa de entrada (veja também o spam).';

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

  // Garante o perfil em users/{uid}. O administrador é quem tem o e-mail ADMIN_EMAIL confirmado.
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
      // E-mail confirmado: a solicitação passa a aparecer para o Administrador decidir.
      if (!profile.emailVerified) {
        await saveFirestoreDoc('users', fbUser.uid, { ...profile, emailVerified: true, emailVerifiedAt: new Date().toISOString() });
      }
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
      setCloudUid(fbUser ? fbUser.uid : null);

      if (!fbUser) {
        setCurrentUser(null);
        setAuthReady(true);
        return;
      }

      // Dados locais foram zerados nesta carga: encerra também a sessão antiga da nuvem.
      if (consumirFlagDeReset()) {
        await cloudSignOut();
        return;
      }

      // Sessão de conta ainda não confirmada não vale.
      if (!fbUser.emailVerified) {
        setCurrentUser(null);
        setAuthReady(true);
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
  // Login, cadastro, confirmação de e-mail
  // ---------------------------------------------------------------------------
  const loginWithPassword = async (emailOrName, password) => {
    const ident = (emailOrName || '').trim().toLowerCase();

    if (!isCloudConfigured()) {
      const known = users.find((u) => u.email?.toLowerCase() === ident || u.name?.toLowerCase() === ident);
      if (!known || known.password !== password) return fail('Usuário ou senha incorretos.');
      if (known.status === 'pending_approval') return fail('Sua conta está pendente de aprovação pelo Administrador.');
      if (known.status === 'rejected') return fail(MSG_RECUSADA);
      setCurrentUser(stripSecrets(known));
      return { success: true, user: known };
    }

    if (!ident.includes('@')) return fail('Informe o seu e-mail para entrar.');

    try {
      const cred = await cloudSignIn(ident, password);
      await cred.user.reload();
      const fbUser = getCloudUser() || cred.user;

      if (!fbUser.emailVerified) {
        await cloudSignOut();
        return fail(MSG_CONFIRMAR, { needsVerification: true });
      }

      await fbUser.getIdToken(true); // garante a claim email_verified no token usado pelas regras
      return await resolveSession(fbUser);
    } catch (err) {
      return fail(cloudErrorMessage(err));
    }
  };

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

    try {
      const cred = await cloudCreateAccount(base.email, password);
      await cloudSetDisplayName(cred.user, base.name).catch(() => {});
      await cloudSendVerification(cred.user);

      const profile = { ...base, id: cred.user.uid, uid: cred.user.uid, email: cred.user.email, emailVerified: false };
      await saveFirestoreDoc('users', cred.user.uid, profile);
      await cloudSignOut();

      return {
        success: true,
        user: profile,
        message: `Cadastro criado. Enviamos um e-mail de confirmação para ${cred.user.email}: clique no link (veja também o spam) e depois entre no sistema para enviar sua solicitação de acesso ao Administrador.`
      };
    } catch (err) {
      return fail(cloudErrorMessage(err));
    }
  };

  // Reenvia o e-mail de confirmação (precisa do e-mail e senha para identificar a conta).
  const resendVerification = async (email, password) => {
    if (!isCloudConfigured()) return fail('A nuvem não está configurada neste dispositivo.');
    try {
      const cred = await cloudSignIn((email || '').trim(), password);
      await cred.user.reload();
      const fbUser = getCloudUser() || cred.user;
      if (fbUser.emailVerified) {
        await cloudSignOut();
        return { success: true, message: 'Seu e-mail já está confirmado. Pode entrar.' };
      }
      await cloudSendVerification(fbUser);
      await cloudSignOut();
      return { success: true, message: `Reenviamos o e-mail de confirmação para ${fbUser.email}.` };
    } catch (err) {
      return fail(cloudErrorMessage(err));
    }
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
        resendVerification,
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

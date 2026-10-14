import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  deleteDoc,
  query,
  getDocs,
  orderBy,
  limit,
  arrayUnion
} from 'firebase/firestore';
import { getMessaging, getToken, isSupported as pushSuportado } from 'firebase/messaging';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from 'firebase/auth';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDpKe8QFLlZNhDZkRLajVzeg0IIRrY9wKs",
  authDomain: "omnifield-pro.firebaseapp.com",
  projectId: "omnifield-pro",
  storageBucket: "omnifield-pro.firebasestorage.app",
  messagingSenderId: "756154599826",
  appId: "1:756154599826:web:bb26578705c9e79ea9194b",
  measurementId: "G-SL13ZJ4KDN"
};

// Chave pública VAPID (Firebase Console → Configurações do projeto → Cloud Messaging →
// Certificados push da Web → "Gerar par de chaves"). É pública: pode ficar no código.
export const VAPID_KEY = '';

// Administrador do sistema: o e-mail precisa estar CONFIRMADO. O mesmo e-mail está em firestore.rules.
export const ADMIN_EMAIL = 'eletrica@3darcondicionado.com.br';

let db = null;
let app = null;
let auth = null;

export const getStoredFirebaseConfig = () => {
  const saved = localStorage.getItem('omnifield_firebase_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
};

export const initFirebase = (config = getStoredFirebaseConfig()) => {
  if (!config || !config.apiKey || !config.projectId) return null;
  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    try {
      // Auto-detecta long-polling: evita gravações "penduradas" em redes/extensões que bloqueiam o canal padrão.
      // Cache local persistente (IndexedDB): o app lê e grava sem internet e sincroniza quando o sinal volta.
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch {
      db = getFirestore(app); // já inicializado
    }
    auth = getAuth(app);
    auth.languageCode = 'pt-BR'; // e-mails de confirmação / redefinição em português
    return db;
  } catch (err) {
    console.error('Erro ao inicializar Firebase:', err);
    return null;
  }
};

// A nuvem está configurada (chaves presentes), independentemente de haver alguém logado.
export const isCloudConfigured = () => {
  const cfg = getStoredFirebaseConfig();
  if (!cfg || !cfg.apiKey || !cfg.projectId) return false;
  if (!db) initFirebase(cfg);
  return !!db && !!auth;
};

// Há um usuário autenticado no Firebase: só então as regras do Firestore permitem ler/gravar.
export const isFirebaseActive = () => isCloudConfigured() && !!auth.currentUser;

export const getCloudUser = () => (isCloudConfigured() ? auth.currentUser : null);

// ---------------------------------------------------------------------------
// Autenticação (e-mail/senha)
// ---------------------------------------------------------------------------
const AUTH_ERRORS = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/email-already-in-use': 'Este e-mail já possui conta. Entre com a senha dela ou use "Esqueci minha senha".',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Sem conexão com o servidor. Verifique a internet.',
  'auth/operation-not-allowed': 'O login por e-mail/senha ainda não foi ativado no console do Firebase (Authentication → Sign-in method).',
  'auth/configuration-not-found': 'O Authentication ainda não foi ativado no projeto Firebase (Authentication → Vamos começar).',
  'permission-denied': 'Sem permissão no banco. Verifique se as regras do Firestore (firestore.rules) foram publicadas.'
};

export const cloudErrorMessage = (err) => AUTH_ERRORS[err?.code] ?? err?.message ?? 'Erro inesperado.';

export const watchCloudAuth = (callback) => {
  if (!isCloudConfigured()) {
    callback(null, false);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => callback(user, true));
};

export const cloudSignIn = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password);
export const cloudCreateAccount = (email, password) => createUserWithEmailAndPassword(auth, email.trim(), password);
export const cloudResetPassword = (email) => sendPasswordResetEmail(auth, email.trim());
export const cloudSetDisplayName = (user, name) => updateProfile(user, { displayName: name });
export const cloudSignOut = async () => {
  if (isCloudConfigured() && auth.currentUser) await signOut(auth);
};

// ---------------------------------------------------------------------------
// Firestore
// ---------------------------------------------------------------------------
// O Firestore rejeita `undefined`; o round-trip JSON descarta esses campos.
const limpo = (o) => JSON.parse(JSON.stringify(o));

export const fetchFirestoreDoc = async (collectionName, docId) => {
  if (!isFirebaseActive()) return null;
  const snap = await getDoc(doc(db, collectionName, docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Save a document to Firestore collection
// Gravações aguardando confirmação do servidor (offline elas ficam na fila do Firestore).
let pendentes = 0;
const ouvintesPendentes = new Set();
const avisarPendentes = () => ouvintesPendentes.forEach((fn) => fn(pendentes));
export const onPendingWrites = (fn) => {
  ouvintesPendentes.add(fn);
  fn(pendentes);
  return () => ouvintesPendentes.delete(fn);
};
const acompanhar = async (promessa) => {
  pendentes += 1;
  avisarPendentes();
  try {
    await promessa;
    return true;
  } finally {
    pendentes -= 1;
    avisarPendentes();
  }
};

export const saveFirestoreDoc = async (collectionName, docId, data) => {
  if (!isFirebaseActive()) return false;

  try {
    // Sem internet a gravação entra na fila local e só confirma quando o sinal volta.
    return await acompanhar(setDoc(doc(db, collectionName, docId), limpo(data), { merge: true }));
  } catch (err) {
    console.error(`Erro ao salvar no Firestore [${collectionName}/${docId}]:`, err);
    return false;
  }
};

/** Últimos documentos de uma coleção, do mais novo para o mais antigo (null se falhar). */
export const listarColecaoRecente = async (collectionName, campoData, limite = 500) => {
  if (!isFirebaseActive()) return null;
  try {
    const snap = await getDocs(query(collection(db, collectionName), orderBy(campoData, 'desc'), limit(limite)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error(`Erro ao listar ${collectionName}:`, err);
    return null;
  }
};

// Delete a document from Firestore collection
export const deleteFirestoreDoc = async (collectionName, docId) => {
  if (!isFirebaseActive()) return false;

  try {
    return await acompanhar(deleteDoc(doc(db, collectionName, docId)));
  } catch (err) {
    console.error(`Erro ao deletar no Firestore [${collectionName}/${docId}]:`, err);
    return false;
  }
};

// Real-time listener for Firestore collection
export const subscribeFirestoreCollection = (collectionName, onDataChange) => {
  if (!isFirebaseActive()) return () => {};

  try {
    const q = query(collection(db, collectionName));
    return onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() });
      });
      onDataChange(items);
    }, (err) => {
      console.error(`Erro no listener Firestore [${collectionName}]:`, err);
    });
  } catch (err) {
    console.error(`Erro ao assinar coleção Firestore [${collectionName}]:`, err);
    return () => {};
  }
};

// ---------------------------------------------------------------------------
// Notificações push (FCM) e preferências de aviso: push_tokens/{uid}
// ---------------------------------------------------------------------------
export const pushConfigurado = () => !!VAPID_KEY;

/** Pede permissão, registra este aparelho para receber push e devolve o token. */
export async function ativarNotificacoesPush() {
  if (!isFirebaseActive()) throw new Error('Entre com a sua conta para ativar as notificações.');
  if (!VAPID_KEY) throw new Error('As notificações push ainda não foram configuradas pelo administrador (chave VAPID).');
  if (!(await pushSuportado().catch(() => false)) || !('serviceWorker' in navigator)) {
    throw new Error('Este navegador não recebe notificações push. No iPhone, instale o sistema na tela inicial e abra por lá.');
  }
  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') throw new Error('Permissão de notificação negada. Libere nas configurações do navegador.');
  const registro = await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registro });
  await setDoc(doc(db, 'push_tokens', auth.currentUser.uid), { tokens: arrayUnion(token), push: true, updatedAt: new Date().toISOString() }, { merge: true });
  return token;
}

export async function lerPreferenciasAviso() {
  if (!isFirebaseActive()) return null;
  const snap = await getDoc(doc(db, 'push_tokens', auth.currentUser.uid));
  return snap.exists() ? snap.data() : { push: false, email: true, tokens: [] };
}

export async function salvarPreferenciasAviso(prefs) {
  if (!isFirebaseActive()) return false;
  await setDoc(doc(db, 'push_tokens', auth.currentUser.uid), { ...prefs, updatedAt: new Date().toISOString() }, { merge: true });
  return true;
}

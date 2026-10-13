import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  writeBatch,
  onSnapshot,
  deleteDoc,
  query
} from 'firebase/firestore';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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
    db = getFirestore(app);
    auth = getAuth(app);
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
export const saveFirestoreDoc = async (collectionName, docId, data) => {
  if (!isFirebaseActive()) return false;

  try {
    await setDoc(doc(db, collectionName, docId), limpo(data), { merge: true });
    return true;
  } catch (err) {
    console.error(`Erro ao salvar no Firestore [${collectionName}/${docId}]:`, err);
    return false;
  }
};

// Delete a document from Firestore collection
export const deleteFirestoreDoc = async (collectionName, docId) => {
  if (!isFirebaseActive()) return false;

  try {
    await deleteDoc(doc(db, collectionName, docId));
    return true;
  } catch (err) {
    console.error(`Erro ao deletar no Firestore [${collectionName}/${docId}]:`, err);
    return false;
  }
};

/**
 * Cria o perfil do primeiro administrador. As regras só aceitam esta escrita quando o
 * documento `config/bootstrap` é criado no mesmo lote com o uid de quem está logado —
 * e esse documento só pode ser criado uma única vez. Lança erro (permission-denied) se
 * já existir um administrador.
 */
export const claimAdminBootstrap = async (uid, profile) => {
  if (!isFirebaseActive()) throw new Error('Sem sessão na nuvem.');
  const batch = writeBatch(db);
  batch.set(doc(db, 'config', 'bootstrap'), { uid, createdAt: new Date().toISOString() });
  batch.set(doc(db, 'users', uid), limpo(profile));
  await batch.commit();
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

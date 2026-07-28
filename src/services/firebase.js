import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc, 
  query 
} from 'firebase/firestore';

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
    return db;
  } catch (err) {
    console.error('Erro ao inicializar Firebase:', err);
    return null;
  }
};

// Check if Firebase is active
export const isFirebaseActive = () => {
  const cfg = getStoredFirebaseConfig();
  if (cfg && cfg.apiKey) {
    if (!db) initFirebase(cfg);
    return !!db;
  }
  return false;
};

// Save a document to Firestore collection
export const saveFirestoreDoc = async (collectionName, docId, data) => {
  const cfg = getStoredFirebaseConfig();
  const firestoreDb = db || initFirebase(cfg);
  if (!firestoreDb) return false;

  try {
    const docRef = doc(firestoreDb, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (err) {
    console.error(`Erro ao salvar no Firestore [${collectionName}/${docId}]:`, err);
    return false;
  }
};

// Real-time listener for Firestore collection
export const subscribeFirestoreCollection = (collectionName, onDataChange) => {
  const cfg = getStoredFirebaseConfig();
  const firestoreDb = db || initFirebase(cfg);
  if (!firestoreDb) return () => {};

  try {
    const q = query(collection(firestoreDb, collectionName));
    return onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
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

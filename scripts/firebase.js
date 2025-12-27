// Lightweight Firebase bootstrap for client-only usage.
// Expects global window.firebaseConfig populated from scripts/firebase-config.js (copy from sample).
// Provides initialized app and Realtime Database instances.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

let appInstance = null;
let dbInstance = null;
let connectionListeners = [];

export function getFirebaseApp() {
  if (appInstance) return appInstance;
  if (!window.firebaseConfig) {
    throw new Error("Firebase config missing. Ensure scripts/firebase-config.js defines window.firebaseConfig.");
  }
  // Avoid re-init in hot reload or multiple imports
  appInstance = getApps().length ? getApps()[0] : initializeApp(window.firebaseConfig);
  return appInstance;
}

export function getFirebaseDatabase() {
  if (dbInstance) return dbInstance;
  const app = getFirebaseApp();
  dbInstance = getDatabase(app);
  return dbInstance;
}

/**
 * Subscribe to Firebase connection state changes.
 * @param {Function} callback - Called with boolean (true = connected)
 * @returns {Function} Unsubscribe function
 */
export function subscribeConnectionState(callback) {
  const db = getFirebaseDatabase();
  const connectedRef = ref(db, ".info/connected");
  
  const unsubscribe = onValue(connectedRef, (snapshot) => {
    const isConnected = snapshot.val() === true;
    callback(isConnected);
  });
  
  connectionListeners.push({ callback, unsubscribe });
  return unsubscribe;
}

/**
 * Check if Firebase is currently connected.
 * @returns {Promise<boolean>}
 */
export async function isConnected() {
  return new Promise((resolve) => {
    const db = getFirebaseDatabase();
    const connectedRef = ref(db, ".info/connected");
    const unsub = onValue(connectedRef, (snapshot) => {
      unsub();
      resolve(snapshot.val() === true);
    }, { onlyOnce: true });
  });
}

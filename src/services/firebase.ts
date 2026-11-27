import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from "firebase/auth";
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseReady) return null;
  if (!app) app = getApps().length ? getApp() : initializeApp(config);
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp();
  return firebaseApp ? getAuth(firebaseApp) : null;
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured in mock mode.");
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function getAIIdToken(): Promise<string | undefined> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  return user ? user.getIdToken() : undefined;
}

export async function requestMessagingToken(): Promise<string | null> {
  if (!firebaseReady || typeof window === "undefined" || !("Notification" in window)) return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  const messaging: Messaging = getMessaging(firebaseApp);
  return getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined }).catch(() => null);
}

export function onForegroundAlert(callback: (body: string) => void): () => void {
  if (!firebaseReady || typeof window === "undefined") return () => {};
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return () => {};
  try {
    const messaging = getMessaging(firebaseApp);
    return onMessage(messaging, (payload) => {
      callback(payload.notification?.body || "New urgent batch alert");
    });
  } catch {
    return () => {};
  }
}

export async function callAITutor(payload: unknown, idToken?: string) {
  const response = await fetch("/api/ai-tutor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || `AI request failed (${response.status})`);
  }
  return response.json();
}

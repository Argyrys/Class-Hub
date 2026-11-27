/* Combined PWA + Firebase Cloud Messaging service worker.
   Replace the placeholder config with your Firebase web config before going live. */
const CACHE = "mca-batch-hub-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.json", "/icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
      return response;
    }).catch(() => cached))
  );
});

try {
  importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");
  firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
  });
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const n = payload.notification || {};
    self.registration.showNotification(n.title || "MCA Batch Hub", {
      body: n.body || "New urgent batch alert",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "mca-urgent",
      requireInteraction: true,
      data: payload.data || {},
    });
  });
} catch (error) {
  console.warn("FCM not configured in mock mode", error);
}

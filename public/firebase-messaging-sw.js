importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAI_rqnKV-C8irI_zHjWnSeqjTJD_LpyYo",
  authDomain: "taskly-assistant-notifications.firebaseapp.com",
  projectId: "taskly-assistant-notifications",
  storageBucket: "taskly-assistant-notifications.firebasestorage.app",
  messagingSenderId: "714798664661",
  appId: "1:714798664661:web:2acecaa46c44be528e8b5c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.svg',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
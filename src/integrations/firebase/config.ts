import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAI_rqnKV-C8irI_zHjWnSeqjTJD_LpyYo",
  authDomain: "taskly-assistant-notifications.firebaseapp.com",
  projectId: "taskly-assistant-notifications",
  storageBucket: "taskly-assistant-notifications.firebasestorage.app",
  messagingSenderId: "714798664661",
  appId: "1:714798664661:web:2acecaa46c44be528e8b5c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });
      
      if (currentToken) {
        return currentToken;
      }
    }
    throw new Error('No registration token available');
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    throw error;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { messaging };
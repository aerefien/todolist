import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
  apiKey: 'AIzaSyBiGAltAKA5lZjXz_KBSajHCMviA3gjd2E',
  authDomain: 'aerefien.firebaseapp.com',
  projectId: 'aerefien',
  storageBucket: 'aerefien.firebasestorage.app',
  messagingSenderId: '1036574264065',
  appId: '1:1036574264065:web:8c65c187f5d8546bfa2900',
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

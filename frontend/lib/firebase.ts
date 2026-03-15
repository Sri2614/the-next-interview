import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDquXr5dtFWieAa0Z0e2Z8G7gffvm4C-Lk',
  authDomain: 'thesimplifiedtech-f2dee.firebaseapp.com',
  projectId: 'thesimplifiedtech-f2dee',
  storageBucket: 'thesimplifiedtech-f2dee.firebasestorage.app',
  messagingSenderId: '37128181376',
  appId: '1:37128181376:web:9f8d25a02d9dcf5ea43865',
}

// Prevent duplicate app initialisation in Next.js dev (hot reload)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

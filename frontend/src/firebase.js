// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mern-blog-cc6ea.firebaseapp.com",
  projectId: "mern-blog-cc6ea",
  storageBucket: "mern-blog-cc6ea.appspot.com",
  messagingSenderId: "315482106558",
  appId: "1:315482106558:web:6cf31285dcfbf2926c0cef"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
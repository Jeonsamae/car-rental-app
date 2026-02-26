import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwt1lEJimAHhFDmwVyGK5UWRZqqZIG2Vw",
  authDomain: "car-rental-app-cfbdf.firebaseapp.com",
  projectId: "car-rental-app-cfbdf",
  storageBucket: "car-rental-app-cfbdf.firebasestorage.app",
  messagingSenderId: "522922345694",
  appId: "1:522922345694:web:e55d8a1064e9ff7d8fee4f",
  measurementId: "G-EZ0BCRQ0K8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyADVwpH2cPR3P0hKL5FgBbmFy-_prIR1ao",
    authDomain: "ideaarena-ab92f.firebaseapp.com",
    projectId: "ideaarena-ab92f",
    storageBucket: "ideaarena-ab92f.firebasestorage.app",
    messagingSenderId: "672791183735",
    appId: "1:672791183735:web:b364fe47c349880a8e6172",
    measurementId: "G-LFC89XJQ8J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

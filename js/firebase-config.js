// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2KxHxYYrp-qKiV6LS24UCe3p-nnJvgb4",
  authDomain: "ev-recharge-afcf0.firebaseapp.com",
  projectId: "ev-recharge-afcf0",
  storageBucket: "ev-recharge-afcf0.firebasestorage.app",
  messagingSenderId: "1090414002132",
  appId: "1:1090414002132:web:877467701f7bfc88ec6041",
  measurementId: "G-FYCSRCYFZD"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
export const db = firebase.firestore();
export const auth = firebase.auth();
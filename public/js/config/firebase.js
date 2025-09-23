/**
 * Configuración de Firebase para CEMAC
 * Base de datos temporal para el inventario
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, where } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmWBvrFZRtrEGTqPQ3bONAm34Xs7Y0Jxo",
  authDomain: "cemac-440c5.firebaseapp.com",
  projectId: "cemac-440c5",
  storageBucket: "cemac-440c5.firebasestorage.app",
  messagingSenderId: "104454244903",
  appId: "1:104454244903:web:ebf645b5b853b035659c02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exportar configuración y utilidades
export { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    limit, 
    startAfter, 
    where 
};
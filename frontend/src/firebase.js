import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTYVOs62KPe6kX8DpIbKCJs3Qm6f0FlBk",
  authDomain: "timesheet-5fff2.firebaseapp.com",
  projectId: "timesheet-5fff2",
  storageBucket: "timesheet-5fff2.firebasestorage.app",
  messagingSenderId: "1075321720159",
  appId: "1:1075321720159:web:c5485e29cb43b27ed17aea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";  // CDN引入Firebase
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";  // CDN引入Firebase Auth
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";  // 若需要Database也加這個

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyAXTTlfpBPq8OvZhF87WfERq7GrF95MtDM",
    authDomain: "fluppy-hamster.firebaseapp.com",
    databaseURL: "https://fluppy-hamster-default-rtdb.firebaseio.com",
    projectId: "fluppy-hamster",
    storageBucket: "fluppy-hamster.firebasestorage.app",
    messagingSenderId: "321714725468",
    appId: "1:321714725468:web:4021c5e50c9dc7414bfc99",
    measurementId: "G-HFZ4M6280L"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);  // 若你有用到 Realtime Database

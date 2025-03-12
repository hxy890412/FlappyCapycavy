// auth.js
import { auth } from "./firebase-config.js";  // 使用相對路徑引入firebase-config
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";  // 使用 CDN 引入 firebase-auth

// 註冊功能
export function register(username, password) {
    const email = username + "@hamster.com";
    return createUserWithEmailAndPassword(auth, email, password);
}

// 登入功能
export function login(username, password) {
    const email = username + "@hamster.com";
    return signInWithEmailAndPassword(auth, email, password);
}

// 檢查用戶登入狀態並更新 UI
export function checkUserStatus() {
    onAuthStateChanged(auth, user => {
        if (user) {
            // 如果用戶已登入，顯示用戶的頭像和分數
            const username = user.email.replace('@hamster.com', ''); 
            document.getElementById("user-status").innerHTML = `
            <img src="./src/img/avator_pocky.png" alt="avatar" id="user-avator"> 
             <span>已登入: ${username}</span>
            `;
            document.getElementById("start-game-btn").style.display = 'block';
            document.getElementById("login-btn").style.display = 'none';
            document.getElementById("register-btn").style.display = 'none';
            document.getElementById("logout-btn").style.display = 'block'; 
            document.getElementById("character-selection").style.display = 'block'; 
        } else {
            // 如果用戶尚未登入，顯示登入和註冊按鈕
            document.getElementById("user-status").innerHTML = `
            <img src="./src/img/avator_pocky.png" alt="avatar" id="user-avator"> 
            <span>未登入</span>
            `;
            document.getElementById("start-game-btn").style.display = 'none';
            document.getElementById("login-btn").style.display = 'block';
            document.getElementById("register-btn").style.display = 'block';
            document.getElementById("logout-btn").style.display = 'none'; 
            document.getElementById("character-selection").style.display = 'none'; 
        }
    });
}



// 登出功能
export function logout() {
    signOut(auth).then(() => {
        // 登出成功，更新 UI
        alert("已登出");
        checkUserStatus();  // 重新檢查用戶狀態，更新UI
    }).catch((error) => {
        console.error("登出錯誤:", error.message);
    });
}
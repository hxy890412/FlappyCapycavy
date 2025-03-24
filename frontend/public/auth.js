import { auth, db } from "./firebase-config.js";  // 從 firebase-config.js 中引入 auth 和 db
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";  // 使用 CDN 引入 firebase-auth
import { ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";  // 引入 Firebase Realtime Database
import { checkUserStatus } from "./main.js"; 

export function register(username, password) {
    const email = username + "@hamster.com";  // 使用 @hamster.com
    return createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userRef = ref(db, 'users/' + user.uid);

            // 設定用戶基本資料
            return set(userRef, {
                username: username,
                avatarUrl: './src/img/avator_pocky.png',  // 預設頭像
                highscore: 0,
                isNewUser: true
            })
            .then(() => {
                console.log("用戶資料已成功寫入資料庫");
                // 資料庫寫入成功後返回
            })
            .catch((error) => {
                console.error("寫入資料庫錯誤:", error.message);  // 顯示錯誤訊息
                alert("無法寫入資料庫，請稍後再試！");
                throw new Error("無法寫入資料庫");
            });
        })
        .catch((error) => {
            console.error("註冊失敗:", error.message);  // 顯示註冊錯誤
            alert("註冊失敗：" + error.message);  // 顯示錯誤訊息
            throw new Error("註冊失敗：" + error.message);  // 向外拋出錯誤
        });
}



// 登入功能
export function login(username, password) {
    const email = username + "@hamster.com";
    return signInWithEmailAndPassword(auth, email, password);
}



// 登出功能
export function logout() {
    signOut(auth).then(() => {
        // 登出成功，更新 UI
        alert("已登出");
        checkUserStatus();  // 重新檢查用戶狀態，更新UI
        window.location.href = "/index.html";
    }).catch((error) => {
        console.error("登出錯誤:", error.message);
    });
}



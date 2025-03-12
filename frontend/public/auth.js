import { auth, db } from "./firebase-config.js";  // 從 firebase-config.js 中引入 auth 和 db
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";  // 使用 CDN 引入 firebase-auth
import { ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";  // 引入 Firebase Realtime Database

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
                highscore: 0
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

// 檢查用戶登入狀態並更新 UI
export function checkUserStatus() {
    onAuthStateChanged(auth, user => {
        console.log("Auth state changed:", user);  // 這行可以幫助檢查用戶狀態
        if (user) {
            // 如果用戶已登入，顯示用戶的頭像和分數
            const userRef = ref(db, 'users/' + user.uid);
            get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    console.log("用戶資料:", userData);  // 輸出用戶資料以檢查是否正確
                    const username = userData.username;
                    const avatarUrl = userData.avatarUrl || './src/img/avator_pocky.png'; // 預設頭像
                    const highscore = userData.highscore || 0;

                    // 更新 UI，顯示用戶名稱和頭像
                    document.getElementById("user-status").innerHTML = `
                        <img src="${avatarUrl}" alt="avatar" id="user-avator" onclick="openProfileModal()"> 
                        <span>已登入: ${username}</span>
                    `;
                    document.getElementById("start-game-btn").style.display = 'block';
                    document.getElementById("login-btn").style.display = 'none';
                    document.getElementById("register-btn").style.display = 'none';
                    document.getElementById("logout-btn").style.display = 'block'; 
                    document.getElementById("character-selection").style.display = 'block'; 

                    // 顯示提示如果是首次註冊
                    if (!userData.avatarUrl) {
                        const hint = document.createElement('div');
                        hint.innerText = '點擊頭像選擇頭像！';
                        hint.id = 'avatar-hint';
                        document.getElementById("user-status").appendChild(hint);

                        setTimeout(() => {
                            hint.style.display = 'none'; // 顯示後3秒隱藏提示
                        }, 3000);
                    }
                } else {
                    console.error("用戶資料不存在");  // 若用戶資料不存在
                    alert("用戶資料不存在，請稍後再試！");
                }
            }).catch((error) => {
                console.error("讀取用戶資料錯誤:", error.message);
                alert("讀取用戶資料失敗，請稍後再試！");
            });
        } else {
            // 如果用戶未登入，顯示登入和註冊按鈕
            console.log("用戶未登入");
            document.getElementById("user-status").innerHTML = `
                <img src="./src/img/avator_pocky.png" alt="avatar" id="user-avator" onclick="openProfileModal()"> 
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

// 打開個人資訊彈窗
function openProfileModal() {
    const user = auth.currentUser;
    const userRef = ref(db, 'users/' + user.uid);
    
    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const avatarUrl = userData.avatarUrl || './src/img/avator_pocky.png';
            const username = userData.username;
            const highscore = userData.highscore || 0; // 用戶的最高分數

            // 更新 lightbox 顯示的資料
            document.getElementById("profile-avatar").src = avatarUrl;
            document.getElementById("profile-username").innerText = `Username: ${username}`;
            document.getElementById("profile-highscore").innerText = `最高分數: ${highscore}`;
        }
    }).catch((error) => {
        console.error("讀取用戶資料錯誤:", error);
    });

    document.getElementById("profile-modal").style.display = 'flex';
}

// 關閉個人資訊彈窗
function closeProfileModal() {
    document.getElementById("profile-modal").style.display = 'none';
}

// 更改頭像
function selectNewAvatar(avatarUrl) {
    const user = auth.currentUser;
    const userRef = ref(db, 'users/' + user.uid);

    // 更新用戶頭像
    update(userRef, {
        avatarUrl: avatarUrl
    }).then(() => {
        document.getElementById("profile-avatar").src = avatarUrl; // 更新 lightbox 頭像
        document.getElementById("user-avator").src = avatarUrl; // 更新頁面上顯示的頭像
    }).catch((error) => {
        console.error("更改頭像錯誤:", error);
    });
}

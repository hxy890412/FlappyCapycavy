import { logout } from "./auth.js";
import { startGame, pauseGame, resumeGame, pauseRestartGame } from "./game.js";
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { fetchLeaderboard, fetchUserRank} from "./leaderboard.js";

window.addEventListener("load", () => {
  const startGameBtn = document.getElementById("start-game-btn");
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const openleaderboard = document.getElementById("leaderboard-icon");
  const viewLeaderboardButton = document.getElementById("viewleaderboard");
  const closeButtons = document.querySelectorAll('.lightbox .close-btn');
  const pausebtn = document.getElementById("pause-btn");
  const resumebtn = document.getElementById("pause-end-btn");
  const restartBtn = document.getElementById("restart-btn");

  loginBtn.addEventListener("click", () => (window.location.href = "/login.html"));
  registerBtn.addEventListener("click", () => (window.location.href = "/register.html"));
  logoutBtn.addEventListener("click", logout);
  startGameBtn.addEventListener("click", () => {
    startGame(); // 開始遊戲
    document.getElementById("login-out-section").style.display = "none";
    document.getElementById("showscore-status").style.display = "block";
    
    pausebtn.style.display = "block";
    document.getElementById("leaderboard-icon").style.display = "none";
    
  });
  pausebtn.addEventListener("click", () =>{
    pauseGame();
  });
  resumebtn.addEventListener("click", () =>{
    resumeGame();
  });
  restartBtn.addEventListener("click", () =>{
    pauseRestartGame()
  });
  openleaderboard.addEventListener("click", showLeaderboard);
  viewLeaderboardButton.addEventListener("click", showLeaderboard);
  
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const lightbox = button.closest('.lightbox');
        if (lightbox) {
            lightbox.style.display = 'none';
        }
    });
});

  checkUserStatus();
});

// 在 main.js 中添加全域點擊音效

// 建立點擊音效物件
// let clickSound = new Audio();
// clickSound.src = "./src/music/pop.wav";
// clickSound.volume = 0.6;
const SoundManager = {
  sounds: {},
  init: function() {
      // 預加載音效
      this.loadSound('click', './src/music/pop.wav', 5);
  },
  
  // 加載音效並創建音效池
  loadSound: function(id, src, poolSize = 3) {
      this.sounds[id] = {
          pool: [],
          index: 0,
          lastPlayed: 0
      };
      
      // 創建多個音效實例形成音效池
      for (let i = 0; i < poolSize; i++) {
          const audio = new Audio();
          audio.src = src;
          audio.load(); // 強制預加載
          this.sounds[id].pool.push(audio);
      }
  },
  
  // 播放音效
  play: function(id, volume = 0.6, minInterval = 50) {
      if (!this.sounds[id]) return;
      
      const now = Date.now();
      const sound = this.sounds[id];
      
      // 防止快速重複觸發 (至少間隔 minInterval 毫秒)
      if (now - sound.lastPlayed < minInterval) return;
      
      // 使用池中的下一個音效實例
      const audio = sound.pool[sound.index];
      audio.volume = volume;
      
      // 嘗試從頭開始播放
      audio.currentTime = 0;
      
      const playPromise = audio.play();
      if (playPromise) {
          playPromise.catch(e => console.log("播放失敗:", e));
      }
      
      // 更新索引和最後播放時間
      sound.index = (sound.index + 1) % sound.pool.length;
      sound.lastPlayed = now;
  }
};

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
  // 初始化音效管理器
  SoundManager.init();
  
  // 為所有帶有 sound-btn 類的按鈕添加點擊音效
  const soundButtons = document.querySelectorAll('.sound-btn');
  soundButtons.forEach(button => {
      button.addEventListener('click', function(e) {
          SoundManager.play('click');
      });
  });
});

async function showLeaderboard() {
  document.getElementById("leaderboard-container").style.display = "flex";

  const leaderboardContainer = document.getElementById("10_rank");
  leaderboardContainer.innerHTML = ""; // 清空之前顯示的排行榜
  
  // 等待排行榜數據和用戶排名加載完成
  try {
      await fetchLeaderboard();  // 確保取得排行榜數據
      await fetchUserRank();     // 確保取得用戶的排名
  } catch (error) {
      console.error("加載排行榜時發生錯誤:", error);
  }
}

// 檢查用戶登入狀態並更新 UI
export function checkUserStatus() {
  // 確保 Firebase 的狀態檢查在 DOM 完成加載後進行
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user); // 這行可以幫助檢查用戶狀態

    const startGameBtn = document.getElementById("start-game-btn");
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const characterSelection = document.getElementById("character-selection");
    const userhighScore = document.getElementById("score-highscore");
    const loginDescript = document.getElementById("login-description");
    if (user) {
      // 如果用戶已登入，顯示用戶的頭像和分數
      const userRef = ref(db, "users/" + user.uid);

      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log("用戶資料:", userData); // 輸出用戶資料以檢查是否正確

              // 使用原始用戶名顯示，使用安全用戶名查詢
            const originalUsername = userData.originalUsername || userData.username;
            const safeUsername = userData.username;
            const avatarUrl = userData.avatarUrl || "./src/img/avator_pocky.png"; // 預設頭像

            // 更新 UI，顯示用戶名稱和頭像
            const userStatusElement = document.getElementById("user-status");

            if (userStatusElement) {
              userStatusElement.innerHTML = `
                            <img src="${avatarUrl}" alt="avatar" id="user-avator" onclick="openProfileModal()"> 
                            <div class="d-flex flex-col gap-4 jc-c">
                              <span class="Cubic color-db fz-12">${originalUsername}</span>
                              <span class="pixel_box_primary fz-9 color-white">BEST: <span class="userhighscore fz-9 color-y"></span> </span>
                            <div>
                        `;
            }

           // **從 leaderboard/$username 取得 highscore**
           const leaderboardRef = ref(db, "leaderboard/" + safeUsername);

           get(leaderboardRef).then((leaderboardSnapshot) => {
               let highscore = 0;
               if (leaderboardSnapshot.exists()) {
                   highscore = leaderboardSnapshot.val().highscore || 0;
               }
               // **即時更新所有 `userhighscore` 類別的元素**
              document.querySelectorAll(".userhighscore").forEach(element => {
                element.innerText = highscore;
              });
               console.log("使用者最高分：" + highscore);
           }).catch((error) => {
               console.error("讀取排行榜數據失敗:", error);
               let highscore = 0;
           });

            startGameBtn.style.display = "block";
            loginBtn.style.display = "none";
            registerBtn.style.display = "none";
            logoutBtn.style.display = "block";
            characterSelection.style.display = "flex";
            loginDescript.style.display = "none";

            const isNewUser = userData.isNewUser;

            if (isNewUser === true) {
              // 顯示提示訊息
              const gameGuide = document.getElementById("game-guide");
              gameGuide.style.display = "flex";
              console.log("hint顯示");

              // 設置為非新用戶，下次不再顯示
              update(userRef, { isNewUser: false }); // 更新資料庫中的 isNewUser 為 false
            } else {
              console.log("非新用戶，不顯示提示");
            }
          } else {
            console.error("用戶資料不存在"); // 若用戶資料不存在
            alert("用戶資料不存在，請稍後再試！");
          }
        })
        .catch((error) => {
          console.error("讀取用戶資料錯誤:", error.message);
          alert("讀取用戶資料失敗，請稍後再試！");
        });
    } else {
      // 如果用戶未登入，顯示登入和註冊按鈕
      console.log("用戶未登入");
      const userStatusElement = document.getElementById("user-status");
      if (userStatusElement) {
        userStatusElement.innerHTML = `
                    <img src="./src/img/avator_pocky.png" alt="avatar" id="user-avator" onclick="openProfileModal()"> 
                    <div class="d-flex flex-col gap-4 jc-c">
                    <span class="Cubic color-db fz-12">未登入</span>
                    <span class="pixel_box_primary fz-9 color-white">BEST: <span class="userhighscore fz-9 color-y"></span> </span>
                    </div>
                `;
      }
      startGameBtn.style.display = "none";
      loginBtn.style.display = "block";
      registerBtn.style.display = "block";
      logoutBtn.style.display = "none";
      characterSelection.style.display = "none";
      loginDescript.style.display = "block";
    }
  });
}

// 打開個人資訊彈窗
window.openProfileModal = function () {
  const user = auth.currentUser;
  const userRef = ref(db, "users/" + user.uid);

  get(userRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const avatarUrl = userData.avatarUrl || "./src/img/avator_pocky.png";
        const originalUsername = userData.originalUsername || userData.username;
        const highscore = userData.highscore || 0; // 用戶的最高分數

        // 更新 lightbox 顯示的資料
        document.getElementById("profile-avatar").src = avatarUrl;
        document.getElementById("profile-username").innerText = `${originalUsername}`;
      }
    })
    .catch((error) => {
      console.error("讀取用戶資料錯誤:", error);
    });

  document.getElementById("profile-modal").style.display = "flex";
};



window.closeGameOverBox = function () {
  // document.getElementById("game-over").style.display = "none";
  // document.getElementById("login-out-section").style.display = "block";
  window.location.href = "index.html";
};



// 更改頭像
window.selectNewAvatar = function (avatarUrl) {
  const user = auth.currentUser;
  if (!user) {
    console.error("未登入，無法更改頭像");
    return;
  }

  const userRef = ref(db, "users/" + user.uid);

  // 更新用戶頭像
  update(userRef, { avatarUrl })
    .then(() => {
      console.log("頭像更新成功:", avatarUrl);
      const profileAvatar = document.getElementById("profile-avatar");
      const userAvatar = document.getElementById("user-avator");

      if (profileAvatar) profileAvatar.src = avatarUrl; // 更新 lightbox 頭像
      if (userAvatar) userAvatar.src = avatarUrl; // 更新頁面上的頭像
    })
    .catch((error) => {
      console.error("更改頭像錯誤:", error);
    });
};

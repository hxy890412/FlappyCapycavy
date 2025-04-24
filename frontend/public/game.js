// document.addEventListener('DOMContentLoaded', function() {
//     function isMobileDevice() {
//         return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
//                window.innerWidth <= 768;
//     }

//     if (!isMobileDevice()) {
//         document.body.innerHTML = ''; 
//         document.body.style.margin = '0';
//         document.body.style.padding = '0';
//         document.body.style.height = '100vh';
//         document.body.style.backgroundColor = '#ffffff';

//         const mobileOverlay = document.createElement('div');
//         mobileOverlay.innerHTML = `
//             <div style="
//                 background: #ffdcdc;
//                 position: fixed;
//                 top: 0;
//                 left: 0;
//                 width: 100%;
//                 height: 100%;
//                 display: flex;
//                 flex-direction: column;
//                 align-items: center;
//                 justify-content: center;
//                 padding: 20px;
//                 text-align: center;
//                 font-family: Arial, sans-serif;
//             ">
//                 <img src="./src/img/machi_pixel.svg" alt="Game Logo" style="width: 150px; margin-bottom: 20px;">
//                 <h1 style="font-size: 24px; margin-bottom: 20px; color: #333;">請使用手機開啟遊戲</h1>
//                 <p style="font-size: 18px; margin-bottom: 20px; color: #666;">本遊戲僅支援手機版本</p>
//                 <p style="font-size: 16px; color: #888;">請使用手機瀏覽器開啟</p>
//             </div>
//         `;

//         document.body.appendChild(mobileOverlay);
      
//         return; 
//     }
// });


// game.js
import { auth, db } from './firebase-config.js';
import { ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";


let canvas, ctx;
let gameInterval;  // 用來儲存遊戲的定時器 ID
let obstacleInterval; //生成障礙物
let score = 0;     // 記錄當前分數
let gameRunning = false;  // 遊戲是否正在運行
let grassHeight = 150;  // 草地高度
let lives = 3; // 生命數量
let obstacleSpeed = 3; // 障礙物速度
let isPaused = false; //是否暫停遊戲中
let isInvincible = false; //是否無敵模式
let invincibilityTimer = null; 
let isResurrecting = false; // 判斷是否復活中（為了設定復活中不可以按暫停和重啟

let gameCharacter = {
    x: 50,     // 角色的 X 坐標
    y: 100,     // 角色的 Y 坐標
    width: 50,  // 角色寬度
    height: 32, // 角色高度
    speed: 3,   // 角色跳躍速度
    velocity: 0, // 角色的垂直速度
    image: new Image(), // 角色圖片對象
    imageSrc: "./src/img/machi_pixel.svg", // 預設角色圖片
    invincibleImage: "./src/img/machi_invincible.svg",// 預設角色圖片
    offsetX: 0,
    offsetY: 0
};
gameCharacter.image.src = gameCharacter.imageSrc;


// 載入圖片
let grassImage = new Image();  // 草地
grassImage.src = "./src/img/grass.png"; 
let grassPosition = 0; // 用來控制草地滾動的變數
let carrotImage = new Image(); // 水管
carrotImage.src = "./src/img/carrot.png";
let heartImage = new Image(); // 生命
heartImage.src = "./src/img/heart.png";

// 障礙物的設置：上下水管
let obstacles = [];
let passedObstacles = 0;  // 記錄已通過的水管數量

// 控制方式變數
let controlMethod = "keyboard";  // 預設使用鍵盤控制

const AudioManager = {
    // 音效緩存池
    soundPools: {},
    
    // 初始化音效池
    initSoundPool: function(soundId, src, poolSize = 5) {
        this.soundPools[soundId] = {
            index: 0,
            sounds: []
        };
        
        // 創建多個音效實例
        for (let i = 0; i < poolSize; i++) {
            const sound = new Audio(src);
            sound.preload = 'auto';
            this.soundPools[soundId].sounds.push(sound);
        }
    },
    
    // 播放音效
    play: function(soundId, volume = 1) {
        if (!this.soundPools[soundId]) {
            console.error(`Sound '${soundId}' not initialized`);
            return;
        }
        
        const pool = this.soundPools[soundId];
        const sound = pool.sounds[pool.index];
        
        // 設置音量
        sound.volume = volume;
        
        // 從頭開始播放
        sound.currentTime = 0;
        
        // 播放音效
        const playPromise = sound.play();
        
        // 處理可能的播放異常
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error(`Error playing sound '${soundId}':`, error);
            });
        }
        
        // 更新索引到池中的下一個音效
        pool.index = (pool.index + 1) % pool.sounds.length;
    }
};
// let scoreSound = new Audio();
// scoreSound.src = "./src/music/pass.wav"; 
// scoreSound.volume = 1;

// let jumpSound = new Audio();
// jumpSound.src = "./src/music/jump.wav"; 
// jumpSound.volume = 0.7;


AudioManager.initSoundPool('scoreSound', './src/music/pass.wav', 3);
AudioManager.initSoundPool('jumpSound', './src/music/jump.wav', 5);


// 頁面載入時初始化Canvas
window.addEventListener("load", initCanvas);

function initCanvas() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;   // 設置畫布的寬度為螢幕寬度
    canvas.height = window.innerHeight; 
    // 設置Canvas大小為視窗大小
    resizeCanvas();
    // 監聽窗口大小變化
    window.addEventListener("resize", resizeCanvas);
    renderGame();
    // 重置為預設的 Machi 角色
    gameCharacter.imageSrc = "./src/img/machi_pixel.svg";
    gameCharacter.invincibleImage = "./src/img/machi_invincible.svg";
    // gameCharacter.image.src = gameCharacter.imageSrc;
    // gameCharacter.width = 50;
    // gameCharacter.height = 32;
    // gameCharacter.offsetX = 0;
    // gameCharacter.offsetY = 0;

    setCharacterImage( gameCharacter.imageSrc, 50, 32, 0, 0);
    
    // 角色選擇邏輯
    const chooseMachi = document.getElementById("choose-machi");
    const chooseCapybara = document.getElementById("choose-capybara");

    chooseMachi.addEventListener("click", function() {
        chooseMachi.src = "./src/img/machi_select.png"
        chooseCapybara.src = "./src/img/pocky_unselect.png"
        gameCharacter.imageSrc = "./src/img/machi_pixel.svg";
        // gameCharacter.image.src = gameCharacter.imageSrc;
        gameCharacter.invincibleImage = "./src/img/machi_invincible.svg";
        // gameCharacter.width = 50;
        // gameCharacter.height = 32;
        setCharacterImage(gameCharacter.imageSrc, 50, 32, 0, 0);
        console.log("角色是machi")
    });

    chooseCapybara.addEventListener("click", function() {
        chooseCapybara.src = "./src/img/pocky_select.png"
        chooseMachi.src = "./src/img/machi_unselect.png"
        gameCharacter.imageSrc = "./src/img/pocky.png";
        // gameCharacter.image.src = gameCharacter.imageSrc;
        gameCharacter.invincibleImage = "./src/img/pocky_invincible.png"
        // gameCharacter.width = 50;
        // gameCharacter.height = 32;
        setCharacterImage(gameCharacter.imageSrc, 50, 32, 0, 0);

        console.log("角色是pocky")
    });

    if(gameCharacter.imageSrc === "./src/img/machi_pixel.svg"){
        gameCharacter.invincibleImage = "./src/img/machi_invincible.svg";
    }else{
        gameCharacter.invincibleImage = "./src/img/pocky_invincible.png"
    }
    
    // 設置控制方式
    setControlMethod();
}

// 設置Canvas大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

//設置角色
function setCharacterImage(src, width, height, offsetX = 0, offsetY = 0) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        gameCharacter.image = img;
        gameCharacter.width = width;
        gameCharacter.height = height;
        gameCharacter.offsetX = offsetX;
        gameCharacter.offsetY = offsetY;
    };
}


// 設置遊戲開始邏輯
export function startGame() {
    if (gameRunning) return; // 防止重複啟動遊戲

     // 清除所有可能存在的定時器
     clearInterval(gameInterval);
     clearInterval(obstacleInterval);
     if (invincibilityTimer) {
         clearTimeout(invincibilityTimer);
     }

     // 重設遊戲狀態
     isPaused = false;
     score = 0;
     passedObstacles = 0; 
     gameCharacter.y = 100;  
     gameCharacter.velocity = 0;
     setCharacterImage(gameCharacter.imageSrc, 50, 32, 0, 0);
    //  gameCharacter.image.src = gameCharacter.imageSrc;
     obstacles = [];
     lives = 3; 
     obstacleSpeed = 3;
    //  gameCharacter.width = 50;
    //  gameCharacter.height = 32;
    //  gameCharacter.offsetX = 0;
    //  gameCharacter.offsetY = 0;


    // 更新UI
    document.getElementById("score-status").textContent = score;
    document.getElementById("container-bg").style.background = "#E7F3F9";
    // 設置遊戲控制
    setupControls();

    gameRunning = true;
    gameInterval = setInterval(gameLoop, 1000 / 60); 
    obstacleInterval = setInterval(createObstacle, 2000); 
}

export function pauseGame() {
    if (isResurrecting) return;
    if (!gameRunning) return;
    
    isPaused = true;
    clearInterval(gameInterval);
    clearInterval(obstacleInterval);

    Object.keys(AudioManager.soundPools).forEach(soundId => {
        AudioManager.soundPools[soundId].sounds.forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    });

    // 顯示暫停彈窗
    document.getElementById('pause-box').style.display = 'flex';
}

export function resumeGame() {
    if (!gameRunning || !isPaused) return;
    
    isPaused = false;
    
    gameInterval = setInterval(gameLoop, 1000 / 60);
    obstacleInterval = setInterval(createObstacle, 2000); 

    document.getElementById('pause-box').style.display = 'none';
}
// 全域函數：重新開始遊戲
export function pauseRestartGame() {
    if (isResurrecting) return;

    // 先停止所有現有的定時器
    clearInterval(gameInterval);
    clearInterval(obstacleInterval);
    
    // 清除無敵狀態相關的定時器
    if (invincibilityTimer) {
        clearTimeout(invincibilityTimer);
    }

    // 重設所有遊戲狀態
    gameRunning = false;
    isPaused = false;
    isInvincible = false;

    // 重置遊戲參數
    score = 0;
    passedObstacles = 0;
    lives = 3;
    obstacleSpeed = 3;

    
    // 重置角色位置和速度
    gameCharacter.y = 50;
    gameCharacter.velocity = 0;
    setCharacterImage(gameCharacter.imageSrc, 50, 32, 0, 0);
    // gameCharacter.width = 50;
    // gameCharacter.height = 32;
    // gameCharacter.offsetX = 0;
    // gameCharacter.offsetY = 0;
    // gameCharacter.image.src = gameCharacter.imageSrc;

    // 清空障礙物
    obstacles = [];

    // 更新UI
    document.getElementById("score-status").textContent = score;
    document.getElementById("container-bg").style.background = "#E7F3F9";

    // 隱藏遊戲結束畫面（如果是從遊戲結束畫面重新開始）
    const gameOverElement = document.getElementById("game-over");
    if (gameOverElement) {
        gameOverElement.style.display = "none";
    }

    document.getElementById('pause-box').style.display = 'none';

    // 重新設置控制
    setupControls();

    // 重新開始遊戲
    startGame();
}




// 遊戲主循環
function gameLoop() {
    if (isPaused) return;
    updateGame();
    renderGame();
}

// 更新遊戲狀態
function updateGame() {
    gameCharacter.velocity += 0.5; // 重力加速度
    gameCharacter.y += gameCharacter.velocity; // 更新 Y 坐標

    // 限制角色不會跳出畫面，保持在固定範圍內
    if (gameCharacter.y > canvas.height - gameCharacter.height - grassHeight) {
        gameCharacter.y = canvas.height - gameCharacter.height - grassHeight;
        gameCharacter.velocity = 0;
    } else if (gameCharacter.y < 0) {  // 確保角色不會飛出畫面上方
        gameCharacter.y = 0;
        gameCharacter.velocity = 0;
    }

    // 更新草地的位置，使其不斷滾動
    grassPosition -= 2;  // 每次更新時讓草地向左移動
    if (grassPosition <= -canvas.width) {  // 草地滾動完畢後重置
        grassPosition = 0;
    }

    // 更新障礙物位置
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= obstacleSpeed;
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
    });
    
    // 檢查玩家是否通過了障礙物，若是則增加分數
    obstacles.forEach(obstacle => {
        if (obstacle.x + obstacle.width < gameCharacter.x && !obstacle.passed) {
            obstacle.passed = true; // 標記已經通過
            score += 1;
            document.getElementById("score-status").textContent = score;
            AudioManager.play('scoreSound', 1);
        }
    });

    if (score >= 10) {
        document.getElementById("container-bg").style.background = "#1D2329";
        obstacleSpeed = 5;
    } else if (score >= 3) {
        document.getElementById("container-bg").style.background = "linear-gradient(180deg, #EED1AB 0%, #FDB2B2 100%)";
        obstacleSpeed = 4;
    }

    checkGameOver();
}

// 隨機生成障礙物（水管）
function createObstacle() {
    const gapHeight = 150; // 水管間隙的高度
    const grassHeight = 150;

    // 隨機產生上水管的高度，確保上水管位於草地之上
    const maxTopHeight = canvas.height - gapHeight - grassHeight;  // 最大的上水管高度（防止下水管為負數）
    const topPipeHeight = Math.floor(Math.random() * maxTopHeight); // 隨機產生上水管的高度

    // 計算下水管的高度
    const bottomPipeHeight = canvas.height - topPipeHeight - gapHeight - grassHeight; // 下水管的高度，減去草地的影響

    // 確保下水管不會出現負值（這樣就會保持正確的水管間隙）
    if (bottomPipeHeight < 0) {
        return; // 如果計算出來的下水管高度是負數，則不創建這個水管
    }

    // 創建一個水管對象，包含上水管和下水管
    obstacles.push({
        x: canvas.width,   // 障礙物從畫面右邊進來
        width: 50,  // 水管寬度
        gapHeight: gapHeight,  // 水管間隙高度
        topHeight: topPipeHeight,  // 上水管的高度
        bottomHeight: bottomPipeHeight,  // 下水管的高度
        passed: false  // 是否已經被通過
    });
}


// 渲染遊戲畫面
function renderGame() {
    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製草地（滾動效果）
    ctx.drawImage(grassImage, grassPosition, canvas.height - grassHeight, canvas.width, grassHeight);  
    ctx.drawImage(grassImage, grassPosition + canvas.width, canvas.height - grassHeight, canvas.width, grassHeight); 

    // 繪製角色
    ctx.drawImage(gameCharacter.image, gameCharacter.x + gameCharacter.offsetX , gameCharacter.y + gameCharacter.offsetY, gameCharacter.width, gameCharacter.height);
    
    // 繪製障礙物
    obstacles.forEach(obstacle => {
        // 繪製上水管
        ctx.drawImage(carrotImage, obstacle.x, 0, obstacle.width, obstacle.topHeight);
        
        // 繪製下水管
        ctx.drawImage(carrotImage, obstacle.x, canvas.height - obstacle.bottomHeight - grassHeight , obstacle.width, obstacle.bottomHeight);
    });
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(heartImage, 10 + i * 28, 66, 24, 24);
    }
}

// 停止遊戲邏輯
function stopGame() {
    clearInterval(gameInterval);
    clearInterval(obstacleInterval);  // 停止障礙物的生成
 
    gameRunning = false;


    const gameovermessage = document.getElementById("game-over-message");
    gameovermessage.style.display = "block";
    const scoreElement = document.getElementById("user-finalscore");
    scoreElement.textContent = score;
    setTimeout(() => {
        const gameOverElement = document.getElementById("game-over");
        gameOverElement.style.display = "flex";
        gameovermessage.style.display = "none";
    }, 1000);
    

    const user = auth.currentUser;

    if (user) {
        const userRef = ref(db, 'users/' + user.uid);
        
        get(userRef).then(snapshot => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const username = userData.username || "未知用戶"; // 確保 username 存在
                submitScore(username, score);
                console.log("遊戲結束，登入狀態，使用者名稱：", username);
            } else {
                console.error("無法取得使用者資料");
            }
        }).catch(error => {
            console.error("讀取使用者資料時發生錯誤：", error);
        });
    } else {
        console.log("尚未登入用戶");
    }
}

// 提交分數
function submitScore(username, score) {
    const leaderboardRef = ref(db, 'leaderboard/' + username);

    get(leaderboardRef).then(snapshot => {
        const existingScore = snapshot.val()?.highscore || 0;
        const userId = auth.currentUser.uid; 
        const gameOverElement = document.getElementById("game-over");
        const lightboxContent = gameOverElement.querySelector(".lightbox-content");

         // 首先移除已存在的 "新紀錄" 提示
         const existingNewRecordMessage = lightboxContent.querySelector(".NewRecord");
         if (existingNewRecordMessage) {
             existingNewRecordMessage.remove();
         }

        if (score > existingScore) {
            set(leaderboardRef, {
                uid: userId,
                highscore: score
            }).then(() => {
                console.log('分數提交成功');
                document.querySelectorAll(".userhighscore").forEach(element => {
                    element.innerText = score;
                });

                const newRecordMessage = document.createElement("div");
                newRecordMessage.classList.add("NewRecord");
                newRecordMessage.textContent = "新紀錄!"; // 使用 textContent，這樣可以避免被轉換為字符串

                lightboxContent.appendChild(newRecordMessage); // 將新元素添加到 lightboxContent 中
            }).catch((error) => {
                console.error('提交分數時發生錯誤：', error);
            });
        } else {
            console.log('分數未達到新高，未更新');
        }
    }).catch((error) => {
        console.error('取得排行榜分數時發生錯誤：', error);
    });
}

// 全域函數：重新開始遊戲
window.restartgame = function () {
    // 重設遊戲狀態
    isPaused = false;
    score = 0;
    passedObstacles = 0; // 重設通過的水管數量
    gameCharacter.y = 50;  // 重設角色的Y坐標
    setCharacterImage(gameCharacter.imageSrc, 50, 32, 0, 0);
    gameCharacter.velocity = 0;
    obstacles = [];
    lives = 3;
    obstacleSpeed = 3;
    document.getElementById("score-status").textContent = score;
  
    // 隱藏遊戲結束畫面
    const gameOverElement = document.getElementById("game-over");
    gameOverElement.style.display = "none";

    // 開始新的遊戲
    startGame();
}

// 關閉遊戲結束視窗
window.closeGameOverBox = function() {
    const gameOverElement = document.getElementById("game-over");
    gameOverElement.style.display = "none";
}

// 設置遊戲結束的條件
function checkGameOver() {
    obstacles.forEach(obstacle => {
        if (gameCharacter.x + gameCharacter.width > obstacle.x &&
            gameCharacter.x < obstacle.x + obstacle.width &&
            (gameCharacter.y < obstacle.topHeight || 
            gameCharacter.y + gameCharacter.height > canvas.height - obstacle.bottomHeight - grassHeight) && !isInvincible) {
            
            if(lives > 0){
                // gameCharacter.image.src = gameCharacter.invincibleImage;
                triggerCollision();
                console.log(`撞擊！剩餘生命：${lives}`);
                lives--;
            } else{
                stopGame();
            }
        }
    });

    // 碰到地板時才真的結束遊戲
    if (gameCharacter.y + gameCharacter.height >= canvas.height - grassHeight && !isInvincible) {
       
        if(lives > 0){
            isInvincible = true; // 進入無敵狀態
            // gameCharacter.image.src = gameCharacter.invincibleImage;
            triggerCollision();
            lives--;
            console.log(`撞擊！剩餘生命：${lives}`);
        } else{
            stopGame();
        }
    }
}

function triggerCollision() {
    isResurrecting = true;

    // 暫停遊戲1秒
    clearInterval(gameInterval);
    clearInterval(obstacleInterval);
    gameRunning = false;
    document.getElementById('resurrection').style.display = "block";
    isInvincible = true;
    setTimeout(() => {
        // gameCharacter.image.src = gameCharacter.invincibleImage;
        setCharacterImage(gameCharacter.invincibleImage, 60, 60, -5, -14);
        // gameCharacter.width = 60;
        // gameCharacter.height = 60;
        // gameCharacter.offsetX = -5;
        // gameCharacter.offsetY = -14;
        document.getElementById('resurrection').style.display = "none";
        if(gameCharacter.invincibleImage){
            console.log("無敵狀態切換成功");
        }
        isInvincible = true;
        gameRunning = true;
        gameInterval = setInterval(gameLoop, 1000 / 60);
        obstacleInterval = setInterval(createObstacle, 2000);
        isResurrecting = false; // 復活結束
        // 3秒後結束無敵狀態
        invincibilityTimer = setTimeout(() => {
            isInvincible = false;
            setCharacterImage(gameCharacter.imageSrc, 50, 32, 0, 0);
            // gameCharacter.width = 50;
            // gameCharacter.height = 32;
            // gameCharacter.offsetX = 0;
            // gameCharacter.offsetY = 0;
            // gameCharacter.image.src = gameCharacter.imageSrc;
            console.log("取消無敵")
        }, 3000);
    }, 2000);
}

// 設置遊戲控制
function setupControls() {
    // 移除之前的事件監聽器
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("touchstart", handleTouchStart);

    // 重新設置控制方式
    if (controlMethod === "keyboard") {
        window.addEventListener("keydown", handleKeyDown);
    } else if (controlMethod === "touch") {
        canvas.addEventListener("touchstart", handleTouchStart);
    }
}

// 鍵盤控制
function handleKeyDown(e) {
    if (e.key === " " || e.key === "ArrowUp") {  // 空格或上箭頭鍵
        gameCharacter.velocity = -7; // 跳躍
        AudioManager.play('jumpSound', 0.7);
    }
}

// 觸控控制
function handleTouchStart(e) {
    e.preventDefault();
    gameCharacter.velocity = -7; // 跳躍
    AudioManager.play('jumpSound', 0.7);
}

// 設置裝置控制方法
function setControlMethod() {
    if (window.innerWidth <= 800) {
        // 手機版
        controlMethod = "touch";
    } else {
        // 電腦版
        controlMethod = "keyboard";
    }
    
    // 如果遊戲正在運行，更新控制方式
    if (gameRunning) {
        setupControls();
    }
}

// 確認設備類型並設置控制方式
window.addEventListener("DOMContentLoaded", () => {
    setControlMethod();  // 設置控制方式

    // 偵測視窗大小變化，重新判斷控制方式
    window.addEventListener("resize", () => {
        setControlMethod();
        resizeCanvas();
    });

    // 防止觸控設備上的縮放
    window.addEventListener("touchmove", (e) => {
        if (gameRunning) {
            e.preventDefault();  // 防止移動時縮放
        }
    }, { passive: false });
});
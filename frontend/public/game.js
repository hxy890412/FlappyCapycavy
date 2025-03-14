// game.js
import { auth, db } from './firebase-config.js';  // 根據實際路徑調整
import { ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

let canvas, ctx;
let gameInterval;  // 用來儲存遊戲的定時器 ID
let obstacleInterval; 
let score = 0;     // 記錄當前分數
let gameRunning = false;  // 遊戲是否正在運行

let gameCharacter = {
    x: 50,     // 角色的 X 坐標
    y: 50,     // 角色的 Y 坐標
    width: 50,  // 角色寬度
    height: 50, // 角色高度
    speed: 3,   // 角色跳躍速度
    velocity: 0, // 角色的垂直速度
    image: new Image(), // 角色圖片對象
    imageSrc: "./src/img/avator_machi.png" // 預設角色圖片
};

// 載入角色圖片
gameCharacter.image.src = gameCharacter.imageSrc;

// 創建胡蘿蔔圖片
let carrotImage = new Image();
carrotImage.src = "./src/img/carrot.png";

// 障礙物的設置：上下水管
let obstacles = [];
let passedObstacles = 0;  // 記錄已通過的水管數量

// 控制方式變數
let controlMethod = "keyboard";  // 預設使用鍵盤控制

// 頁面載入時初始化Canvas
window.addEventListener("load", initCanvas);

function initCanvas() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;   // 設置畫布的寬度為螢幕寬度
    canvas.height = window.innerHeight * 0.99; 
    // 設置Canvas大小為視窗大小
    resizeCanvas();
    
    // 監聽窗口大小變化
    window.addEventListener("resize", resizeCanvas);
    
    // 角色選擇邏輯
    const chooseMachi = document.getElementById("choose-machi");
    const chooseCapybara = document.getElementById("choose-capybara");

    chooseMachi.addEventListener("click", function() {
        gameCharacter.imageSrc = "./src/img/avator_machi.png";
        gameCharacter.image.src = gameCharacter.imageSrc;
    });

    chooseCapybara.addEventListener("click", function() {
        gameCharacter.imageSrc = "./src/img/avator_pocky.png";
        gameCharacter.image.src = gameCharacter.imageSrc;
    });
    
    // 設置控制方式
    setControlMethod();
}

// 設置Canvas大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.99;
}

// 設置遊戲開始邏輯
export function startGame() {
    if (gameRunning) return; // 防止重複啟動遊戲

    // 重設遊戲狀態
    score = 0;
    passedObstacles = 0; // 重設通過的水管數量
    gameCharacter.y = 50;  // 重設角色的Y坐標
    gameCharacter.velocity = 0;
    obstacles = [];
    document.getElementById("score-status").textContent = score;

    // 設置遊戲控制
    setupControls();

    gameRunning = true;
    gameInterval = setInterval(gameLoop, 1000 / 60); // 每秒 60 幀，開始遊戲循環
    
    // 每隔一段時間生成一個新的障礙物
    obstacleInterval = setInterval(createObstacle, 1000); // 每 1 秒生成一個新障礙物
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
        gameCharacter.velocity = -8; // 跳躍
    }
}

// 觸控控制
function handleTouchStart(e) {
    e.preventDefault();
    gameCharacter.velocity = -8; // 跳躍
}

// 遊戲主循環
function gameLoop() {
    updateGame();
    renderGame();
}

// 更新遊戲狀態
function updateGame() {
    gameCharacter.velocity += 0.5; // 重力加速度
    gameCharacter.y += gameCharacter.velocity; // 更新 Y 坐標

    // 限制角色不會跳出畫面，保持在固定範圍內
    if (gameCharacter.y > canvas.height - gameCharacter.height) {
        gameCharacter.y = canvas.height - gameCharacter.height;
        gameCharacter.velocity = 0;
    } else if (gameCharacter.y < 0) {  // 確保角色不會飛出畫面上方
        gameCharacter.y = 0;
        gameCharacter.velocity = 0;
    }

    // 更新障礙物位置
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= 5; // 障礙物向左移動
        if (obstacle.x + obstacle.width < 0) { // 若障礙物離開畫面，刪除
            obstacles.splice(index, 1);
        }
    });

    // 檢查玩家是否通過了障礙物，若是則增加分數
    obstacles.forEach(obstacle => {
        if (obstacle.x + obstacle.width < gameCharacter.x && !obstacle.passed) {
            obstacle.passed = true; // 標記已經通過
            score += 1;
            document.getElementById("score-status").textContent = score;
        }
    });

    checkGameOver();
}

// 隨機生成障礙物（水管）
function createObstacle() {
    const gapHeight = 150; // 水管間隙的高度
    const pipeHeight = Math.floor(Math.random() * (canvas.height - gapHeight)); // 隨機產生上水管的高度
    const pipeWidth = 50;

    // 上水管和下水管的對齊方式
    const topPipeHeight = pipeHeight;  // 上水管的高度
    const bottomPipeHeight = canvas.height - topPipeHeight - gapHeight;  // 下水管的高度

    // 創建一個水管對象，包含上水管和下水管
    obstacles.push({
        x: canvas.width,   // 障礙物從畫面右邊進來
        width: pipeWidth,
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
   
    // 繪製角色
    ctx.drawImage(gameCharacter.image, gameCharacter.x, gameCharacter.y, gameCharacter.width, gameCharacter.height);
    
    // 繪製障礙物
    obstacles.forEach(obstacle => {
        // 繪製上水管
        ctx.drawImage(carrotImage, obstacle.x, 0, obstacle.width, obstacle.topHeight);
        
        // 繪製下水管
        ctx.drawImage(carrotImage, obstacle.x, canvas.height - obstacle.bottomHeight, obstacle.width, obstacle.bottomHeight);
    });
}

// 停止遊戲邏輯
function stopGame() {
    clearInterval(gameInterval);
    clearInterval(obstacleInterval);  // 停止障礙物的生成
 
    gameRunning = false;

    const gameOverElement = document.getElementById("game-over");
    const scoreElement = document.getElementById("user-highscore");
    scoreElement.textContent = score;
    gameOverElement.style.display = "flex";

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
        if (score > existingScore) {
            set(leaderboardRef, {
                uid: userId,
                highscore: score
            }).then(() => {
                console.log('分數提交成功');
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
    score = 0;
    passedObstacles = 0; // 重設通過的水管數量
    gameCharacter.y = 50;  // 重設角色的Y坐標
    gameCharacter.velocity = 0;
    obstacles = [];
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
        // 檢查是否碰到障礙物
        if (gameCharacter.x + gameCharacter.width > obstacle.x &&
            gameCharacter.x < obstacle.x + obstacle.width &&
            (gameCharacter.y < obstacle.topHeight || gameCharacter.y + gameCharacter.height > canvas.height - obstacle.bottomHeight)) {
            stopGame();
        }
    });
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
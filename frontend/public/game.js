// game.js
import { auth, db } from './firebase-config.js';  // 根據實際路徑調整
import { ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

let gameInterval;  // 用來儲存遊戲的定時器 ID
let score = 0;     // 記錄當前分數
let gameRunning = false;  // 遊戲是否正在運行

let gameCharacter = {
    x: 50,     // 角色的 X 坐標
    y: 100,    // 角色的 Y 坐標
    width: 50,  // 角色寬度
    height: 50, // 角色高度
    speed: 3,   // 角色跳躍速度
    velocity: 0, // 角色的垂直速度
    image: "./src/img/avator_machi.png" // 預設角色圖片
};

// 障礙物的設置
let obstacles = [];
const obstacleImages = [
    './src/img/carrot.png', // 障礙物圖片1
    './src/img/carrot.png', // 障礙物圖片2
    './src/img/carrot.png'  // 障礙物圖片3
];

// 控制方式變數
let controlMethod = "keyboard";  // 預設使用鍵盤控制

// 設置遊戲開始邏輯
export function startGame() {
    if (gameRunning) return; // 防止重複啟動遊戲

    // 重設遊戲狀態
    score = 0;
    gameCharacter.y = 100;
    gameCharacter.velocity = 0;
    obstacles = [];
    document.getElementById("score-status").textContent = score;

    gameRunning = true;
    gameInterval = setInterval(draw, 1000 / 60); // 每秒 60 幀，開始遊戲循環
}

// 每一幀的遊戲更新邏輯
function draw() {
    updateGame();
    renderGame();
}

// 更新遊戲狀態
function updateGame() {
    gameCharacter.velocity += 0.5; // 重力加速度
    gameCharacter.y += gameCharacter.velocity; // 更新 Y 坐標

    if (gameCharacter.y > window.innerHeight - gameCharacter.height) {
        gameCharacter.y = window.innerHeight - gameCharacter.height;
        gameCharacter.velocity = 0;
    }

    // 控制方式：鍵盤控制
    if (controlMethod === "keyboard") {
        window.addEventListener("keydown", (e) => {
            if (e.key === " " || e.key === "ArrowUp") {  // 空格或上箭頭鍵
                gameCharacter.velocity = -10; // 跳躍
            }
        });
    }

    // 控制方式：觸控控制
    else if (controlMethod === "touch") {
        window.addEventListener("touchstart", (e) => {
            e.preventDefault();
            gameCharacter.velocity = -10; // 跳躍
        });
    }

    if (Math.random() < 0.02) { // 隨機生成障礙物的機率
        createObstacle();
    }

    obstacles.forEach((obstacle, index) => {
        obstacle.x -= 5; // 障礙物向左移動
        if (obstacle.x + obstacle.width < 0) { // 若障礙物離開畫面，刪除
            obstacles.splice(index, 1);
        }
    });

    score += 1;
    document.getElementById("score-status").textContent = score;

    checkGameOver();
}

// 隨機生成障礙物
function createObstacle() {
    const obstacleHeight = Math.floor(Math.random() * (window.innerHeight / 2)) + 30; // 隨機高度
    const obstacleWidth = 50;
    const obstacleImage = obstacleImages[Math.floor(Math.random() * obstacleImages.length)]; // 隨機選擇障礙物圖片

    obstacles.push({
        x: window.innerWidth,   // 障礙物從畫面右邊進來
        y: window.innerHeight - obstacleHeight,
        width: obstacleWidth,
        height: obstacleHeight,
        image: obstacleImage   // 隨機圖片
    });
}

// 渲染遊戲畫面
function renderGame() {
    const gameContainer = document.getElementById("game-container");
    gameContainer.innerHTML = "";  // 清除畫布上的內容

    const characterElement = document.createElement("div");
    characterElement.id = "game-character";  // 設置ID以便更新背景圖片
    characterElement.style.position = "absolute";
    characterElement.style.left = gameCharacter.x + "px";
    characterElement.style.top = gameCharacter.y + "px";
    characterElement.style.width = gameCharacter.width + "px";
    characterElement.style.height = gameCharacter.height + "px";
    characterElement.style.backgroundImage = `url(${gameCharacter.image})`;  // 顯示選擇的角色
    characterElement.style.backgroundSize = "cover";
    gameContainer.appendChild(characterElement);

    obstacles.forEach(obstacle => {
        const obstacleElement = document.createElement("div");
        obstacleElement.style.position = "absolute";
        obstacleElement.style.left = obstacle.x + "px";
        obstacleElement.style.top = obstacle.y + "px";
        obstacleElement.style.width = obstacle.width + "px";
        obstacleElement.style.height = obstacle.height + "px";
        obstacleElement.style.backgroundImage = `url(${obstacle.image})`;
        obstacleElement.style.backgroundSize = "cover";
        gameContainer.appendChild(obstacleElement);
    });
}

// 停止遊戲邏輯
function stopGame() {
    clearInterval(gameInterval); // 停止遊戲循環
    gameRunning = false;
    alert("遊戲結束！分數：" + score);

    const user = auth.currentUser;

    if (user) {
        const userRef = ref(db, 'users/' + user.uid);
        const username = userRef.username;  // 若沒有設定 displayName，則使用 uid
        submitScore(username, score);
        console.log("遊戲結束，登入狀態");
    } else {
        console.log("尚未登入用戶");
    }
}

// 提交分數
function submitScore(username, score) {
    const leaderboardRef = ref(db, 'leaderboard/' + username);

    // 先取得現有的分數
    get(leaderboardRef).then(snapshot => {
        const existingScore = snapshot.val()?.score || 0; // 取得已存的分數，若無則預設為0

        // 判斷是否為最高分
        if (score > existingScore) {
            // 如果分數比較高，就更新分數
            set(leaderboardRef, {
                username: username,
                score: score
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




// 設置遊戲結束的條件
function checkGameOver() {
    obstacles.forEach(obstacle => {
        if (gameCharacter.x + gameCharacter.width > obstacle.x &&
            gameCharacter.x < obstacle.x + obstacle.width &&
            gameCharacter.y + gameCharacter.height > obstacle.y &&
            gameCharacter.y < obstacle.y + obstacle.height) {
            stopGame();
        }
    });

    if (gameCharacter.y >= window.innerHeight - gameCharacter.height) {
        stopGame();
    }
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
}

// 確認設備類型並設置控制方式
window.addEventListener("DOMContentLoaded", () => {
    setControlMethod();  // 設置控制方式

    // 偵測視窗大小變化，重新判斷控制方式
    window.addEventListener("resize", () => {
        setControlMethod();
    });
});

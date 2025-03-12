// game.js

let gameInterval;  // 用來儲存遊戲的定時器 ID
let score = 0;     // 記錄分數
let gameRunning = false;  // 遊戲是否正在運行

// 遊戲角色的初始設置
let gameCharacter = {
    x: 50,     // 角色的 X 坐標
    y: 100,    // 角色的 Y 坐標
    width: 50,  // 角色寬度
    height: 50, // 角色高度
    speed: 3,   // 角色跳躍速度
    velocity: 0, // 角色的垂直速度
    image: "./src/img/avator_machi.png" // 角色圖片
};

// 障礙物的設置
let obstacles = [];
const obstacleImages = [
    './src/img/carrot.png', // 障礙物圖片1
    './src/img/carrot.png', // 障礙物圖片2
    './src/img/carrot.png'  // 障礙物圖片3
];

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
    // 處理角色的重力與跳躍
    gameCharacter.velocity += 0.5; // 重力加速度
    gameCharacter.y += gameCharacter.velocity; // 更新 Y 坐標

    // 防止角色掉出畫面下方
    if (gameCharacter.y > window.innerHeight - gameCharacter.height) {
        gameCharacter.y = window.innerHeight - gameCharacter.height;
        gameCharacter.velocity = 0;
    }

    // 監聽鍵盤按鍵來控制角色跳躍
    window.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "ArrowUp") {  // 空格或上箭頭鍵
            gameCharacter.velocity = -10; // 跳躍
        }
    });

    // 隨機生成障礙物
    if (Math.random() < 0.02) { // 隨機生成障礙物的機率
        createObstacle();
    }

    // 更新障礙物位置
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= 5; // 障礙物向左移動
        if (obstacle.x + obstacle.width < 0) { // 若障礙物離開畫面，刪除
            obstacles.splice(index, 1);
        }
    });

    // 更新分數
    score += 1;  // 每一幀累積分數
    document.getElementById("score-status").textContent = score;

    // 檢查遊戲是否結束
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

    // 清除畫布上的內容
    gameContainer.innerHTML = "";

    // 在畫布上繪製角色
    const characterElement = document.createElement("div");
    characterElement.style.position = "absolute";
    characterElement.style.left = gameCharacter.x + "px";
    characterElement.style.top = gameCharacter.y + "px";
    characterElement.style.width = gameCharacter.width + "px";
    characterElement.style.height = gameCharacter.height + "px";
    characterElement.style.backgroundImage = `url(${gameCharacter.image})`;
    characterElement.style.backgroundSize = "cover";
    gameContainer.appendChild(characterElement);

    // 在畫布上繪製所有障礙物
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
}

// 設置遊戲結束的條件 (例如碰到障礙物)
function checkGameOver() {
    // 檢查角色是否與障礙物發生碰撞
    obstacles.forEach(obstacle => {
        if (gameCharacter.x + gameCharacter.width > obstacle.x &&
            gameCharacter.x < obstacle.x + obstacle.width &&
            gameCharacter.y + gameCharacter.height > obstacle.y &&
            gameCharacter.y < obstacle.y + obstacle.height) {
            stopGame(); // 角色與障礙物碰撞時停止遊戲
        }
    });

    // 角色掉出畫面
    if (gameCharacter.y >= window.innerHeight - gameCharacter.height) {
        stopGame(); // 角色掉出畫面時停止遊戲
    }
}

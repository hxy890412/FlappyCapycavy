import { getDatabase, ref, query, orderByChild, limitToFirst, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { auth } from "./firebase-config.js";

const db = getDatabase();
const leaderboardRef = ref(db, "leaderboard");

const leaderboardContainer = document.getElementById("10_rank");
const userRankContainer = document.querySelector(".user_rank");

// 獲取前 20 名玩家的排行榜
export async function fetchLeaderboard() {
    const leaderboardQuery = query(leaderboardRef, orderByChild("highscore"), limitToFirst(20));
    const snapshot = await get(leaderboardQuery);
    
    if (snapshot.exists()) {
        const leaderboardData = Object.entries(snapshot.val())  // 這會取得 {username: {highscore, uid}} 的結構
            .map(([username, data]) => ({ username, ...data }))  // 添加 username 作為欄位
            .sort((a, b) => b.highscore - a.highscore);  // 按 highscore 排序
        
        leaderboardContainer.innerHTML = "";  // 清空現有的排行榜
        
        leaderboardData.forEach((player, index) => {
            const playerElement = document.createElement("div");
            playerElement.classList.add("leaderboard-item");
            playerElement.innerHTML = `<span>#${index + 1}</span> ${player.username} - ${player.highscore} 分`;
            leaderboardContainer.appendChild(playerElement);
        });
    }
}


// 獲取當前使用者的排行
export async function fetchUserRank() {
    const snapshot = await get(leaderboardRef);
    if (snapshot.exists() && auth.currentUser) {
        const leaderboardData = Object.entries(snapshot.val())  // 這會取得 {username: {highscore, uid}} 的結構
            .map(([username, data]) => ({ username, ...data }))  // 添加 username 作為欄位
            .sort((a, b) => b.highscore - a.highscore);  // 按 highscore 排序

        const userId = auth.currentUser.uid;
        const userIndex = leaderboardData.findIndex(player => player.uid === userId);  // 使用 uid 來對比
        
        if (userIndex !== -1) {
            userRankContainer.innerHTML = `<p>你的排名: #${userIndex + 1} - ${leaderboardData[userIndex].username} - ${leaderboardData[userIndex].highscore} 分</p>`;
        } else {
            userRankContainer.innerHTML = `<p>你還沒有上榜哦，快來挑戰吧！</p>`;
        }
    }
}


// 監聽 Firebase Auth 狀態變更，確保能抓到當前用戶
auth.onAuthStateChanged((user) => {
    if (user) {
        fetchLeaderboard();
        fetchUserRank();
    }
});

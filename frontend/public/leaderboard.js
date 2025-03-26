import { getDatabase, ref, query, orderByChild, limitToFirst, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { auth } from "./firebase-config.js";

const db = getDatabase();
const leaderboardRef = ref(db, "leaderboard");
const usersRef = ref(db, "users");

const leaderboardContainer = document.getElementById("10_rank");
const userRankContainer = document.querySelector(".user_rank");

async function getUserAvatar(uid) {
    try {
        const userSnapshot = await get(ref(db, `users/${uid}`));
        if (userSnapshot.exists()) {
            return userSnapshot.val().avatarUrl || "./src/img/avator_pocky.png";
        }
        return "./src/img/avator_pocky.png";
    } catch (error) {
        console.error("Error fetching user avatar:", error);
        return "./src/img/avator_pocky.png";
    }
}

// 獲取前 20 名玩家的排行榜
export async function fetchLeaderboard() {
    const leaderboardQuery = query(leaderboardRef, orderByChild("highscore"), limitToFirst(20));
    const snapshot = await get(leaderboardQuery);
    
    if (snapshot.exists()) {
        // 使用 Promise.all 異步獲取每個玩家的頭像
        const leaderboardData = await Promise.all(
            Object.entries(snapshot.val())
                .map(async ([safeUsername, data]) => { 
                    // 取得用戶資料以獲取原始用戶名
                    const userSnapshot = await get(ref(db, `users/${data.uid}`));
                    const originalUsername = userSnapshot.exists() 
                        ? userSnapshot.val().originalUsername 
                        : safeUsername;
                    
                    return { 
                        username: originalUsername, 
                        ...data,
                        avatar: await getUserAvatar(data.uid)
                    };
                })
        );
        
        // 排序
        const sortedLeaderboard = leaderboardData
            .sort((a, b) => b.highscore - a.highscore)
            .slice(0, 20);
        
        leaderboardContainer.innerHTML = ""; // 清空現有的排行榜
        
        // 前三名的 div
        const topThreeDiv = document.createElement("div");
        topThreeDiv.classList.add("top-three");
        
        // 其他排名的 div
        const otherRanksDiv = document.createElement("div");
        otherRanksDiv.classList.add("other-ranks");
        
        sortedLeaderboard.forEach((player, index) => {
            const playerHTML = `
                <div class="leaderboard-item">
                    <div class="player_left">
                        <span class="player-rank">${index + 1}</span>
                        <span class="player-info">
                            <img src="${player.avatar}" alt="${player.username}'s avatar" class="player-avatar">
                            ${player.username}
                        </span>
                    </div>
                    <span class="player-score">${player.highscore} 分</span>
                </div>
            `;
            
            // 前三名加到 topThreeDiv
            if (index < 3) {
                topThreeDiv.innerHTML += playerHTML;
            } 
            // 其他排名加到 otherRanksDiv
            else {
                otherRanksDiv.innerHTML += playerHTML;
            }
        });
        
        // 將兩個 div 加入主容器
        leaderboardContainer.appendChild(topThreeDiv);
        leaderboardContainer.appendChild(otherRanksDiv);
    }
}


// 獲取當前使用者的排行
export async function fetchUserRank() {
    const snapshot = await get(leaderboardRef);
    if (snapshot.exists() && auth.currentUser) {
        const userId = auth.currentUser.uid;

        // 獲取當前用戶的頭像
        const userSnapshot = await get(ref(db, `users/${userId}`));
        const userAvatar = userSnapshot.exists() 
            ? userSnapshot.val().avatarUrl || "./src/img/default-avatar.png"
            : "./src/img/default-avatar.png";

        const originalUsername = userSnapshot.exists() 
        ? userSnapshot.val().originalUsername 
        : "未知用戶";

        const leaderboardData = Object.entries(snapshot.val())
            .map(([safeUsername, data]) => ({ username: safeUsername, ...data }))
            .sort((a, b) => b.highscore - a.highscore);

        const userIndex = leaderboardData.findIndex(player => player.uid === userId);
        
        if (userIndex !== -1) {
            const userRankHTML = `
                <div class="user-rank-item">
                    <div class="player_left">
                        <span class="player-rank">${userIndex + 1}</span>
                        <span class="player-info">
                            <img src="${userAvatar}" alt="Your avatar" class="player-avatar">
                            ${originalUsername}
                        </span>
                    </div>
                    <span class="player-score">${leaderboardData[userIndex].highscore} 分</span>
                </div>
            `;
            userRankContainer.innerHTML = userRankHTML;
        } else {
            userRankContainer.innerHTML = `
                <div class="user-rank-item not-ranked">
                    <p>你還沒有上榜哦，快來挑戰吧！</p>
                </div>
            `;
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

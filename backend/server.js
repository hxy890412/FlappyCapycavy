import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 根路由處理
app.get("/", (req, res) => {
    res.send("Welcome to the Fluppy Hamster backend server!");
});

// 🔹 初始化 Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync("firebase-admin.json", "utf8"));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://fluppy-hamster-default-rtdb.firebaseio.com/"
});

const db = admin.database();

// 🔹 API：提交分數
app.post("/submit-score", async (req, res) => {
    const { username, score } = req.body;

    if (!username || score == null) {
        return res.status(400).json({ error: "缺少 username 或 score" });
    }

    try {
        await db.ref("leaderboard/" + username).set({ score });
        res.json({ message: "分數已提交" });
    } catch (error) {
        res.status(500).json({ error: "提交失敗：" + error.message });
    }
});

// 🔹 API：取得排行榜
app.get("/leaderboard", async (req, res) => {
    try {
        const snapshot = await db.ref("leaderboard").orderByChild("score").limitToLast(10).once("value");
        const leaderboard = [];
        snapshot.forEach(child => leaderboard.push({ username: child.key, score: child.val().score }));
        leaderboard.reverse();
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: "獲取失敗：" + error.message });
    }
});

// 🔹 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`後端伺服器運行於 http://localhost:${PORT}`);
});

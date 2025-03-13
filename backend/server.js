// import express from "express";
// import cors from "cors";
// import admin from "firebase-admin";
// import dotenv from "dotenv";
// import fs from "fs";

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // 根路由處理
// app.get("/", (req, res) => {
//     res.send("Welcome to the Fluppy Hamster backend server!");
// });

// // 🔹 初始化 Firebase Admin
// const serviceAccount = JSON.parse(fs.readFileSync("firebase-admin.json", "utf8"));
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://fluppy-hamster-default-rtdb.firebaseio.com/"
// });

// const db = admin.database();

// // 🔹 API：提交分數
// // 確保後端可以正確處理來自前端的分數提交
// app.post('/submit-score', (req, res) => {
//     const { score } = req.body;
//     const token = req.headers.authorization?.split('Bearer ')[1]; // 從 Authorization 標頭取得 token
  
//     // 確保有收到分數和 token
//     if (!score || !token) {
//       return res.status(400).send({ message: '缺少分數或 token' });
//     }
  
//     // 驗證 token 並獲取用戶信息
//     admin.auth().verifyIdToken(token)
//       .then(decodedToken => {
//         const userId = decodedToken.uid;  // 確保你有拿到 uid
  
//         // 更新 Firestore 中的分數
//         const userRef = admin.firestore().collection('users').doc(userId);
  
//         userRef.set({
//           highScore: score  // 儲存分數
//         }, { merge: true })
//         .then(() => {
//           res.status(200).send({ message: '分數提交成功！' });
//         })
//         .catch(error => {
//           console.error('更新分數時發生錯誤:', error);
//           res.status(500).send({ message: '提交分數失敗' });
//         });
//       })
//       .catch(error => {
//         console.error('驗證 token 失敗:', error);
//         res.status(401).send({ message: '未授權' });
//       });
//   });
  


// // 🔹 API：取得排行榜
// app.get("/leaderboard", async (req, res) => {
//     try {
//         const snapshot = await db.ref("leaderboard").orderByChild("score").limitToLast(10).once("value");
//         const leaderboard = [];
//         snapshot.forEach(child => leaderboard.push({ username: child.key, score: child.val().score }));
//         leaderboard.reverse();
//         res.json(leaderboard);
//     } catch (error) {
//         res.status(500).json({ error: "獲取失敗：" + error.message });
//     }
// });

// // 🔹 啟動伺服器
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`後端伺服器運行於 http://localhost:${PORT}`);
// });

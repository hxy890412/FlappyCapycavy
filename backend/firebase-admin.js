// backend/firebase-admin.js
import admin from "firebase-admin";
import serviceAccount from "./firebase-admin.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fluppy-hamster-default-rtdb.firebaseio.com/",
});

export default admin;

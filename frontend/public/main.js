import { checkUserStatus,logout} from "./auth.js";
import { startGame } from "./game.js"; 

window.onload = () => {
    checkUserStatus();
};


document.getElementById("start-game-btn").addEventListener("click", () => {
  startGame();  
  document.getElementById("login-out-section").style.display = "none";  
});
document.getElementById("login-btn").addEventListener("click", () => window.location.href = "/login.html");
document.getElementById("register-btn").addEventListener("click", () => window.location.href = "/register.html");
document.getElementById("logout-btn").addEventListener("click", logout);

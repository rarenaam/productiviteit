import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDxCYAfIidmglAcgAbfgSPOtZ2HRHDHo7Q",
    authDomain: "productivitiet2.firebaseapp.com",
    projectId: "productivitiet2",
    storageBucket: "productivitiet2.firebasestorage.app",
    messagingSenderId: "492077829856",
    appId: "1:492077829856:web:7ca946d2d325ecfc724a85",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let timer;
let minutes = 25;
let seconds = 0;
let isRunning = false;
let currentUser = null;

const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const sessionDisplay = document.getElementById('sessionCount');
const userNameDisplay = document.getElementById('userNameDisplay');

// Auth status & Live Stats
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        userNameDisplay.textContent = user.displayName || user.email;
        const today = new Date().toISOString().split('T')[0];
        const docRef = doc(db, "users", user.uid, "stats", today);
        
        onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                sessionDisplay.textContent = docSnap.data().pomodoros || 0;
            }
        });
    } else {
        window.location.href = "../index.html"; // Terug naar login als niet ingelogd
    }
});

function updateDisplay() {
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.textContent = "Focus...";
    startBtn.disabled = true;
    startBtn.style.opacity = "0.5";

    timer = setInterval(() => {
        if (seconds === 0) {
            if (minutes === 0) {
                clearInterval(timer);
                saveSession();
                alert("Top gewerkt! Tijd voor 5 minuten pauze.");
                resetTimer();
                return;
            }
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        updateDisplay();
    }, 1000);
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    minutes = 25;
    seconds = 0;
    startBtn.textContent = "Start Focus";
    startBtn.disabled = false;
    startBtn.style.opacity = "1";
    updateDisplay();
}

async function saveSession() {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, "users", currentUser.uid, "stats", today);
    
    const docSnap = await getDoc(docRef);
    let currentCount = 0;
    if (docSnap.exists()) {
        currentCount = docSnap.data().pomodoros || 0;
    }

    await setDoc(docRef, { 
        pomodoros: currentCount + 1,
        lastSession: new Date()
    }, { merge: true });
}

startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);

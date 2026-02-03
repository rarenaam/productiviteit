// 1. Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 2. Firebase Config (Zelfde als je andere pagina's)
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

// 3. Variabelen & Elementen
let timer;
let minutes = 25;
let seconds = 0;
let isRunning = false;
let currentUser = null;

const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn'); // GEVONDEN: De reset knop
const sessionDisplay = document.getElementById('sessionCount');

// 4. Gebruiker checken & Data ophalen
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        // Luister live naar de stats van vandaag
        const today = new Date().toISOString().split('T')[0];
        const docRef = doc(db, "users", user.uid, "stats", today);
        
        onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                sessionDisplay.textContent = docSnap.data().pomodoros || 0;
            }
        });
    }
});

// 5. Timer Logica
function updateDisplay() {
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.textContent = "Bezig...";
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
    startBtn.style.opacity = "1";
    updateDisplay();
}

// 6. Opslaan in Firebase
async function saveSession() {
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, "users", currentUser.uid, "stats", today);
    
    // Haal huidige score op en doe er +1 bij
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

// 7. Event Listeners (DE FIX VOOR DE RESET KNOP)
startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer); // Nu luistert de knop wel!

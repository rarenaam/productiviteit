import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, increment, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Variabelen
let timerInterval = null;
let currentUser = null;
let isRunning = false;

// HTML Elementen
const startBtn = document.getElementById('startStudy');
const resetBtn = document.getElementById('resetTimer');
const statusText = document.getElementById('timer-status');
const countdownDisplay = document.getElementById('countdown');
const sessionDisplay = document.getElementById('sessionCount'); // Zorg dat dit ID in je HTML staat

// Auth status & Live Stats
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        // Luister live naar het totaal aantal sessies voor de teller op deze pagina
        const statsRef = doc(db, "users", user.uid, "stats", "pomodoro");
        onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists() && sessionDisplay) {
                sessionDisplay.textContent = docSnap.data().totalSessions || 0;
            }
        });
    } else {
        window.location.href = "../index.html";
    }
});

// --- START LOGICA ---
startBtn.addEventListener('click', async () => {
    if (isRunning) return;

    const totalMinutes = parseInt(document.getElementById('totalMinutes').value);
    if (!totalMinutes || totalMinutes <= 0) {
        alert("Voer een geldig aantal minuten in.");
        return;
    }

    // 1. Berekening (Python Logica)
    const PAUZE_DUUR = 5;
    let numSessies = Math.floor(totalMinutes / 30);
    let restTijd = totalMinutes % 30;
    let leerDuurPerSessie;

    if (numSessies > 0 && (restTijd / numSessies) < 5) {
        leerDuurPerSessie = 25 + (restTijd / numSessies);
    } else if (numSessies === 0) {
        leerDuurPerSessie = totalMinutes;
        numSessies = 1;
    } else {
        numSessies += 1;
        leerDuurPerSessie = (totalMinutes - ((numSessies - 1) * PAUZE_DUUR)) / numSessies;
    }

    if (leerDuurPerSessie > 35) {
        alert("Sessies zijn te lang (>35 min).");
        return;
    }

    isRunning = true;
    startBtn.disabled = true;
    startBtn.style.opacity = "0.5";

    // 2. De Automatische Loop
    for (let i = 1; i <= numSessies; i++) {
        if (!isRunning) break;

        // LEER SESSIE
        await runTimer(leerDuurPerSessie, `Sessie ${i}/${numSessies}: Focus`, "#2563eb");
        
        if (isRunning) {
            await saveSession(); // Sla op in Firebase
            
            // PAUZE (behalve na de laatste)
            if (i < numSessies) {
                await runTimer(PAUZE_DUUR, "Pauze... Ontspan", "#1e293b");
            }
        }
    }

    resetUI();
    if (isRunning) alert("Helemaal klaar! Goed gewerkt.");
});

// --- TIMER FUNCTIE ---
function runTimer(minuten, label, kleur) {
    return new Promise((resolve) => {
        clearInterval(timerInterval);
        let seconds = Math.round(minuten * 60);
        statusText.textContent = label;
        document.body.style.backgroundColor = kleur;

        timerInterval = setInterval(() => {
            if (!isRunning) {
                clearInterval(timerInterval);
                resolve();
                return;
            }

            seconds--;
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            countdownDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            if (seconds <= 0) {
                clearInterval(timerInterval);
                new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => {});
                resolve();
            }
        }, 1000);
    });
}

// --- DATABASE OPSLAG ---
async function saveSession() {
    if (!currentUser) return;
    const statsRef = doc(db, "users", currentUser.uid, "stats", "pomodoro");
    await setDoc(statsRef, { 
        totalSessions: increment(1) 
    }, { merge: true });
}

// --- RESET LOGICA ---
function resetUI() {
    isRunning = false;
    clearInterval(timerInterval);
    startBtn.disabled = false;
    startBtn.style.opacity = "1";
    document.body.style.backgroundColor = ""; 
    countdownDisplay.textContent = "00:00";
    statusText.textContent = "Klaar voor de start?";
}

resetBtn.addEventListener('click', resetUI);

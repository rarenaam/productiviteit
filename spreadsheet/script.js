// Voeg dit toe aan je timer/script.js
let timer;
let minutes = 25;
let seconds = 0;
let isRunning = false;
let sessionCount = 0; // Hoeveelheid voltooide sessies

const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');

function updateDisplay() {
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    timer = setInterval(() => {
        if (seconds === 0) {
            if (minutes === 0) {
                clearInterval(timer);
                saveSession(); // Sla op in Firebase als de sessie klaar is!
                alert("Tijd voor pauze!");
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

// Opslaan in Firebase
async function saveSession() {
    if (!currentUser) return;
    sessionCount++;
    const today = new Date().toISOString().split('T')[0]; // Alleen de datum
    const docRef = doc(db, "users", currentUser.uid, "stats", today);
    
    // We gebruiken 'merge: true' zodat we de teller kunnen ophogen
    await setDoc(docRef, { 
        pomodoros: sessionCount,
        lastSession: new Date()
    }, { merge: true });
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    minutes = 25;
    seconds = 0;
    updateDisplay();
}

startBtn.addEventListener('click', startTimer);

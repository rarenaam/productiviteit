// 1. Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, deleteDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 2. Firebase Config
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

// 3. Variabelen
const agendaBody = document.getElementById("agendaBody");
const daysRow = document.getElementById("daysRow");
const weekLabel = document.getElementById("weekLabel");

let currentDate = new Date();
let events = {}; // Wordt nu gevuld vanuit Firestore
let currentUser = null;
let unsubscribe = null;

const PX_PER_MINUTE = 1.333;
const PAUSES = [
    { start: "11:15", end: "11:35" },
    { start: "13:05", end: "13:35" },
];

// --- Hulpfuncties ---
function parseTime(baseDate, timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);
    return d;
}

function isInPause(time, baseDate) {
    return PAUSES.some(p => {
        const start = parseTime(baseDate, p.start);
        const end = parseTime(baseDate, p.end);
        return time >= start && time < end;
    });
}

function startOfWeek(date) {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
}

// --- Firebase Sync ---
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        setupAgendaListener(user.uid);
    } else {
        if (unsubscribe) unsubscribe();
        events = {};
        render();
    }
});

function setupAgendaListener(uid) {
    if (unsubscribe) unsubscribe();
    const colRef = collection(db, "users", uid, "agenda");
    
    unsubscribe = onSnapshot(colRef, (snapshot) => {
        events = {};
        snapshot.forEach((doc) => {
            events[doc.id] = doc.data().text;
        });
        render(); 
    });
}

// --- Render Functie ---
function render() {
    if (!agendaBody) return;
    agendaBody.innerHTML = "";
    daysRow.innerHTML = '<th class="time">Tijd</th>';

    const weekStart = startOfWeek(currentDate);
    weekLabel.textContent = weekStart.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        days.push(d);
        const th = document.createElement("th");
        th.textContent = d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" });
        daysRow.appendChild(th);
    }

    let time = parseTime(weekStart, "08:15");
    const end = parseTime(weekStart, "18:00");

    while (time < end) {
        const paused = isInPause(time, weekStart);
        const tr = document.createElement("tr");
        const rowMinutes = paused ? 20 : 45;
        tr.style.height = `${rowMinutes * PX_PER_MINUTE}px`;

        const timeCell = document.createElement("td");
        timeCell.className = "time";
        
        let blockEndTime;
        if (paused) {
            const p = PAUSES.find(p => parseTime(weekStart, p.start) <= time && time < parseTime(weekStart, p.end));
            blockEndTime = p.end;
        } else {
            blockEndTime = new Date(time.getTime() + 45 * 60 * 1000).toTimeString().slice(0, 5);
        }

        timeCell.textContent = `${time.toTimeString().slice(0, 5)} - ${blockEndTime}`;
        tr.appendChild(timeCell);

        days.forEach(day => {
            const td = document.createElement("td");
            if (paused) {
                td.style.background = "#020617";
                td.style.color = "#94a3b8";
                td.style.textAlign = "center";
                td.textContent = "Pauze";
            } else {
                const input = document.createElement("input");
                const slot = new Date(day);
                slot.setHours(time.getHours(), time.getMinutes(), 0, 0);
                const key = slot.toISOString();

                input.value = events[key] || "";
                input.placeholder = "...";
                input.disabled = !currentUser;

                // Opslaan in Firebase wanneer de focus van het veld afgaat (blur/change)
                input.addEventListener("change", async () => {
                    if (!currentUser) return;
                    const docRef = doc(db, "users", currentUser.uid, "agenda", key);
                    if (input.value.trim() === "") {
                        await deleteDoc(docRef);
                    } else {
                        await setDoc(docRef, { text: input.value, time: key });
                    }
                });

                td.appendChild(input);
            }
            tr.appendChild(td);
        });

        agendaBody.appendChild(tr);

        if (paused) {
            const pause = PAUSES.find(p => time >= parseTime(weekStart, p.start) && time < parseTime(weekStart, p.end));
            time = parseTime(weekStart, pause.end);
        } else {
            time = new Date(time.getTime() + 45 * 60 * 1000);
        }
    }
}

// --- Navigatie & Menu ---
document.getElementById("prev").addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 7);
    render();
});

document.getElementById("next").addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 7);
    render();
});

const hamburgerBtn = document.getElementById("hamburgerBtn");
const navMenu = document.getElementById("navMenu");

if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", () => {
        navMenu.classList.toggle("show");
    });
}

// Eerste render
render();

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, deleteDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const agendaBody = document.getElementById("agendaBody");
const daysRow = document.getElementById("daysRow");
const weekLabel = document.getElementById("weekLabel");
const userNameDisplay = document.getElementById("userNameDisplay");

let currentDate = new Date();
let events = {};
let currentUser = null;
let unsubscribe = null;

const PX_PER_MINUTE = 1.2;
const PAUSES = [
    { start: "11:15", end: "11:35" },
    { start: "13:05", end: "13:35" },
];

// Helper: Tijd parsen
function parseTime(baseDate, timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);
    return d;
}

// Helper: Is het pauze?
function isInPause(time, baseDate) {
    return PAUSES.some(p => {
        const start = parseTime(baseDate, p.start);
        const end = parseTime(baseDate, p.end);
        return time >= start && time < end;
    });
}

// Firebase Auth Status
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        userNameDisplay.textContent = user.displayName || user.email;
        setupAgendaListener(user.uid);
    } else {
        window.location.href = "../index.html";
    }
});

function setupAgendaListener(uid) {
    if (unsubscribe) unsubscribe();
    const colRef = collection(db, "users", uid, "agenda");
    unsubscribe = onSnapshot(colRef, (snapshot) => {
        events = {};
        snapshot.forEach((doc) => { events[doc.id] = doc.data().text; });
        render(); 
    });
}

function render() {
    if (!agendaBody) return;
    agendaBody.innerHTML = "";
    daysRow.innerHTML = '<th class="time-col">Tijd</th>';

    const weekStart = new Date(currentDate);
    const dayOffset = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - dayOffset);
    weekStart.setHours(0, 0, 0, 0);

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
    const end = parseTime(weekStart, "17:15");

    while (time < end) {
        const paused = isInPause(time, weekStart);
        const tr = document.createElement("tr");
        tr.style.height = paused ? "30px" : "60px";

        const timeCell = document.createElement("td");
        timeCell.className = "time-col";
        timeCell.textContent = time.toTimeString().slice(0, 5);
        tr.appendChild(timeCell);

        days.forEach(day => {
            const td = document.createElement("td");
            if (paused) {
                td.className = "pause-cell";
                td.textContent = "Pauze";
            } else {
                const input = document.createElement("input");
                const slotKey = new Date(day);
                slotKey.setHours(time.getHours(), time.getMinutes(), 0, 0);
                const key = slotKey.toISOString();

                input.value = events[key] || "";
                input.placeholder = "...";
                
                input.addEventListener("change", async () => {
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
        time = new Date(time.getTime() + (paused ? 20 : 45) * 60000);
    }
}

document.getElementById("prev").addEventListener("click", () => { currentDate.setDate(currentDate.getDate() - 7); render(); });
document.getElementById("next").addEventListener("click", () => { currentDate.setDate(currentDate.getDate() + 7); render(); });

render();

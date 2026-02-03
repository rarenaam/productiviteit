import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDxCYAfIidmglAcgAbfgSPOtZ2HRHDHo7Q",
    authDomain: "productivitiet2.firebaseapp.com",
    projectId: "productivitiet2",
    storageBucket: "productivitiet2.firebasestorage.app",
    messagingSenderId: "492077829856",
    appId: "1:492077829856:web:7ca946d2d325ecfc724a85",
    measurementId: "G-EFCMG6X53K"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let notes = [];
let selectedNoteId = null;
let currentUser = null;
let unsubscribeFromNotes = null;

const notesList = document.getElementById("notesList");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const addNoteBtn = document.getElementById("addNoteBtn");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");
const userNameDisplay = document.getElementById("userNameDisplay");

// UI Renderen
function renderNotes() {
    notesList.innerHTML = "";
    if (notes.length === 0) {
        notesList.innerHTML = "<li style='color:gray; font-size:0.8rem;'>Geen notities...</li>";
    }

    notes.forEach(note => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.textContent = note.title || "Naamloze notitie";
        if (note.id === selectedNoteId) btn.className = "active-note-btn";
        
        btn.addEventListener('click', () => {
            selectedNoteId = note.id;
            renderNotes();
            renderSelectedNote();
        });
        
        li.appendChild(btn);
        notesList.appendChild(li);
    });
}

function renderSelectedNote() {
    const note = notes.find(n => n.id === selectedNoteId);
    if (note) {
        noteTitle.value = note.title;
        noteContent.value = note.content;
        noteTitle.disabled = false;
        noteContent.disabled = false;
        deleteNoteBtn.disabled = false;
    } else {
        noteTitle.value = "";
        noteContent.value = "";
        noteTitle.disabled = true;
        noteContent.disabled = true;
        deleteNoteBtn.disabled = true;
    }
}

// Firebase listener
function setupNotesListener(uid) {
    if (unsubscribeFromNotes) unsubscribeFromNotes();
    const q = query(collection(db, "users", uid, "notes"), orderBy("createdAt", "desc"));

    unsubscribeFromNotes = onSnapshot(q, (snapshot) => {
        notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (!selectedNoteId && notes.length > 0) selectedNoteId = notes[0].id;
        renderNotes();
        renderSelectedNote();
    });
}

// Auth status
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        userNameDisplay.textContent = user.displayName || user.email;
        setupNotesListener(user.uid);
        addNoteBtn.disabled = false;
    } else {
        window.location.href = "../index.html"; // Terug naar home als niet ingelogd
    }
});

// Acties
addNoteBtn.addEventListener("click", async () => {
    const docRef = await addDoc(collection(db, "users", currentUser.uid, "notes"), {
        title: "Nieuwe Notitie",
        content: "",
        createdAt: serverTimestamp()
    });
    selectedNoteId = docRef.id;
});

deleteNoteBtn.addEventListener("click", async () => {
    if (confirm("Notitie verwijderen?")) {
        await deleteDoc(doc(db, "users", currentUser.uid, "notes", selectedNoteId));
        selectedNoteId = null;
    }
});

noteTitle.addEventListener("input", async () => {
    await updateDoc(doc(db, "users", currentUser.uid, "notes", selectedNoteId), { title: noteTitle.value });
});

noteContent.addEventListener("input", async () => {
    await updateDoc(doc(db, "users", currentUser.uid, "notes", selectedNoteId), { content: noteContent.value });
});

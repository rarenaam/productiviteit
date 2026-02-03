// 1. Imports met volledige URL's voor GitHub Pages compatibiliteit
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 2. Firebase Initialisatie
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

// 3. Globale variabelen
let notes = [];
let selectedNoteId = null;
let currentUser = null;
let unsubscribeFromNotes = null;

// 4. DOM elementen
const notesList = document.getElementById("notesList");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const addNoteBtn = document.getElementById("addNoteBtn");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navMenu = document.getElementById("navMenu");

// 5. UI Rendering Functies
function renderNotes() {
    notesList.innerHTML = "";
    if (notes.length === 0) {
        notesList.innerHTML = currentUser 
            ? "<li class='empty-state'>Geen notities gevonden. Klik op 'Nieuwe Notitie'.</li>"
            : "<li class='empty-state'>Log in om je notities te zien.</li>";
    }

    notes.forEach(note => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.textContent = note.title || "Naamloze notitie";
        
        // VEILIGE EVENT LISTENER (vervangt onclick voor CSP)
        btn.addEventListener('click', () => selectNote(note.id));
        
        if (note.id === selectedNoteId) btn.style.fontWeight = "bold";
        li.appendChild(btn);
        notesList.appendChild(li);
    });
    renderSelectedNote();
}

function selectNote(id) {
    selectedNoteId = id;
    renderNotes();
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

// 6. Firebase Data Operaties
function setupNotesListener(uid) {
    if (unsubscribeFromNotes) unsubscribeFromNotes();

    const userNotesCollectionRef = collection(db, "users", uid, "notes");
    const q = query(userNotesCollectionRef, orderBy("createdAt", "desc"));

    unsubscribeFromNotes = onSnapshot(q, (snapshot) => {
        notes = [];
        snapshot.forEach((doc) => {
            notes.push({ id: doc.id, ...doc.data() });
        });

        if (!selectedNoteId && notes.length > 0) {
            selectedNoteId = notes[0].id;
        } else if (notes.length === 0) {
            selectedNoteId = null;
        }
        renderNotes();
    }, (error) => {
        console.error("Fout bij laden:", error);
    });
}

// 7. Auth Listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        setupNotesListener(user.uid);
        addNoteBtn.disabled = false;
    } else {
        if (unsubscribeFromNotes) unsubscribeFromNotes();
        notes = [];
        selectedNoteId = null;
        renderNotes();
        addNoteBtn.disabled = true;
    }
});

// 8. Event Listeners voor Knoppen
addNoteBtn.addEventListener("click", async () => {
    if (!currentUser) return;
    try {
        const newNoteData = {
            title: "Nieuwe Notitie",
            content: "",
            createdAt: serverTimestamp()
        };
        const userNotesCollectionRef = collection(db, "users", currentUser.uid, "notes");
        const docRef = await addDoc(userNotesCollectionRef, newNoteData);
        selectedNoteId = docRef.id;
    } catch (error) {
        console.error("Fout bij toevoegen:", error);
    }
});

deleteNoteBtn.addEventListener("click", async () => {
    if (!currentUser || !selectedNoteId) return;
    if (confirm("Weet je zeker dat je deze notitie wilt verwijderen?")) {
        try {
            const noteDocRef = doc(db, "users", currentUser.uid, "notes", selectedNoteId);
            await deleteDoc(noteDocRef);
            selectedNoteId = null;
        } catch (error) {
            console.error("Fout bij verwijderen:", error);
        }
    }
});

noteTitle.addEventListener("input", async () => {
    if (!currentUser || !selectedNoteId) return;
    try {
        const noteDocRef = doc(db, "users", currentUser.uid, "notes", selectedNoteId);
        await updateDoc(noteDocRef, { title: noteTitle.value });
    } catch (error) {
        console.error("Fout bij updaten titel:", error);
    }
});

noteContent.addEventListener("input", async () => {
    if (!currentUser || !selectedNoteId) return;
    try {
        const noteDocRef = doc(db, "users", currentUser.uid, "notes", selectedNoteId);
        await updateDoc(noteDocRef, { content: noteContent.value });
    } catch (error) {
        console.error("Fout bij updaten inhoud:", error);
    }
});

hamburgerBtn.addEventListener("click", () => {
    navMenu.classList.toggle("show");
});

// Start de eerste render
renderNotes();

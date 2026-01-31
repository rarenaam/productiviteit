// notitie.js

// Importeer de nodige Firebase services
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// --- Firebase Initialisatie (aanpassen indien nodig) ---
// Als je Firebase al elders initialiseert en `db` en `auth` als globale variabelen beschikbaar zijn,
// kun je deze twee regels weglaten. Anders, zorg ervoor dat je FirebaseApp is geïnitialiseerd
// voordat je deze oproept, bijv:
// import { initializeApp } from "firebase/app";
// const firebaseConfig = { /* je config object */ };
// const app = initializeApp(firebaseConfig);
const db = getFirestore(); // Haal de Firestore database-instantie op
const auth = getAuth();     // Haal de Auth-instantie op
// --- Einde Firebase Initialisatie ---

// Globale variabelen
let notes = []; // Deze array zal nu gevuld worden met data uit Firestore
let selectedNoteId = null;
let currentUser = null; // Houdt de ingelogde gebruiker bij
let unsubscribeFromNotes = null; // Voor het opschonen van de Firestore listener

// DOM elementen
const notesList = document.getElementById("notesList");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const addNoteBtn = document.getElementById("addNoteBtn");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");

// Functies voor UI Rendering

function renderNotes() {
  notesList.innerHTML = "";
  if (notes.length === 0) {
    notesList.innerHTML = "<li class='empty-state'>Geen notities gevonden.</li>";
  }
  notes.forEach(note => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = note.title;
    btn.onclick = () => selectNote(note.id);
    if (note.id === selectedNoteId) btn.style.fontWeight = "bold";
    li.appendChild(btn);
    notesList.appendChild(li);
  });
  renderSelectedNote();
}

function selectNote(id) {
  selectedNoteId = id;
  renderNotes(); // Herrender om de geselecteerde notitie te markeren
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

// --- Firebase Data Operaties ---

// Real-time listener voor notities
function setupNotesListener(uid) {
  // Stop de vorige listener als deze bestaat
  if (unsubscribeFromNotes) {
    unsubscribeFromNotes();
  }

  const userNotesCollectionRef = collection(db, "users", uid, "notes");
  // Sorteer notities op 'createdAt' in aflopende volgorde
  const q = query(userNotesCollectionRef, orderBy("createdAt", "desc"));

  unsubscribeFromNotes = onSnapshot(q, (snapshot) => {
    notes = []; // Leeg de lokale array
    snapshot.forEach((doc) => {
      // Voeg elke notitie toe aan de array, inclusief de Firestore document ID
      notes.push({ id: doc.id, ...doc.data() });
    });

    // Selecteer de eerste notitie als er geen geselecteerde is, anders behoud de selectie
    if (!selectedNoteId && notes.length > 0) {
      selectedNoteId = notes[0].id;
    } else if (notes.length === 0) {
      selectedNoteId = null;
    } else if (!notes.some(n => n.id === selectedNoteId)) {
      // Als de geselecteerde notitie is verwijderd, selecteer de eerste
      selectedNoteId = notes[0] ? notes[0].id : null;
    }
    renderNotes(); // Update de UI
  }, (error) => {
    console.error("Fout bij het laden van notities:", error);
    // TODO: Toon een gebruikersvriendelijke foutmelding
  });
}

// Luister naar de authenticatiestatus
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    console.log("Gebruiker ingelogd:", user.uid);
    // Start de real-time listener voor notities van deze gebruiker
    setupNotesListener(user.uid);
    // Activeer UI elementen die alleen voor ingelogde gebruikers zijn
    addNoteBtn.disabled = false;
  } else {
    console.log("Gebruiker uitgelogd.");
    // Stop de notitie listener als de gebruiker uitlogt
    if (unsubscribeFromNotes) {
      unsubscribeFromNotes();
      unsubscribeFromNotes = null;
    }
    notes = []; // Leeg de lokale notities array
    selectedNoteId = null;
    renderNotes(); // Update de UI
    // Deactiveer UI elementen
    addNoteBtn.disabled = true;
  }
});

// Event Listeners voor Knoppen en Input

addNoteBtn.addEventListener("click", async () => {
  if (!currentUser) {
    alert("Je moet ingelogd zijn om notities toe te voegen.");
    return;
  }
  try {
    const newNoteData = {
      title: "Nieuwe Notitie",
      content: "",
      createdAt: serverTimestamp() // Voeg een timestamp toe voor sortering
    };
    const userNotesCollectionRef = collection(db, "users", currentUser.uid, "notes");
    const docRef = await addDoc(userNotesCollectionRef, newNoteData);
    selectedNoteId = docRef.id; // Selecteer de zojuist toegevoegde notitie
    // De `onSnapshot` listener zal de `notes` array automatisch updaten en `renderNotes` oproepen
  } catch (error) {
    console.error("Fout bij het toevoegen van notitie:", error);
    alert("Kon notitie niet toevoegen. Probeer het opnieuw.");
  }
});

deleteNoteBtn.addEventListener("click", async () => {
  if (!currentUser || !selectedNoteId) {
    alert("Selecteer een notitie om te verwijderen.");
    return;
  }
  const confirmation = confirm("Weet je zeker dat je deze notitie wilt verwijderen?");
  if (confirmation) {
    try {
      const noteDocRef = doc(db, "users", currentUser.uid, "notes", selectedNoteId);
      await deleteDoc(noteDocRef);
      // De `onSnapshot` listener zal de `notes` array automatisch updaten en `renderNotes` oproepen
      selectedNoteId = null; // Wis de selectie
    } catch (error) {
      console.error("Fout bij het verwijderen van notitie:", error);
      alert("Kon notitie niet verwijderen. Probeer het opnieuw.");
    }
  }
});

noteTitle.addEventListener("input", async () => {
  if (!currentUser || !selectedNoteId) return;
  const note = notes.find(n => n.id === selectedNoteId);
  if (note) {
    note.title = noteTitle.value; // Update lokaal voor snelle UI feedback
    renderNotes(); // Herrender om de titel in de sidebar direct te updaten
    try {
      const noteDocRef = doc(db, "users", currentUser.uid, "notes", selectedNoteId);
      await updateDoc(noteDocRef, { title: noteTitle.value });
    } catch (error) {
      console.error("Fout bij het bijwerken van titel:", error);
      // TODO: toon foutmelding aan gebruiker
    }
  }
});

noteContent.addEventListener("input", async () => {
  if (!currentUser || !selectedNoteId) return;
  const note = notes.find(n => n.id === selectedNoteId);
  if (note) {
    note.content = noteContent.value; // Update lokaal
    try {
      const noteDocRef = doc(db, "users", currentUser.uid, "notes", selectedNoteId);
      await updateDoc(noteDocRef, { content: noteContent.value });
    } catch (error) {
      console.error("Fout bij het bijwerken van inhoud:", error);
      // TODO: toon foutmelding aan gebruiker
    }
  }
});


// --- Hamburger menu logic --- (onveranderd)
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navMenu = document.getElementById("navMenu");

hamburgerBtn.addEventListener("click", () => {
  navMenu.classList.toggle("show");
});

// Initial render (zal leeg zijn totdat user inlogt en data laadt)
renderNotes();

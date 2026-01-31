// notes/script.js

// Importeer de nodige Firebase services
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// --- Firebase Initialisatie ---
// Deze const db en const auth halen de geinitialiseerde Firebase services op.
// Dit werkt omdat de initializeApp(firebaseConfig) al in je index.html wordt aangeroepen.
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
const deleteNoteBtn = document.getElementById("deleteNoteBtn"); // Let op: kleine correctie hier
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navMenu = document.getElementById("navMenu");


// Functies voor UI Rendering

function renderNotes() {
  notesList.innerHTML = "";
  if (notes.length === 0) {
    // Alleen tonen als er geen notities zijn EN een gebruiker is ingelogd
    if (currentUser) {
      notesList.innerHTML = "<li class='empty-state'>Geen notities gevonden. Klik op 'Nieuwe Notitie' om er een toe te voegen.</li>";
    } else {
      // Optioneel: bericht als niet ingelogd
      notesList.innerHTML = "<li class='empty-state'>Log in om je notities te zien.</li>";
    }
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
    // Zorg ervoor dat velden alleen bewerkbaar zijn als een notitie geselecteerd is EN ingelogd
    noteTitle.disabled = !currentUser;
    noteContent.disabled = !currentUser;
    deleteNoteBtn.disabled = !currentUser;
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

    // Beheer de selectie na het ophalen van notities
    if (!selectedNoteId && notes.length > 0) {
      selectedNoteId = notes[0].id; // Selecteer de eerste notitie als er nog geen geselecteerd is
    } else if (notes.length === 0) {
      selectedNoteId = null; // Geen notities, dus niets geselecteerd
    } else if (!notes.some(n => n.id === selectedNoteId)) {
      // Als de geselecteerde notitie is verwijderd of niet meer bestaat, selecteer de eerste
      selectedNoteId = notes[0] ? notes[0].id : null;
    }
    renderNotes(); // Update de UI
  }, (error) => {
    console.error("Fout bij het laden van notities:", error);
    // TODO: Toon een gebruikersvriendelijke foutmelding
    alert("Kon notities niet laden. Controleer je internetverbinding of log opnieuw in.");
  });
}

// Luister naar de authenticatiestatus
onAuthStateChanged(auth, (user) => {
  currentUser = user; // Sla de huidige gebruiker op
  if (user) {
    console.log("Gebruiker ingelogd:", user.uid);
    // Start de real-time listener voor notities van deze gebruiker
    setupNotesListener(user.uid);
    // Activeer UI elementen die alleen voor ingelogde gebruikers zijn
    addNoteBtn.disabled = false;
    // Als er notities zijn, en geselecteerd, dan de input velden en delete knop inschakelen
    if (selectedNoteId) {
      noteTitle.disabled = false;
      noteContent.disabled = false;
      deleteNoteBtn.disabled = false;
    }
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
    noteTitle.disabled = true;
    noteContent.disabled = true;
    deleteNoteBtn.disabled = true;
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
      selectedNoteId = null; // Wis de selectie na verwijdering
    } catch (error) {
      console.error("Fout bij het verwijderen van notitie:", error);
      alert("Kon notitie niet verwijderen. Probeer het opnieuw.");
    }
  }
});

noteTitle.addEventListener("input", async () => {
  if (!currentUser || !selectedNoteId) return; // Geen actie als niet ingelogd of geen notitie geselecteerd
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
  if (!currentUser || !selectedNoteId) return; // Geen actie als niet ingelogd of geen notitie geselecteerd
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


// Hamburger menu logic --- (onveranderd)
hamburgerBtn.addEventListener("click", () => {
  navMenu.classList.toggle("show");
});

// Initial render (zal leeg zijn totdat user inlogt en data laadt)
renderNotes();

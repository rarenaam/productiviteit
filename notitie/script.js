let notes = [
  { id: Date.now(), title: "Meeting Prep", content: "- Review Q3 report\n- Prepare slides" }
];

let selectedNoteId = notes[0] ? notes[0].id : null;

const notesList = document.getElementById("notesList");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const addNoteBtn = document.getElementById("addNoteBtn");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");

// Render notes in the sidebar
function renderNotes() {
  notesList.innerHTML = "";
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

// Select a note
function selectNote(id) {
  selectedNoteId = id;
  renderNotes();
}

// Show selected note in main area
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

// Event listeners for editing notes
noteTitle.addEventListener("input", () => {
  const note = notes.find(n => n.id === selectedNoteId);
  if (note) note.title = noteTitle.value;
  renderNotes();
});

noteContent.addEventListener("input", () => {
  const note = notes.find(n => n.id === selectedNoteId);
  if (note) note.content = noteContent.value;
});

// Add new note
addNoteBtn.addEventListener("click", () => {
  const newNote = { id: Date.now(), title: "New Note", content: "" };
  notes.unshift(newNote);
  selectedNoteId = newNote.id;
  renderNotes();
});

// Delete selected note
deleteNoteBtn.addEventListener("click", () => {
  notes = notes.filter(n => n.id !== selectedNoteId);
  selectedNoteId = notes[0] ? notes[0].id : null;
  renderNotes();
});

// Initial render
renderNotes();

// Hamburger menu toggle
const hamburgerBtn = document.getElementById("hamburgerBtn");
const sidebar = document.querySelector(".sidebar");

hamburgerBtn.addEventListener("click", () => {
  sidebar.classList.toggle("show");
});

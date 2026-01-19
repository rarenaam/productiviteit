const agendaBody = document.getElementById("agendaBody");
const daysRow = document.getElementById("daysRow");
const weekLabel = document.getElementById("weekLabel");

const burger = document.getElementById("burger");
const menu = document.getElementById("menu");
const agendaView = document.getElementById("agenda-view");
const notesView = document.getElementById("notes-view");
const notesArea = document.getElementById("notes");

let currentDate = new Date();
let events = {};

const PX_PER_MINUTE = 1.333;

const PAUSES = [
  { start: "11:15", end: "11:35" },
  { start: "13:05", end: "13:35" },
];

/* ---------- helpers ---------- */
function parseTime(baseDate, timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

function isInPause(time, baseDate) {
  return PAUSES.some(p => {
    const s = parseTime(baseDate, p.start);
    const e = parseTime(baseDate, p.end);
    return time >= s && time < e;
  });
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0,0,0,0);
  return d;
}

/* ---------- render agenda ---------- */
function render() {
  agendaBody.innerHTML = "";
  daysRow.innerHTML = '<th class="time">Tijd</th>';

  const weekStart = startOfWeek(currentDate);
  weekLabel.textContent =
    weekStart.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });

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

    const minutes = paused ? 20 : 45;
    tr.style.height = `${minutes * PX_PER_MINUTE}px`;

    const timeCell = document.createElement("td");
    timeCell.className = "time";

    let blockEnd;
    if (paused) {
      const p = PAUSES.find(p =>
        time >= parseTime(weekStart, p.start) &&
        time < parseTime(weekStart, p.end)
      );
      blockEnd = parseTime(weekStart, p.end);
    } else {
      blockEnd = new Date(time.getTime() + 45 * 60000);
    }

    timeCell.textContent =
      `${time.toTimeString().slice(0,5)} - ${blockEnd.toTimeString().slice(0,5)}`;
    tr.appendChild(timeCell);

    days.forEach(day => {
      const td = document.createElement("td");

      if (paused) {
        td.textContent = "Pauze";
        td.className = "pause";
      } else {
        const input = document.createElement("input");

        const slot = new Date(day);
        slot.setHours(time.getHours(), time.getMinutes(), 0, 0);
        const key = slot.toISOString();

        input.value = events[key] || "";
        input.placeholder = "...";

        input.oninput = () => {
          if (input.value.trim() === "") delete events[key];
          else events[key] = input.value;
        };

        td.appendChild(input);
      }
      tr.appendChild(td);
    });

    agendaBody.appendChild(tr);
    time = blockEnd;
  }

  addNowIndicator();
}

/* ---------- now indicator ---------- */
function addNowIndicator() {
  document.querySelectorAll(".now-indicator").forEach(e => e.remove());

  const now = new Date();
  const weekStart = startOfWeek(currentDate);
  const start = parseTime(weekStart, "08:15");
  const end = parseTime(weekStart, "18:00");

  if (now < start || now > end) return;

  let activeMinutes = 0;
  let totalMinutes = 0;

  for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + 1)) {
    if (!isInPause(t, weekStart)) totalMinutes++;
    if (t < now && !isInPause(t, weekStart)) activeMinutes++;
  }

  const rows = agendaBody.querySelectorAll("tr");
  let totalHeight = 0;
  rows.forEach(r => totalHeight += r.offsetHeight);

  const indicator = document.createElement("div");
  indicator.className = "now-indicator";
  indicator.style.top = `${(activeMinutes / totalMinutes)

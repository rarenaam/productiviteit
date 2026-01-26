const agendaBody = document.getElementById("agendaBody");
const daysRow = document.getElementById("daysRow");
const weekLabel = document.getElementById("weekLabel");

let currentDate = new Date();
let events = {};

const PX_PER_MINUTE = 1.333;

const PAUSES = [
  { start: "11:15", end: "11:35" },
  { start: "13:05", end: "13:35" },
];

// Hulp: converteer "HH:MM" naar Date
function parseTime(baseDate, timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

// Check of tijd in pauze valt
function isInPause(time, baseDate) {
  return PAUSES.some(p => {
    const start = parseTime(baseDate, p.start);
    const end = parseTime(baseDate, p.end);
    return time >= start && time < end;
  });
}

// Begin van de week (maandag)
function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0,0,0,0);
  return d;
}

// Render de agenda
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

    const rowMinutes = paused ? 20 : 45;
    tr.style.height = `${rowMinutes * PX_PER_MINUTE}px`;

    // Tijd-cel met start - einde
    const timeCell = document.createElement("td");
    timeCell.className = "time";

    const blockEnd = paused
      ? PAUSES.find(p => parseTime(weekStart, p.start) <= time && time < parseTime(weekStart, p.end))
      : new Date(time.getTime() + 45 * 60 * 1000);

    const endText = paused
      ? parseTime(weekStart, blockEnd.end).toTimeString().slice(0,5)
      : new Date(blockEnd).toTimeString().slice(0,5);

    timeCell.textContent = `${time.toTimeString().slice(0,5)} - ${endText}`;
    tr.appendChild(timeCell);

    // Event of pauze
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

        input.addEventListener("input", () => {
          if (input.value.trim() === "") {
            delete events[key];
          } else {
            events[key] = input.value;
          }
        });

        td.appendChild(input);
      }

      tr.appendChild(td);
    });

    agendaBody.appendChild(tr);

    // Volgende tijd
    if (paused) {
      const pause = PAUSES.find(p => {
        const s = parseTime(weekStart, p.start);
        const e = parseTime(weekStart, p.end);
        return time >= s && time < e;
      });
      time = parseTime(weekStart, pause.end);
    } else {
      time = new Date(time.getTime() + 45 * 60 * 1000);
    }
  }

  addNowIndicator();
}

// Vorige / volgende week
document.getElementById("prev").onclick = () => {
  currentDate.setDate(currentDate.getDate() - 7);
  render();
};

document.getElementById("next").onclick = () => {
  currentDate.setDate(currentDate.getDate() + 7);
  render();
};

function addNowIndicatorWithPauses() {
  document.querySelectorAll(".now-indicator").forEach(e => e.remove());

  const now = new Date();
  const weekStart = startOfWeek(currentDate);

  const agendaStart = parseTime(weekStart, "08:15");
  const agendaEnd = parseTime(weekStart, "18:00");

  if (now < agendaStart || now > agendaEnd) return;

  const tbody = document.getElementById("agendaBody");
  const rows = tbody.querySelectorAll("tr");
  if (rows.length === 0) return;

  // Bereken totale hoogte van alle tijdblokken
  let totalHeight = 0;
  rows.forEach(row => totalHeight += row.offsetHeight);

  // Bereken actieve minuten sinds start (pauzes overslaan)
  let activeMinutes = 0;
  let t = new Date(agendaStart);
  while (t < now) {
    if (!isInPause(t, weekStart)) activeMinutes++;
    t = new Date(t.getTime() + 60 * 1000);
  }

  // Totale actieve minuten in de dag (excl. pauzes)
  let totalActiveMinutes = 0;
  let tmp = new Date(agendaStart);
  while (tmp < agendaEnd) {
    if (!isInPause(tmp, weekStart)) totalActiveMinutes++;
    tmp = new Date(tmp.getTime() + 60 * 1000);
  }

  const top = (activeMinutes / totalActiveMinutes) * totalHeight;

  const indicator = document.createElement("div");
  indicator.className = "now-indicator";
  indicator.style.top = `${top}px`;

  const agendaWrapper = document.querySelector(".agenda-wrapper");
  agendaWrapper.appendChild(indicator);
}

// Roep aan na render
addNowIndicatorSimple();
setInterval(addNowIndicatorSimple, 1000);
render();

// Hamburger menu logic
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navMenu = document.getElementById("navMenu");

hamburgerBtn.addEventListener("click", () => {
  navMenu.classList.toggle("hide");
});



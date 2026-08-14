(function () {
  const SESSIONS_KEY = "brushlog_sessions";
  const ACTIVE_KEY = "brushlog_active_start";

  const elapsedEl = document.getElementById("elapsed");
  const toggleBtn = document.getElementById("toggleBtn");
  const statsBody = document.getElementById("statsBody");
  const emptyMsg = document.getElementById("emptyMsg");
  const todayCountEl = document.getElementById("todayCount");
  const totalCountEl = document.getElementById("totalCount");
  const streakCountEl = document.getElementById("streakCount");

  let sessions = loadSessions();
  let activeStart = loadActiveStart();
  let tickHandle = null;

  function loadSessions() {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveSessions() {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }

  function loadActiveStart() {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? Number(raw) : null;
  }

  function setActiveStart(ts) {
    activeStart = ts;
    if (ts === null) {
      localStorage.removeItem(ACTIVE_KEY);
    } else {
      localStorage.setItem(ACTIVE_KEY, String(ts));
    }
  }

  function formatElapsed(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "numeric" });
  }

  function dateKey(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function tick() {
    if (activeStart === null) return;
    elapsedEl.textContent = formatElapsed(Date.now() - activeStart);
  }

  function startTimer() {
    setActiveStart(Date.now());
    toggleBtn.textContent = "Zähneputzen stoppen";
    toggleBtn.classList.add("running");
    tick();
    tickHandle = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (activeStart === null) return;
    const end = Date.now();
    sessions.push({ start: activeStart, end });
    saveSessions();
    setActiveStart(null);
    clearInterval(tickHandle);
    tickHandle = null;
    elapsedEl.textContent = "00:00";
    toggleBtn.textContent = "Zähneputzen starten";
    toggleBtn.classList.remove("running");
    render();
  }

  function deleteSession(index) {
    sessions.splice(index, 1);
    saveSessions();
    render();
  }

  function computeStreak() {
    if (sessions.length === 0) return 0;
    const days = new Set(sessions.map((s) => dateKey(s.start)));
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (true) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (days.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function render() {
    const sorted = [...sessions].sort((a, b) => b.start - a.start);

    statsBody.innerHTML = "";
    emptyMsg.style.display = sorted.length === 0 ? "block" : "none";

    sorted.forEach((session) => {
      const realIndex = sessions.indexOf(session);
      const tr = document.createElement("tr");

      const duration = formatElapsed(session.end - session.start);
      tr.innerHTML = `
        <td>${formatDate(session.start)}</td>
        <td>${formatTime(session.start)}</td>
        <td>${formatTime(session.end)}</td>
        <td>${duration}</td>
        <td><button class="delete-btn" title="Löschen" data-index="${realIndex}">✕</button></td>
      `;
      statsBody.appendChild(tr);
    });

    statsBody.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        deleteSession(Number(btn.dataset.index));
      });
    });

    const todayKey = dateKey(Date.now());
    todayCountEl.textContent = sessions.filter((s) => dateKey(s.start) === todayKey).length;
    totalCountEl.textContent = sessions.length;
    streakCountEl.textContent = computeStreak();
  }

  toggleBtn.addEventListener("click", () => {
    if (activeStart === null) {
      startTimer();
    } else {
      stopTimer();
    }
  });

  if (activeStart !== null) {
    toggleBtn.textContent = "Zähneputzen stoppen";
    toggleBtn.classList.add("running");
    tick();
    tickHandle = setInterval(tick, 1000);
  }

  render();
})();

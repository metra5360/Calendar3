(function () {
  var STATUSES = ["green", "orange", "red"];
  var DAYS_COUNT = 7;
  var USERS = ["Я", "Друг"];

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function getDateStrings() {
    var out = [];
    var d = new Date();
    for (var i = 0; i < DAYS_COUNT; i++) {
      var copy = new Date(d);
      copy.setDate(d.getDate() + i);
      out.push(
        copy.getFullYear() +
          "-" +
          String(copy.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(copy.getDate()).padStart(2, "0")
      );
    }
    return out;
  }

  function formatDayLabel(dateStr) {
    var d = new Date(dateStr + "T12:00:00");
    var today = todayStr();
    if (dateStr === today) return "Сьогодні";
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  }

  function isToday(dateStr) {
    return dateStr === todayStr();
  }

  function nextStatus(current) {
    var i = STATUSES.indexOf(current);
    return STATUSES[(i + 1) % STATUSES.length];
  }

  function buildCalendar() {
    var body = document.getElementById("calendar-body");
    body.innerHTML = "";
    var dates = getDateStrings();
    dates.forEach(function (dateStr) {
      var row = document.createElement("div");
      row.className = "calendar-row" + (isToday(dateStr) ? " today" : "");
      row.innerHTML =
        '<div class="day-label">' +
        formatDayLabel(dateStr) +
        '</div><div class="cell green" data-date="' +
        dateStr +
        '" data-user="Я"></div><div class="cell green" data-date="' +
        dateStr +
        '" data-user="Друг"></div>';
      body.appendChild(row);
    });
  }

  function setCellState(cellEl, status) {
    cellEl.className = "cell " + status;
  }

  function getCell(date, user) {
    return document.querySelector('.cell[data-date="' + date + '"][data-user="' + user + '"]');
  }

  function loadFromDb() {
    if (!window.sb) return;
    var dates = getDateStrings();
    window.sb
      .from("calendar_entries")
      .select("date, user, status")
      .in("date", dates)
      .then(function (res) {
        if (res.error) return;
        (res.data || []).forEach(function (row) {
          var el = getCell(row.date, row.user);
          if (el) setCellState(el, row.status);
        });
      });
  }

  function upsertCell(date, user, status) {
    if (!window.sb) return;
    window.sb
      .from("calendar_entries")
      .upsert({ date: date, user: user, status: status }, { onConflict: "date,user" })
      .then(function (res) {
        if (res.error) console.warn("Supabase upsert error:", res.error);
      });
  }

  function setupRealtime() {
    if (!window.sb) return;
    var dates = getDateStrings();
    window.sb
      .channel("calendar_entries")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_entries" },
        function (payload) {
          var row = payload.new || payload.old;
          if (!row) return;
          if (dates.indexOf(row.date) === -1) return;
          var el = getCell(row.date, row.user);
          if (el) setCellState(el, row.status || "green");
        }
      )
      .subscribe();
  }

  function onCellClick(ev) {
    var cell = ev.target.closest(".cell");
    if (!cell) return;
    var date = cell.dataset.date;
    var user = cell.dataset.user;
    var current = cell.classList.contains("orange")
      ? "orange"
      : cell.classList.contains("red")
        ? "red"
        : "green";
    var next = nextStatus(current);
    setCellState(cell, next);
    upsertCell(date, user, next);
  }

  function renderHeaderDate() {
    var d = new Date();
    var options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    document.getElementById("today-date").textContent = d.toLocaleDateString("uk-UA", options);
  }

  function init() {
    renderHeaderDate();
    buildCalendar();

    document.getElementById("calendar-body").addEventListener("click", onCellClick);

    // Theme (light/dark)
    (function () {
      var btn = document.getElementById("theme-toggle");
      if (!btn) return;

      function applyTheme(theme) {
        var dark = theme === "dark";
        document.body.classList.toggle("dark", dark);
        btn.setAttribute("aria-pressed", dark ? "true" : "false");
        btn.textContent = dark ? "Світла тема" : "Темна тема";
      }

      var saved = null;
      try { saved = localStorage.getItem("theme"); } catch (e) {}
      if (saved !== "dark" && saved !== "light") saved = "light";
      applyTheme(saved);

      btn.addEventListener("click", function () {
        var next = document.body.classList.contains("dark") ? "light" : "dark";
        try { localStorage.setItem("theme", next); } catch (e) {}
        applyTheme(next);
      });
    })();

    loadFromDb();
    setupRealtime();

    document.getElementById("copy-link").addEventListener("click", function () {
      navigator.clipboard.writeText(window.location.href).then(
        function () { alert("Посилання скопійовано!"); },
        function () { prompt("Скопіюйте посилання:", window.location.href); }
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

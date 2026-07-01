// ================== STATISTICS v7.7 (با PDF) ==================
import { state } from "../core/state.js";
import { getTodayDateString, formatFaDate, showToast } from "../core/utils.js";

let charts = {};
let selectedDate = new Date();

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toDateString());
  }
  return days;
}

function getFocusSessionsPerDay(dates) {
  return dates.map((date) => {
    const log = state.focusLog.find((l) => l.date === date);
    return log ? log.sessions : 0;
  });
}

function getMealsPerDay(dates) {
  return dates.map((date) => {
    const meals = state.nutritionLog.filter((m) => m.date === date);
    return meals.length;
  });
}

function getExerciseMinutesPerDay(dates) {
  return dates.map((date) => {
    const minutes = state.exerciseLog
      .filter((e) => e.date === date)
      .reduce((sum, e) => sum + e.minutes, 0);
    return minutes;
  });
}

function getPointsEarnedPerDay(dates) {
  const sc = state.scoring;
  return dates.map((date) => {
    const focusSessions =
      state.focusLog.find((l) => l.date === date)?.sessions || 0;
    const meals = state.nutritionLog.filter((m) => m.date === date).length;
    const exercise =
      state.exerciseLog.filter((e) => e.date === date).length > 0 ? 1 : 0;
    const journal = state.journalEntries.find((j) => j.date === date) ? 1 : 0;
    let points = 0;
    points += focusSessions * (sc.focusSession || 10);
    if (meals >= 3) points += sc.meals || 5;
    if (exercise) points += sc.exercise || 8;
    if (journal) points += sc.journal || 5;
    return points;
  });
}

// ------------------ تقویم شمسی ------------------
function getPersianCalendar(currentDate) {
  const jMoment = window.moment;
  if (!jMoment) return { days: [], monthName: "", year: "" };
  const jDate = jMoment(currentDate).locale("fa");
  const daysInMonth = jDate.jDaysInMonth();
  const monthName = jDate.format("jMMMM");
  const year = jDate.format("jYYYY");
  const firstDayOfMonth = jMoment(currentDate).startOf("jMonth").toDate();
  const firstDayIndex = firstDayOfMonth.getDay();
  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);
  return { days: daysArray, monthName, year, daysInMonth };
}

function renderCalendar(container, selectedDateM) {
  const jMoment = window.moment;
  if (!jMoment) {
    container.innerHTML =
      '<p style="color:var(--text3);">خطا در بارگذاری تقویم</p>';
    return;
  }
  const cal = getPersianCalendar(selectedDateM);
  const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
  let html = `
    <div class="calendar-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <button class="small" id="prevMonthBtn">◀ ماه قبل</button>
      <h4 style="margin:0;">${cal.monthName} ${cal.year}</h4>
      <button class="small" id="nextMonthBtn">ماه بعد ▶</button>
    </div>
    <div class="calendar-grid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:6px; text-align:center;">
  `;
  weekDays.forEach(
    (d) =>
      (html += `<div style="font-size:0.8rem; color:var(--text3);">${d}</div>`),
  );
  for (let i = 0; i < cal.days.length; i++) {
    const day = cal.days[i];
    if (day === null) {
      html += `<div style="background:transparent;"></div>`;
    } else {
      const isToday =
        selectedDateM.getDate() === day &&
        selectedDateM.getMonth() === selectedDateM.getMonth() &&
        selectedDateM.getFullYear() === selectedDateM.getFullYear();
      html += `<div class="calendar-day ${isToday ? "today" : ""}" data-day="${day}" style="padding:8px; border-radius:8px; cursor:pointer; background:var(--surface2); transition:0.2s;">${day}</div>`;
    }
  }
  html += `</div>`;
  container.innerHTML = html;

  document.querySelectorAll(".calendar-day").forEach((el) => {
    el.onclick = () => {
      const day = parseInt(el.dataset.day);
      const newDate = new Date(selectedDateM);
      newDate.setDate(day);
      selectedDate = newDate;
      renderCalendar(container, selectedDate);
      showStatsForDate(selectedDate);
    };
  });
  document.getElementById("prevMonthBtn")?.addEventListener("click", () => {
    const newDate = new Date(selectedDateM);
    newDate.setMonth(newDate.getMonth() - 1);
    selectedDate = newDate;
    renderCalendar(container, selectedDate);
    showStatsForDate(selectedDate);
  });
  document.getElementById("nextMonthBtn")?.addEventListener("click", () => {
    const newDate = new Date(selectedDateM);
    newDate.setMonth(newDate.getMonth() + 1);
    selectedDate = newDate;
    renderCalendar(container, selectedDate);
    showStatsForDate(selectedDate);
  });
}

function showStatsForDate(date) {
  const dateStr = date.toDateString();
  const focus = state.focusLog.find((l) => l.date === dateStr)?.sessions || 0;
  const focusMin = state.focusLog.find((l) => l.date === dateStr)?.minutes || 0;
  const meals = state.nutritionLog.filter((m) => m.date === dateStr).length;
  const exercise = state.exerciseLog.filter((e) => e.date === dateStr).length;
  const exerciseMin = state.exerciseLog
    .filter((e) => e.date === dateStr)
    .reduce((s, e) => s + e.minutes, 0);
  const journal = state.journalEntries.find((j) => j.date === dateStr)
    ? "✅"
    : "❌";
  const water = (state.waterIntake || []).filter((v) => v === 4).length;
  const waterGoal =
    state.waterMode === "cups" ? state.waterGoalCups : state.waterGoalBottles;

  const html = `
    <div class="card" style="margin-top:16px;">
      <h4>📅 آمار روز ${formatFaDate(date)}</h4>
      <div class="dashboard-grid" style="grid-template-columns:repeat(auto-fit, minmax(120px,1fr));">
        <div>🎯 فوکوس: ${focus} جلسه (${focusMin} دقیقه)</div>
        <div>🍽️ وعده: ${meals} وعده</div>
        <div>🏃 ورزش: ${exercise} بار (${exerciseMin} دقیقه)</div>
        <div>💧 آب: ${water}/${waterGoal}</div>
        <div>📖 ژورنال: ${journal}</div>
      </div>
    </div>
  `;
  const existing = document.getElementById("dayStats");
  if (existing) existing.innerHTML = html;
  else {
    const statsDiv = document.createElement("div");
    statsDiv.id = "dayStats";
    document.getElementById("statsChartsContainer")?.after(statsDiv);
    statsDiv.innerHTML = html;
  }
}

// ------------------ رندر اصلی آمار ------------------
export function renderStats(container) {
  const dates = getLast7Days();
  const focusData = getFocusSessionsPerDay(dates);
  const mealsData = getMealsPerDay(dates);
  const exerciseData = getExerciseMinutesPerDay(dates);
  const pointsData = getPointsEarnedPerDay(dates);

  const totalFocusSessions = state.focusSessions;
  const totalFocusMinutes = state.focusMinutes;
  const totalPoints = state.totalPoints || 0;
  const currentLevel = state.userLevel || 1;

  const badgesList = state.badges
    .map((bId) => {
      const badge = window.ALL_BADGES?.find((b) => b.id === bId);
      return badge
        ? `<div class="badge" style="background:var(--accent); margin:4px;">${badge.name}</div>`
        : "";
    })
    .join("");

  let html = `
    <div class="fade-in" style="display:flex; flex-direction:column; gap:24px;">
      <!-- خلاصه کارت‌ها -->
      <div class="dashboard-grid" style="grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));">
        <div class="card" style="text-align:center; padding:16px;">
          <div style="font-size:2rem;">🎯</div>
          <div style="font-size:1.8rem; font-weight:bold;">${totalFocusSessions}</div>
          <div>جلسه فوکوس</div>
          <small>${totalFocusMinutes} دقیقه</small>
        </div>
        <div class="card" style="text-align:center; padding:16px;">
          <div style="font-size:2rem;">💰</div>
          <div style="font-size:1.8rem; font-weight:bold;">${totalPoints}</div>
          <div>امتیاز کل</div>
          <small>سطح ${currentLevel}</small>
        </div>
        <div class="card" style="text-align:center; padding:16px;">
          <div style="font-size:2rem;">🏅</div>
          <div style="font-size:1.2rem; font-weight:bold;">نشان‌ها</div>
          <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:4px; margin-top:8px;">${badgesList || "ندارید"}</div>
        </div>
      </div>

      <!-- دکمه PDF -->
      <div style="display:flex; justify-content:flex-end;">
        <button class="primary" onclick="exportStatsToPDF()" style="padding:10px 20px; gap:6px;">
          📄 دریافت گزارش PDF
        </button>
      </div>

      <!-- تقویم شمسی -->
      <div class="card">
        <h3>📅 تقویم شمسی</h3>
        <div id="calendarContainer"></div>
      </div>

      <!-- نمودارها -->
      <div id="statsChartsContainer">
        <div class="card"><h3>🎯 جلسات فوکوس در ۷ روز اخیر</h3><canvas id="focusChart" width="400" height="200"></canvas></div>
        <div class="card"><h3>🍽️ وعده‌های غذایی در ۷ روز اخیر</h3><canvas id="mealsChart" width="400" height="200"></canvas></div>
        <div class="card"><h3>🏃 دقایق ورزش در ۷ روز اخیر</h3><canvas id="exerciseChart" width="400" height="200"></canvas></div>
        <div class="card"><h3>📈 امتیاز تخمینی روزانه</h3><canvas id="pointsChart" width="400" height="200"></canvas></div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // رسم نمودارها و تقویم
  setTimeout(() => {
    if (window.Chart) {
      Object.values(charts).forEach((chart) => chart && chart.destroy());
      charts = {};

      const ctxFocus = document.getElementById("focusChart")?.getContext("2d");
      const ctxMeals = document.getElementById("mealsChart")?.getContext("2d");
      const ctxExercise = document
        .getElementById("exerciseChart")
        ?.getContext("2d");
      const ctxPoints = document
        .getElementById("pointsChart")
        ?.getContext("2d");

      const labels = dates.map((d) => {
        try {
          const fa = formatFaDate(new Date(d));
          return fa.split("،")[0]?.slice(0, 4) || d.slice(0, 5);
        } catch (e) {
          return d.slice(0, 5);
        }
      });

      if (ctxFocus) {
        charts.focus = new Chart(ctxFocus, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "جلسات فوکوس",
                data: focusData,
                borderColor: "var(--accent)",
                backgroundColor: "rgba(108,92,231,0.1)",
                tension: 0.3,
                fill: true,
              },
            ],
          },
          options: { responsive: true, maintainAspectRatio: true },
        });
      }
      if (ctxMeals) {
        charts.meals = new Chart(ctxMeals, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "تعداد وعده‌ها",
                data: mealsData,
                backgroundColor: "var(--info)",
                borderRadius: 8,
              },
            ],
          },
          options: { responsive: true, maintainAspectRatio: true },
        });
      }
      if (ctxExercise) {
        charts.exercise = new Chart(ctxExercise, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "دقایق ورزش",
                data: exerciseData,
                backgroundColor: "var(--success)",
                borderRadius: 8,
              },
            ],
          },
          options: { responsive: true, maintainAspectRatio: true },
        });
      }
      if (ctxPoints) {
        charts.points = new Chart(ctxPoints, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "امتیاز تخمینی",
                data: pointsData,
                borderColor: "var(--orange)",
                backgroundColor: "rgba(230,126,34,0.1)",
                tension: 0.3,
                fill: true,
              },
            ],
          },
          options: { responsive: true, maintainAspectRatio: true },
        });
      }
    } else {
      showToast("کتابخانه نمودار بارگذاری نشد.", "warning");
    }

    const calendarDiv = document.getElementById("calendarContainer");
    if (calendarDiv) {
      renderCalendar(calendarDiv, new Date());
      showStatsForDate(new Date());
    }
  }, 150);
}

// ================== EXPORT TO PDF ==================
window.exportStatsToPDF = function () {
  const chartsContainer = document.getElementById("statsChartsContainer");
  const calendarContainer = document.getElementById("calendarContainer");
  if (!chartsContainer && !calendarContainer) {
    showToast("خطا: محتوای آمار یافت نشد", "error");
    return;
  }

  const printContent = document.createElement("div");
  printContent.style.cssText =
    "padding:20px; font-family:Vazirmatn, sans-serif;";

  const header = document.createElement("div");
  header.innerHTML = `
    <h1 style="text-align:center; color:#6c5ce7; font-size:28px;">📊 گزارش هفتگی +lifeBOSPro</h1>
    <p style="text-align:center; color:#666; font-size:16px;">تاریخ: ${formatFaDate(new Date())}</p>
    <hr style="border:1px solid #ddd;">
  `;
  printContent.appendChild(header);

  const summaryCards = document
    .querySelector(".dashboard-grid")
    ?.cloneNode(true);
  if (summaryCards) printContent.appendChild(summaryCards);

  if (calendarContainer) {
    const calClone = calendarContainer.cloneNode(true);
    printContent.appendChild(calClone);
  }

  if (chartsContainer) {
    const chartsClone = chartsContainer.cloneNode(true);
    printContent.appendChild(chartsClone);
  }

  const originalTitle = document.title;
  document.title = "گزارش هفتگی LifeBOSPro";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showToast("پنجره بازشو مسدود شد! لطفاً اجازه دهید.", "warning");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>گزارش هفتگی</title>
      <link rel="stylesheet" href="css/style.css">
      <style>
        body { background: white !important; color: #1a1a2e !important; padding: 20px; margin: 0; font-family: 'Vazirmatn', sans-serif; }
        .card { border: 1px solid #ddd !important; box-shadow: none !important; background: white !important; page-break-inside: avoid; margin-bottom: 20px; }
        button, .bottom-nav, .menu-toggle, .sidebar, .topbar { display: none !important; }
        .content { padding: 0 !important; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
        .quick-link { background: #f5f5f5 !important; border-radius: 12px; padding: 16px; }
        .badge { background: #eee !important; color: #333 !important; }
        .progress-bar { background: #eee !important; }
        .progress-fill { background: #6c5ce7 !important; }
        .star-rating { color: #f1c40f !important; }
        .meal-item { border-bottom: 1px solid #eee !important; }
        canvas { max-width: 100% !important; height: auto !important; }
        h1, h2, h3, h4 { color: #1a1a2e !important; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 8px; }
        .calendar-day { padding: 6px; border-radius: 4px; text-align: center; background: #f5f5f5 !important; }
        .calendar-day.today { background: #6c5ce7 !important; color: white !important; }
        .calendar-day.has-activity { border: 2px solid #6c5ce7 !important; }
      </style>
    </head>
    <body>
      ${printContent.innerHTML}
      <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
    </body>
    </html>
  `);
  printWindow.document.close();
  document.title = originalTitle;
};

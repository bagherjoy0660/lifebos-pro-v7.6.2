// ================== CALENDAR v7.6 (تقویم شمسی کامل) ==================
import { state } from "../core/state.js";
import { getTodayDateString, formatFaDate, showToast } from "../core/utils.js";

let currentDate = new Date(); // تاریخ میلادی جاری در تقویم

function getPersianCalendarData(date) {
  const jMoment = window.moment;
  if (!jMoment) return { days: [], monthName: "", year: "" };
  const jDate = jMoment(date).locale("fa");
  const daysInMonth = jDate.jDaysInMonth();
  const monthName = jDate.format("jMMMM");
  const year = jDate.format("jYYYY");
  const firstDayOfMonth = jMoment(date).startOf("jMonth").toDate();
  const firstDayIndex = firstDayOfMonth.getDay(); // 0=شنبه (در جاوااسکریپت)
  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);
  return { days: daysArray, monthName, year, daysInMonth };
}

function renderCalendar(container, selectedDate) {
  const jMoment = window.moment;
  if (!jMoment) {
    container.innerHTML =
      '<p style="color:var(--text3);">خطا: کتابخانه تقویم شمسی بارگذاری نشد.</p>';
    return;
  }
  const cal = getPersianCalendarData(selectedDate);
  const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"]; // شنبه تا جمعه

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <button class="primary" id="prevMonthBtn">◀ ماه قبل</button>
      <h3 style="margin:0;">${cal.monthName} ${cal.year}</h3>
      <button class="primary" id="nextMonthBtn">ماه بعد ▶</button>
    </div>
    <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:8px; text-align:center; margin-bottom:16px;">
      ${weekDays.map((d) => `<div style="font-weight:600; color:var(--accent);">${d}</div>`).join("")}
    </div>
    <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:8px; text-align:center;">
  `;
  for (let i = 0; i < cal.days.length; i++) {
    const day = cal.days[i];
    if (day === null) {
      html += `<div style="background:transparent;"></div>`;
    } else {
      const currentDateObj = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        day,
      );
      const dateStr = currentDateObj.toDateString();
      const isToday = dateStr === getTodayDateString();
      const hasActivity =
        state.focusLog.find((l) => l.date === dateStr)?.sessions > 0 ||
        state.exerciseLog.filter((e) => e.date === dateStr).length > 0 ||
        state.nutritionLog.filter((m) => m.date === dateStr).length > 0;
      html += `
        <div class="calendar-day ${isToday ? "today" : ""} ${hasActivity ? "has-activity" : ""}" 
             data-date="${dateStr}" data-day="${day}" 
             style="padding:12px; border-radius:12px; cursor:pointer; background:var(--surface2); transition:0.2s;">
          ${day}
        </div>`;
    }
  }
  html += `</div>`;
  container.innerHTML = html;

  // رویداد کلیک روی روزها
  document.querySelectorAll(".calendar-day").forEach((el) => {
    el.onclick = () => {
      const dateStr = el.dataset.date;
      if (dateStr) showDayDetails(dateStr);
      // هایلایت روز انتخاب شده
      document
        .querySelectorAll(".calendar-day")
        .forEach((d) => (d.style.background = "var(--surface2)"));
      el.style.background = "var(--accent)";
      el.style.color = "white";
    };
  });

  // دکمه‌های تغییر ماه
  document.getElementById("prevMonthBtn")?.addEventListener("click", () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() - 1);
    currentDate = newDate;
    renderCalendar(container, currentDate);
    // برای نمایش آدرس روز جاری یا روز اول ماه جدید
    const firstDayOfNewMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    showDayDetails(firstDayOfNewMonth.toDateString());
  });
  document.getElementById("nextMonthBtn")?.addEventListener("click", () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + 1);
    currentDate = newDate;
    renderCalendar(container, currentDate);
    const firstDayOfNewMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    showDayDetails(firstDayOfNewMonth.toDateString());
  });
}

function showDayDetails(dateStr) {
  const focusLog = state.focusLog.find((l) => l.date === dateStr);
  const focusSessions = focusLog?.sessions || 0;
  const focusMinutes = focusLog?.minutes || 0;
  const meals = state.nutritionLog.filter((m) => m.date === dateStr);
  const exerciseLogs = state.exerciseLog.filter((e) => e.date === dateStr);
  const journalEntry = state.journalEntries.find((j) => j.date === dateStr);
  const waterIntake = (state.waterIntake || []).filter((v) => v === 4).length;
  const waterGoal =
    state.waterMode === "cups" ? state.waterGoalCups : state.waterGoalBottles;
  const waterPercent = Math.round((waterIntake / waterGoal) * 100);
  const habitsDone = state.habits.filter(
    (h) => h.doneToday && h.doneToday === true,
  ); // مشکل: doneToday برای روز جاری است، برای روزهای قبل نیاز به تاریخچه عادت داریم. فعلاً می‌توانیم از state.habits استفاده کنیم که فقط وضعیت امروز را دارد. برای ساده‌سازی، عادت‌ها را برای روزهای قبل نمایش نمی‌دهیم.

  let html = `
    <div class="card" style="margin-top:20px;">
      <h3>📅 جزئیات روز ${formatFaDate(new Date(dateStr))}</h3>
      <div class="dashboard-grid" style="grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:16px;">
        <div>🎯 فوکوس: ${focusSessions} جلسه (${focusMinutes} دقیقه)</div>
        <div>🍽️ وعده‌ها: ${meals.length} وعده</div>
        <div>🏃 ورزش: ${exerciseLogs.length} بار (${exerciseLogs.reduce((s, e) => s + e.minutes, 0)} دقیقه)</div>
        <div>💧 آب: ${waterIntake} از ${waterGoal} (${waterPercent}%)</div>
        <div>📖 ژورنال: ${journalEntry ? "✅ نوشته شده" : "❌ نوشته نشده"}</div>
      </div>
      ${meals.length ? `<div style="margin-top:12px;"><strong>وعده‌ها:</strong> ${meals.map((m) => `<span class="badge">${m.meal}${m.notes ? `: ${m.notes}` : ""}</span>`).join(" ")}</div>` : ""}
      ${exerciseLogs.length ? `<div style="margin-top:12px;"><strong>فعالیت‌ها:</strong> ${exerciseLogs.map((e) => `<span class="badge">${e.type} ${e.minutes} دقیقه</span>`).join(" ")}</div>` : ""}
      ${journalEntry ? `<div style="margin-top:12px;"><strong>✍️ یادداشت ژورنال:</strong><p style="margin-top:6px; padding:8px; background:var(--surface2); border-radius:8px;">${journalEntry.text}</p></div>` : ""}
    </div>
  `;
  const detailsContainer = document.getElementById("dayDetails");
  if (detailsContainer) detailsContainer.innerHTML = html;
  else {
    const newDiv = document.createElement("div");
    newDiv.id = "dayDetails";
    document.getElementById("calendarContainer").after(newDiv);
    newDiv.innerHTML = html;
  }
}

export function renderCalendarPage(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="card">
        <h2>📅 تقویم شمسی</h2>
        <div id="calendarContainer"></div>
      </div>
    </div>
  `;
  const calendarDiv = document.getElementById("calendarContainer");
  if (calendarDiv) {
    renderCalendar(calendarDiv, currentDate);
    // نمایش جزئیات روز جاری به صورت پیش‌فرض
    showDayDetails(getTodayDateString());
  } else {
    showToast("خطا در بارگذاری تقویم", "error");
  }
}

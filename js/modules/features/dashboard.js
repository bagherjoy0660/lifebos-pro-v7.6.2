import { state } from "../core/state.js";
import {
  getTodayDateString,
  getImportanceColor,
  getImportanceLabel,
} from "../core/utils.js";

export function renderDashboard(container) {
  const today = getTodayDateString();
  const visible = (cardId) => state.dashboardCards.includes(cardId);

  const totalSub = state.dailyTasks.reduce(
    (acc, t) => acc + t.subtasks.length,
    0,
  );
  const doneSub = state.dailyTasks.reduce(
    (acc, t) => acc + t.subtasks.filter((s) => s.done).length,
    0,
  );
  const taskPercent = totalSub ? Math.round((doneSub / totalSub) * 100) : 0;
  const maxStreak = Math.max(...state.habits.map((h) => h.streak), 0);
  const todaySleep = state.sleepLog.find((s) => s.date === today);
  const todayMeals = state.nutritionLog.filter((m) => m.date === today);

  const habitHtml = state.habits
    .map((h) => {
      const done = h.doneToday;
      return `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span>${h.icon}</span><span style="flex:1; text-align:right;">${h.name}</span>
            <span style="font-weight:bold; color:${done ? "var(--success)" : "var(--text3)"};">${done ? "✓" : "○"}</span>
            <span style="color:var(--orange);">🔥${h.streak}</span></div>`;
    })
    .join("");

  const sleepStars = todaySleep
    ? Array.from(
        { length: 5 },
        (_, i) =>
          `<span class="star-rating">${i < todaySleep.quality ? "⭐" : "☆"}</span>`,
      ).join("")
    : '<span style="color:var(--text3);">ثبت نشده</span>';

  const mealsHtml = todayMeals.length
    ? todayMeals
        .map(
          (m) =>
            `<div class="meal-item"><span>${m.meal === "صبحانه" ? "🥐" : m.meal === "ناهار" ? "🍛" : m.meal === "شام" ? "🍲" : "🍎"}</span><span>${m.meal}:</span><span style="color:var(--text2);">${m.notes || "بدون توضیح"}</span></div>`,
        )
        .join("")
    : '<p style="color:var(--text3);">امروز وعده‌ای ثبت نشده</p>';

  const goalPercents = state.goals.map((g) => {
    const t = g.subtasks.length,
      d = g.subtasks.filter((s) => s.done).length;
    return t ? Math.round((d / t) * 100) : 0;
  });
  const avgGoal = goalPercents.length
    ? Math.round(goalPercents.reduce((a, b) => a + b, 0) / goalPercents.length)
    : 0;

  const journalSnippet = (
    state.journalEntries.find((j) => j.date === today)?.text ||
    "هنوز ننوشته‌ای..."
  ).substring(0, 80);

  // ========== کارت آب (هماهنگ با state جدید) ==========
  const waterDashboardHtml = () => {
    const mode = state.waterMode || "cups";
    const goal =
      mode === "cups" ? state.waterGoalCups || 8 : state.waterGoalBottles || 2;
    const icon =
      mode === "cups"
        ? state.waterUnitIconCup || "🥛"
        : state.waterUnitIconBottle || "🍾";
    const intake = Array.isArray(state.waterIntake)
      ? [...state.waterIntake]
      : [];
    // هم‌طول کردن آرایه با هدف
    while (intake.length < goal) intake.push(0);
    if (intake.length > goal) intake.splice(goal);
    const unitName = mode === "cups" ? "لیوان" : "بطری";
    const mlPerUnit = mode === "cups" ? 250 : 1000;
    const totalMl = intake.reduce((sum, val) => sum + (val / 4) * mlPerUnit, 0);
    const liters = totalMl / 1000;
    const displayTotal =
      liters >= 1
        ? `${liters.toFixed(2)} لیتر`
        : `${Math.round(totalMl)} میلی‌لیتر`;

    let listHtml = "";
    for (let i = 0; i < goal; i++) {
      const val = intake[i] || 0;
      const pct = val * 25;
      listHtml += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <span style="font-size:1.5rem;">${icon}</span>
        <span style="flex:1; text-align:right;">${unitName} ${i + 1}</span>
        <span style="color:var(--info); font-weight:bold;">${pct}%</span>
      </div>`;
    }

    return `<div class="quick-link" onclick="navigateTo('wellness')">
      <div>💧 آب</div>
      <div style="font-size:0.9rem; margin:8px 0;">${displayTotal}</div>
      <div class="habit-scroll" style="text-align:right; max-height:120px; overflow-y:auto;">${listHtml}</div>
    </div>`;
  };

  const badgesHtml = state.badges.length
    ? state.badges
        .map((bId) => {
          const badge = window.ALL_BADGES
            ? window.ALL_BADGES.find((b) => b.id === bId)
            : null;
          return badge
            ? `<span class="badge" style="background:var(--accent); margin-left:4px;" title="${badge.desc}">${badge.name}</span>`
            : "";
        })
        .join("")
    : '<span style="color:var(--text3);">هنوز نشانی نگرفتی</span>';

  container.innerHTML = `
        ${
          visible("mood")
            ? `
        <div class="card fade-in" style="background:linear-gradient(135deg, var(--accent), var(--pink)); color:white; border:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                <div><h2 style="margin:0;">${state.currentMood} حال امروز</h2><p style="margin-top:8px; opacity:0.9;">${journalSnippet}</p></div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">${["😄", "😊", "😐", "😕", "😢", "🤩", "😤", "🥱"].map((m) => `<span style="font-size:2rem;cursor:pointer;opacity:${state.currentMood === m ? 1 : 0.5};" onclick="setMood('${m}')">${m}</span>`).join("")}</div>
            </div>
        </div>`
            : ""
        }

        <div class="dashboard-grid">
            ${visible("planner") ? `<div class="quick-link" onclick="navigateTo('planner')"><div class="donut-chart"><svg viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="var(--surface3)" stroke-width="3"/><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="${taskPercent}, 100"/></svg><div class="donut-center">${taskPercent}%</div></div><div>📋 برنامه روزانه</div></div>` : ""}
            ${visible("habits") ? `<div class="quick-link" onclick="navigateTo('habits')" style="display:flex; flex-direction:column; justify-content:space-between; height:180px;"><div><div style="font-size:1.5rem;">🔥</div><div>عادت‌ها</div></div><div class="habit-scroll" style="text-align:right; margin-top:8px; font-size:0.8rem; flex:1; min-height:0;">${habitHtml}</div><small>بهترین: ${maxStreak} روز</small></div>` : ""}
            ${visible("focus") ? `<div class="quick-link" onclick="navigateTo('focus')"><div>🎯 جلسات فوکوس</div><div style="font-size:1.5rem; font-weight:bold; margin:8px 0;">${state.focusSessions} جلسه</div><small>${state.focusMinutes} دقیقه</small></div>` : ""}
            ${visible("water") ? waterDashboardHtml() : ""}
            ${visible("sleep") ? `<div class="quick-link" onclick="navigateTo('wellness')"><div>🌙 خواب دیشب</div><div style="margin:8px 0;">${sleepStars}</div><small>${todaySleep ? `${todaySleep.hours} ساعت` : "ثبت نشده"}</small></div>` : ""}
            ${visible("goals") ? `<div class="quick-link" onclick="navigateTo('goals')"><div>🎯 اهداف</div><div class="donut-chart" style="width:80px;height:80px;"><svg viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="var(--surface3)" stroke-width="3"/><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="var(--warning)" stroke-width="3" stroke-dasharray="${avgGoal}, 100"/></svg><div class="donut-center" style="font-size:0.9rem;">${avgGoal}%</div></div><small>پیشرفت کلی</small></div>` : ""}
        </div>

        ${
          visible("meals") || visible("exercise")
            ? `
        <div class="grid2">
            ${visible("meals") ? `<div class="card fade-in"><h3>🍽️ وعده‌های امروز</h3><div>${mealsHtml}</div></div>` : ""}
            ${
              visible("exercise")
                ? `<div class="card fade-in"><h3>🏃 فعالیت اخیر</h3>${
                    state.exerciseLog
                      .slice(-3)
                      .reverse()
                      .map(
                        (e) =>
                          `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);"><span>${e.type}</span><span>${e.minutes} دقیقه</span></div>`,
                      )
                      .join("") ||
                    '<p style="color:var(--text3);">بدون فعالیت</p>'
                  }</div>`
                : ""
            }
        </div>`
            : ""
        }

        ${visible("badges") ? `<div class="card fade-in"><h3>🏅 نشان‌ها</h3><div>${badgesHtml}</div></div>` : ""}
        ${
          visible("notes")
            ? `<div class="card fade-in"><h3>📝 آخرین یادداشت‌ها</h3>${
                state.notesList
                  .slice(-2)
                  .reverse()
                  .map(
                    (n) =>
                      `<div style="padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="navigateTo('notepad')"><strong>${n.title}</strong><p style="color:var(--text2);">${n.content.substring(0, 70)}...</p></div>`,
                  )
                  .join("") ||
                '<p style="color:var(--text3);">یادداشتی نیست</p>'
              }</div>`
            : ""
        }
    `;
}

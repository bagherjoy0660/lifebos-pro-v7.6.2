// ================== MAIN ORCHESTRATOR v7.7 ==================
import {
  state,
  saveState,
  loadState,
  resetAllData,
} from "./modules/core/state.js";
import {
  getTodayDateString,
  formatFaDate,
  THEME_COLORS,
  applyFont,
} from "./modules/core/utils.js";

import { renderDashboard } from "./modules/features/dashboard.js";
import { renderPlanner } from "./modules/features/planner.js";
import { renderHabits } from "./modules/features/habits.js";
import { renderFocus } from "./modules/features/focus.js";
import { renderWellness } from "./modules/features/wellness.js";
import { renderExercise } from "./modules/features/exercise.js";
import { renderNotepad } from "./modules/features/notepad.js";
import { renderGoals } from "./modules/features/goals.js";
import { renderJournal } from "./modules/features/journal.js";
import { renderStats } from "./modules/features/stats.js";
import { renderCalendarPage } from "./modules/features/calendar.js";
import {
  openSettingsModal,
  closeSettingsModal,
  calculateTodayPoints,
  applyBackground,
  applySystemTheme,
  initSystemThemeListener,
} from "./modules/features/settings.js";

let currentView = "dashboard";

function updateTopBar() {
  document.getElementById("todayDate").textContent = formatFaDate(new Date());
  document.getElementById("moodBadge").textContent = state.currentMood || "😊";

  const totalSub = state.dailyTasks.reduce(
    (acc, t) => acc + t.subtasks.length,
    0,
  );
  const doneSub = state.dailyTasks.reduce(
    (acc, t) => acc + t.subtasks.filter((s) => s.done).length,
    0,
  );
  const percent = totalSub ? Math.round((doneSub / totalSub) * 100) : 0;
  document.getElementById("overallProgress").textContent = totalSub
    ? `📊 ${percent}% امروز`
    : "📋 بدون وظیفه";

  document.getElementById("levelBadge").textContent =
    `⭐ سطح ${state.userLevel || 1}`;
  document.getElementById("pointsBadge").textContent =
    `💰 ${state.totalPoints || 0} امتیاز`;
}

function navigateTo(view) {
  if (window.pomodoroTimer) {
    clearInterval(window.pomodoroTimer);
    window.pomodoroTimer = null;
  }
  currentView = view;
  render();
}

async function render() {
  const content = document.getElementById("content");
  if (!content) return;
  content.innerHTML = "";

  switch (currentView) {
    case "dashboard":
      await renderDashboard(content);
      break;
    case "planner":
      await renderPlanner(content);
      break;
    case "habits":
      await renderHabits(content);
      break;
    case "focus":
      await renderFocus(content);
      break;
    case "wellness":
      await renderWellness(content);
      break;
    case "exercise":
      await renderExercise(content);
      break;
    case "notepad":
      await renderNotepad(content);
      break;
    case "goals":
      await renderGoals(content);
      break;
    case "journal":
      await renderJournal(content);
      break;
    case "stats":
      await renderStats(content);
      break;
    case "calendar":
      await renderCalendarPage(content);
      break;
  }

  document.querySelectorAll(".nav-item").forEach((el) => {
    el.onclick = () => {
      const view = el.dataset.view;
      if (view) navigateTo(view);
    };
    el.classList.toggle("active", el.dataset.view === currentView);
  });

  // به‌روزرسانی آیتم‌های نوار پایین (در صورت وجود)
  document.querySelectorAll(".bottom-nav-item").forEach((el) => {
    el.onclick = () => {
      const view = el.dataset.view;
      if (view) navigateTo(view);
    };
    el.classList.toggle("active", el.dataset.view === currentView);
  });
}

window.render = render;
window.navigateTo = navigateTo;
window.updateTopBar = updateTopBar;

// ================== MOBILE MENU ==================
function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  const bottomNavItems = document.querySelectorAll(".bottom-nav-item");

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  document.addEventListener("click", (e) => {
    if (sidebar && sidebar.classList.contains("open")) {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove("open");
      }
    }
  });

  bottomNavItems.forEach((item) => {
    item.addEventListener("click", () => {
      const view = item.dataset.view;
      if (view) navigateTo(view);
      if (sidebar) sidebar.classList.remove("open");
    });
  });
}

// ================== INIT ==================
async function init() {
  await loadState();

  const today = getTodayDateString();
  if (state.lastReset !== today) {
    state.habits.forEach((h) => (h.doneToday = false));
    const goal =
      state.waterMode === "cups" ? state.waterGoalCups : state.waterGoalBottles;
    state.waterIntake = Array(goal).fill(0);
    state.dailyTasks = state.dailyTasks.filter((task) => task.persistent);
    state.lastReset = today;
  }

  if (THEME_COLORS[state.theme]) {
    document.documentElement.style.setProperty(
      "--accent",
      THEME_COLORS[state.theme].main,
    );
    document.documentElement.style.setProperty(
      "--pink",
      THEME_COLORS[state.theme].light,
    );
  }

  applyBackground();
  applyFont(state.selectedFont || "Vazirmatn");

  // همگام با تم سیستم (اگر فعال باشد)
  if (state.syncWithSystem) {
    applySystemTheme();
    initSystemThemeListener();
  }

  await saveState();
  updateTopBar();
  await calculateTodayPoints();
  await render();
  initMobileMenu();
}

init();

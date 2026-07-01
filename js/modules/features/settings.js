// ================== SETTINGS v7.7 (با اعتبارسنجی کامل) ==================
import {
  state,
  saveState,
  DEFAULT_STATE,
  resetAllData,
} from "../core/state.js";
import {
  THEME_COLORS,
  getTodayDateString,
  FONT_LIST,
  applyFont,
  showConfirmModal,
  showToast,
} from "../core/utils.js";

// ================== BADGES ==================
export const ALL_BADGES = [
  {
    id: "focus_10",
    name: "جنگجوی فوکوس",
    desc: "انجام ۱۰ جلسه تمرکز",
    check: (s) => s.focusSessions >= 10,
  },
  {
    id: "focus_50",
    name: "استاد تمرکز",
    desc: "انجام ۵۰ جلسه تمرکز",
    check: (s) => s.focusSessions >= 50,
  },
  {
    id: "streak_7",
    name: "پایدار",
    desc: "یک عادت با استریک ۷ روزه",
    check: (s) => s.habits.some((h) => h.streak >= 7),
  },
  {
    id: "streak_30",
    name: "افسانه‌ای",
    desc: "یک عادت با استریک ۳۰ روزه",
    check: (s) => s.habits.some((h) => h.streak >= 30),
  },
  {
    id: "water_8",
    name: "کارشناس آب",
    desc: "تکمیل هدف آب روزانه",
    check: (s) => {
      const goal =
        s.waterMode === "cups" ? s.waterGoalCups : s.waterGoalBottles;
      const full = (s.waterIntake || []).filter((v) => v === 4).length;
      return full >= goal;
    },
  },
  {
    id: "sleep_7",
    name: "خواب حرفه‌ای",
    desc: "۷ ساعت خواب شبانه",
    check: (s) => s.sleepLog.some((l) => l.hours >= 7),
  },
  {
    id: "exercise_daily",
    name: "ورزشکار روزانه",
    desc: "ثبت فعالیت در ۵ روز",
    check: (s) => [...new Set(s.exerciseLog.map((e) => e.date))].length >= 5,
  },
  {
    id: "meals_3",
    name: "منظم در تغذیه",
    desc: "ثبت ۳ وعده در یک روز",
    check: (s) => {
      const today = getTodayDateString();
      return s.nutritionLog.filter((m) => m.date === today).length >= 3;
    },
  },
  {
    id: "journal_7",
    name: "نویسنده هفته",
    desc: "۷ روز ژورنال نویسی",
    check: (s) => s.journalEntries.length >= 7,
  },
  {
    id: "goal_100",
    name: "فاتح اهداف",
    desc: "تکمیل یک هدف ۱۰۰٪",
    check: (s) =>
      s.goals.some(
        (g) => g.subtasks.length > 0 && g.subtasks.every((st) => st.done),
      ),
  },
  {
    id: "task_10",
    name: "مدیر وظایف",
    desc: "انجام ۱۰ وظیفه",
    check: (s) =>
      s.dailyTasks.filter(
        (t) => t.subtasks.length > 0 && t.subtasks.every((st) => st.done),
      ).length >= 10,
  },
  {
    id: "points_500",
    name: "ثروتمند",
    desc: "کسب ۵۰۰ امتیاز",
    check: (s) => s.totalPoints >= 500,
  },
  {
    id: "points_2000",
    name: "میلیونر",
    desc: "کسب ۲۰۰۰ امتیاز",
    check: (s) => s.totalPoints >= 2000,
  },
  {
    id: "level_5",
    name: "پیشرو",
    desc: "رسیدن به سطح ۵",
    check: (s) => s.userLevel >= 5,
  },
  {
    id: "level_10",
    name: "افسانه",
    desc: "رسیدن به سطح ۱۰",
    check: (s) => s.userLevel >= 10,
  },
];

// ================== GAMIFICATION ==================
export async function calculateTodayPoints() {
  const today = getTodayDateString();
  const sc = state.scoring;
  let points = 0;

  if (typeof state.totalPoints !== "number" || isNaN(state.totalPoints))
    state.totalPoints = 0;
  if (
    typeof state.todayEarnedPoints !== "number" ||
    isNaN(state.todayEarnedPoints)
  )
    state.todayEarnedPoints = 0;

  if (state.lastPointsCalculationDate === today) {
    state.totalPoints -= state.todayEarnedPoints;
  }

  state.habits.forEach((h) => {
    if (h.doneToday) points += sc.habit || 0;
  });

  state.dailyTasks.forEach((t) => {
    const taskImportance = t.importance || "normal";
    const bonus = sc.parentBonus?.[taskImportance] || 0;
    t.subtasks.forEach((s) => {
      if (s.done) {
        const base = sc.subtaskScores?.[s.importance] || 0;
        points += base + bonus;
      }
    });
  });

  if (state.focusSessions > 0)
    points += state.focusSessions * (sc.focusSession || 0);
  const waterFull = (state.waterIntake || []).filter((v) => v === 4).length;
  const waterGoal =
    state.waterMode === "cups" ? state.waterGoalCups : state.waterGoalBottles;
  if (waterFull >= waterGoal) points += sc.water || 0;
  if (state.sleepLog.find((s) => s.date === today && s.hours >= 7))
    points += sc.sleep || 0;
  if (state.nutritionLog.filter((m) => m.date === today).length >= 3)
    points += sc.meals || 0;
  if (state.exerciseLog.filter((e) => e.date === today).length > 0)
    points += sc.exercise || 0;
  if (state.journalEntries.find((j) => j.date === today))
    points += sc.journal || 0;

  state.totalPoints += points;
  state.todayEarnedPoints = points;
  state.lastPointsCalculationDate = today;

  const oldLevel = state.userLevel;
  const newLevel = Math.floor((state.totalPoints || 0) / 100) + 1;
  if (newLevel > oldLevel) {
    state.userLevel = newLevel;
    showToast(`🎉 تبریک! به سطح ${newLevel} رسیدی!`, "success", 5000);
  }

  await saveState();
  if (typeof window.updateTopBar === "function") window.updateTopBar();
  checkAndAwardBadges();
}

function checkAndAwardBadges() {
  for (const badge of ALL_BADGES) {
    if (!state.badges.includes(badge.id) && badge.check(state)) {
      state.badges.push(badge.id);
      showToast(`🏅 نشان جدید: ${badge.name}`, "success", 5000);
    }
  }
  saveState();
}

// ================== HELPERS ==================
function renderDashboardCardsList(container) {
  const cards = [
    { id: "mood", label: "😊 حال امروز", icon: "😊" },
    { id: "planner", label: "📋 برنامه روزانه", icon: "📋" },
    { id: "habits", label: "🔥 عادت‌ها", icon: "✅" },
    { id: "focus", label: "🎯 جلسات فوکوس", icon: "🎯" },
    { id: "water", label: "💧 آب", icon: "💧" },
    { id: "sleep", label: "🌙 خواب دیشب", icon: "🌙" },
    { id: "goals", label: "🎯 اهداف", icon: "🏆" },
    { id: "meals", label: "🍽️ وعده‌های امروز", icon: "🍽️" },
    { id: "exercise", label: "🏃 فعالیت اخیر", icon: "🏃" },
    { id: "badges", label: "🏅 نشان‌ها", icon: "🏅" },
    { id: "notes", label: "📝 یادداشت‌ها", icon: "📝" },
  ];

  container.innerHTML = cards
    .map((card) => {
      const checked = state.dashboardCards.includes(card.id);
      return `
      <label class="dashboard-card-item ${checked ? "active" : ""}" data-card="${card.id}">
        <input type="checkbox" value="${card.id}" ${checked ? "checked" : ""} onchange="toggleDashboardCard('${card.id}', this.checked)">
        <span class="card-icon">${card.icon}</span>
        <span class="card-label">${card.label}</span>
        ${checked ? '<span class="card-pin">📌</span>' : ""}
      </label>
    `;
    })
    .join("");
}

// ================== SYSTEM THEME ==================
export function applySystemTheme() {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (isDark) {
    document.body.classList.remove("light");
  } else {
    document.body.classList.add("light");
  }
}

let systemThemeListener = null;
export function initSystemThemeListener() {
  if (systemThemeListener) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .removeEventListener("change", systemThemeListener);
  }
  systemThemeListener = (e) => {
    if (state.syncWithSystem) {
      applySystemTheme();
    }
  };
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", systemThemeListener);
}

// ================== SETTINGS MODAL ==================
export function openSettingsModal() {
  const modal = document.getElementById("settingsModal");
  if (!modal) return;
  modal.classList.add("active");

  document
    .querySelectorAll("#settingsModal .tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelector('#settingsModal .tab-btn[data-tab="general"]')
    .classList.add("active");
  document
    .querySelectorAll("#settingsModal .tab-content")
    .forEach((c) => c.classList.remove("active"));
  document.getElementById("tab-general").classList.add("active");

  const listContainer = document.getElementById("dashboardCardsList");
  if (listContainer) {
    listContainer.className = "dashboard-cards-grid";
    renderDashboardCardsList(listContainer);
  }

  const picker = document.getElementById("themeColorPicker");
  if (picker) {
    picker.innerHTML = Object.keys(THEME_COLORS)
      .map((color) => {
        const selected = state.theme === color ? "selected" : "";
        return `<div class="color-swatch ${selected}" style="background-color: ${THEME_COLORS[color].main}" onclick="changeTheme('${color}'); document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected')); this.classList.add('selected');"></div>`;
      })
      .join("");
  }

  const bgSelect = document.getElementById("bgTypeSelect");
  if (bgSelect) bgSelect.value = state.backgroundType || "default";
  const uploadDiv = document.getElementById("customBgUpload");
  if (uploadDiv)
    uploadDiv.style.display =
      state.backgroundType === "custom" ? "block" : "none";
  const preview = document.getElementById("bgPreview");
  if (preview && state.backgroundImage) {
    preview.style.backgroundImage = `url(${state.backgroundImage})`;
    preview.style.display = "block";
  } else if (preview) preview.style.display = "none";

  let syncContainer = document.getElementById("syncThemeContainer");
  if (!syncContainer) {
    syncContainer = document.createElement("div");
    syncContainer.id = "syncThemeContainer";
    syncContainer.className = "settings-item";
    syncContainer.style.marginTop = "12px";
    const themeTab = document.getElementById("tab-theme");
    if (themeTab) themeTab.appendChild(syncContainer);
  }
  syncContainer.innerHTML = `
    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
      <input type="checkbox" id="syncThemeCheckbox" ${state.syncWithSystem ? "checked" : ""}>
      <span>🌙 همگام با تم سیستم (روشن/تیره خودکار)</span>
    </label>
  `;
  const syncCb = document.getElementById("syncThemeCheckbox");
  if (syncCb) {
    syncCb.onchange = async (e) => {
      state.syncWithSystem = e.target.checked;
      await saveState();
      if (state.syncWithSystem) {
        applySystemTheme();
        initSystemThemeListener();
      }
      showToast(
        state.syncWithSystem
          ? "همگام با سیستم فعال شد"
          : "همگام با سیستم غیرفعال شد",
      );
    };
  }

  document.querySelectorAll("#settingsModal .tab-btn").forEach((btn) => {
    btn.onclick = function () {
      document
        .querySelectorAll("#settingsModal .tab-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      document
        .querySelectorAll("#settingsModal .tab-content")
        .forEach((c) => c.classList.remove("active"));
      const target = document.getElementById("tab-" + this.dataset.tab);
      if (target) target.classList.add("active");
      if (this.dataset.tab === "scoring") buildScoringFields();
      if (this.dataset.tab === "backup") buildSectionBackupUI();
      if (this.dataset.tab === "font") buildFontList();
    };
  });
}

export function closeSettingsModal() {
  document.getElementById("settingsModal").classList.remove("active");
}

// ================== THEME & BACKGROUND ==================
export function changeTheme(themeName) {
  if (!THEME_COLORS[themeName]) return;
  document.documentElement.style.setProperty(
    "--accent",
    THEME_COLORS[themeName].main,
  );
  document.documentElement.style.setProperty(
    "--pink",
    THEME_COLORS[themeName].light,
  );
  state.theme = themeName;
  if (state.syncWithSystem) {
    state.syncWithSystem = false;
    const syncCb = document.getElementById("syncThemeCheckbox");
    if (syncCb) syncCb.checked = false;
    showToast("همگام با سیستم غیرفعال شد", "info");
  }
  saveState();
  showToast("تم تغییر کرد");
}

export function toggleTheme() {
  document.body.classList.toggle("light");
  if (state.syncWithSystem) {
    state.syncWithSystem = false;
    const syncCb = document.getElementById("syncThemeCheckbox");
    if (syncCb) syncCb.checked = false;
    showToast("همگام با سیستم غیرفعال شد", "info");
    saveState();
  }
  showToast("تم روشن/تیره تغییر کرد");
}

export function applyBackground() {
  document.body.classList.remove("glass-theme", "custom-bg");
  document.body.style.backgroundImage = "";
  if (state.backgroundType === "glass") {
    document.body.classList.add("glass-theme");
  } else if (state.backgroundType === "custom" && state.backgroundImage) {
    document.body.classList.add("custom-bg");
    document.body.style.backgroundImage = `url(${state.backgroundImage})`;
  }
}

export function changeBackgroundType(value) {
  state.backgroundType = value;
  const uploadDiv = document.getElementById("customBgUpload");
  if (uploadDiv)
    uploadDiv.style.display = value === "custom" ? "block" : "none";
  applyBackground();
  saveState();
}

export function handleBgImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    state.backgroundImage = e.target.result;
    state.backgroundType = "custom";
    const bgSelect = document.getElementById("bgTypeSelect");
    if (bgSelect) bgSelect.value = "custom";
    const uploadDiv = document.getElementById("customBgUpload");
    if (uploadDiv) uploadDiv.style.display = "block";
    const preview = document.getElementById("bgPreview");
    if (preview) {
      preview.style.backgroundImage = `url(${state.backgroundImage})`;
      preview.style.display = "block";
    }
    applyBackground();
    saveState();
    showToast("تصویر پس‌زمینه اعمال شد");
  };
  reader.readAsDataURL(file);
}

export function removeBgImage() {
  state.backgroundImage = null;
  state.backgroundType = "default";
  const bgSelect = document.getElementById("bgTypeSelect");
  if (bgSelect) bgSelect.value = "default";
  const uploadDiv = document.getElementById("customBgUpload");
  if (uploadDiv) uploadDiv.style.display = "none";
  const preview = document.getElementById("bgPreview");
  if (preview) preview.style.display = "none";
  applyBackground();
  saveState();
  showToast("تصویر پس‌زمینه حذف شد");
}

// ================== DASHBOARD CARDS ==================
export async function toggleDashboardCard(cardId, isChecked) {
  if (isChecked) {
    if (!state.dashboardCards.includes(cardId))
      state.dashboardCards.push(cardId);
  } else {
    state.dashboardCards = state.dashboardCards.filter((id) => id !== cardId);
  }
  await saveState();

  const listContainer = document.getElementById("dashboardCardsList");
  if (listContainer && listContainer.closest(".modal-overlay.active")) {
    renderDashboardCardsList(listContainer);
  }

  if (typeof window.render === "function") window.render();
}

// ================== SCORING UI (با اعتبارسنجی) ==================
export function buildScoringFields() {
  const container = document.getElementById("scoringFields");
  if (!container) return;
  const sc = state.scoring;
  let html =
    '<div style="margin-bottom:24px;"><strong>🎯 فعالیت‌های عمومی</strong>';
  const labels = {
    habit: "هر عادت انجام‌شده",
    focusSession: "هر جلسه فوکوس",
    water: "تکمیل هدف آب روزانه",
    sleep: "خواب ≥ ۷ ساعت",
    meals: "ثبت ۳ وعده غذایی",
    exercise: "ثبت فعالیت ورزشی",
    journal: "نوشتن ژورنال روزانه",
  };
  const ranges = {
    habit: [1, 20],
    focusSession: [1, 50],
    water: [1, 20],
    sleep: [1, 30],
    meals: [1, 15],
    exercise: [1, 20],
    journal: [1, 15],
  };
  Object.keys(labels).forEach((key) => {
    html += `<div class="scoring-row">
      <label>${labels[key]}</label>
      <input type="number" id="score_${key}" value="${sc[key] || 0}" min="${ranges[key][0]}" max="${ranges[key][1]}" onchange="updateScoring('${key}', this.value)">
      <span style="font-size:0.7rem; color:var(--text3);">(${ranges[key][0]} تا ${ranges[key][1]})</span>
    </div>`;
  });
  html += "</div>";

  html +=
    '<div style="margin-bottom:24px;"><strong>📋 امتیاز پایهٔ هر سطح اهمیت (زیروظیفه)</strong>';
  const levels = ["low", "normal", "medium", "high", "urgent"];
  const levelLabels = {
    low: "✅ کم",
    normal: "📎 معمولی",
    medium: "📌 متوسط",
    high: "🔥 مهم",
    urgent: "⚡ ضروری",
  };
  levels.forEach((l) => {
    html += `<div class="scoring-row">
      <label>${levelLabels[l]}</label>
      <input type="number" id="score_subtask_${l}" value="${(sc.subtaskScores && sc.subtaskScores[l]) || 0}" min="0" max="50" onchange="updateScoring('subtask_${l}', this.value)">
      <span style="font-size:0.7rem; color:var(--text3);">(۰ تا ۵۰)</span>
    </div>`;
  });
  html += "</div>";

  html +=
    '<div style="margin-bottom:24px;"><strong>👤 پاداش اهمیت والد (وظیفه)</strong>';
  levels.forEach((l) => {
    html += `<div class="scoring-row">
      <label>${levelLabels[l]}</label>
      <input type="number" id="score_parent_${l}" value="${(sc.parentBonus && sc.parentBonus[l]) || 0}" min="0" max="50" onchange="updateScoring('parent_${l}', this.value)">
      <span style="font-size:0.7rem; color:var(--text3);">(۰ تا ۵۰)</span>
    </div>`;
  });
  html += "</div>";

  html +=
    '<div style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border);"><strong>💧 تنظیمات آب</strong>';
  html += `<div class="scoring-row"><label>حالت</label><select onchange="switchWaterMode(this.value)"><option value="cups" ${state.waterMode === "cups" ? "selected" : ""}>لیوان</option><option value="bottles" ${state.waterMode === "bottles" ? "selected" : ""}>بطری</option></select></div>`;
  html += `<div class="scoring-row"><label>تعداد هدف</label><input type="number" id="waterGoalInput" value="${state.waterMode === "cups" ? state.waterGoalCups : state.waterGoalBottles}" min="1" max="20" onchange="updateWaterGoal(this.value)"></div>`;
  html += `<div class="scoring-row"><label>آیکون</label><input type="text" id="waterIconInput" value="${state.waterMode === "cups" ? state.waterUnitIconCup : state.waterUnitIconBottle}" onchange="updateWaterIcon(this.value)"></div>`;
  html += "</div>";

  container.innerHTML = html;
}

// ================== SCORING (با اعتبارسنجی) ==================
export function updateScoring(key, value) {
  const val = parseInt(value);
  if (isNaN(val)) {
    showToast("لطفاً یک عدد معتبر وارد کنید!", "warning");
    // برگرداندن مقدار قبلی
    const sc = state.scoring;
    const el = document.getElementById("score_" + key);
    if (el) {
      if (numericKeys.includes(key)) el.value = sc[key] || 0;
      else if (key.startsWith("subtask_")) {
        const level = key.replace("subtask_", "");
        el.value = sc.subtaskScores?.[level] || 0;
      } else if (key.startsWith("parent_")) {
        const level = key.replace("parent_", "");
        el.value = sc.parentBonus?.[level] || 0;
      }
    }
    return;
  }

  const numericKeys = [
    "habit",
    "focusSession",
    "water",
    "sleep",
    "meals",
    "exercise",
    "journal",
  ];
  const ranges = {
    habit: [1, 20],
    focusSession: [1, 50],
    water: [1, 20],
    sleep: [1, 30],
    meals: [1, 15],
    exercise: [1, 20],
    journal: [1, 15],
  };

  if (numericKeys.includes(key)) {
    const [min, max] = ranges[key] || [0, 100];
    if (val < min || val > max) {
      showToast(`مقدار باید بین ${min} تا ${max} باشد!`, "warning");
      document.getElementById("score_" + key).value = state.scoring[key] || 0;
      return;
    }
    state.scoring[key] = val;
  } else if (key.startsWith("subtask_")) {
    const level = key.replace("subtask_", "");
    if (val < 0 || val > 50) {
      showToast("مقدار باید بین ۰ تا ۵۰ باشد!", "warning");
      document.getElementById("score_subtask_" + level).value =
        state.scoring.subtaskScores?.[level] || 0;
      return;
    }
    if (!state.scoring.subtaskScores) state.scoring.subtaskScores = {};
    state.scoring.subtaskScores[level] = val;
  } else if (key.startsWith("parent_")) {
    const level = key.replace("parent_", "");
    if (val < 0 || val > 50) {
      showToast("مقدار باید بین ۰ تا ۵۰ باشد!", "warning");
      document.getElementById("score_parent_" + level).value =
        state.scoring.parentBonus?.[level] || 0;
      return;
    }
    if (!state.scoring.parentBonus) state.scoring.parentBonus = {};
    state.scoring.parentBonus[level] = val;
  }

  saveState();
  showToast("✅ امتیازها بروز شدند");
}

export function resetScoringToDefault() {
  showConfirmModal("مقادیر امتیازها به حالت پیش‌فرض برگردند؟").then((yes) => {
    if (!yes) return;
    state.scoring = { ...DEFAULT_STATE.scoring };
    saveState();
    buildScoringFields();
    showToast("امتیازها به پیش‌فرض برگشتند");
  });
}

// ================== WATER SETTINGS ==================
window.switchWaterMode = function (mode) {
  if (mode === state.waterMode) return;
  state.waterMode = mode;
  const goal = mode === "cups" ? state.waterGoalCups : state.waterGoalBottles;
  state.waterIntake = Array(goal).fill(0);
  saveState();
  if (typeof window.render === "function") window.render();
  showToast("حالت آب تغییر کرد");
};

window.updateWaterGoal = function (value) {
  const val = parseInt(value);
  if (isNaN(val) || val < 1) {
    showToast("لطفاً یک عدد معتبر (بزرگتر از ۰) وارد کنید!", "warning");
    document.getElementById("waterGoalInput").value =
      state.waterMode === "cups" ? state.waterGoalCups : state.waterGoalBottles;
    return;
  }
  if (val > 20) {
    showToast("حداکثر تعداد هدف ۲۰ است!", "warning");
    document.getElementById("waterGoalInput").value = 20;
    return;
  }
  if (state.waterMode === "cups") state.waterGoalCups = val;
  else state.waterGoalBottles = val;
  const goal = val;
  const old = state.waterIntake.length;
  if (goal > old) for (let i = old; i < goal; i++) state.waterIntake.push(0);
  else state.waterIntake = state.waterIntake.slice(0, goal);
  saveState();
  if (typeof window.render === "function") window.render();
  showToast(`هدف آب به ${val} بروز شد`);
};

window.updateWaterIcon = function (value) {
  if (!value.trim()) {
    showToast("لطفاً یک آیکون وارد کنید!", "warning");
    return;
  }
  if (state.waterMode === "cups") state.waterUnitIconCup = value.trim();
  else state.waterUnitIconBottle = value.trim();
  saveState();
  if (typeof window.render === "function") window.render();
  showToast("آیکون آب بروز شد");
};

// ================== FONT MANAGEMENT ==================
export function buildFontList() {
  const container = document.getElementById("fontList");
  if (!container) return;
  const currentFont = state.selectedFont || "Vazirmatn";
  container.innerHTML = FONT_LIST.map((font) => {
    const selected = currentFont === font.id ? "selected" : "";
    return `<button class="settings-item ${selected}" onclick="changeFont('${font.id}')" style="justify-content:space-between;"><span>${font.name}</span><span>${selected ? "✅" : ""}</span></button>`;
  }).join("");
}

export function changeFont(fontId) {
  applyFont(fontId);
  state.selectedFont = fontId;
  saveState();
  buildFontList();
  showToast("فونت تغییر کرد");
}
window.changeFont = changeFont;

// ================== SECTION BACKUP ==================
export const SECTION_MAP = {
  planner: "dailyTasks",
  habits: "habits",
  focus: "focusLog",
  wellness: "sleepLog",
  exercise: "exerciseLog",
  nutrition: "nutritionLog",
  water: "waterIntake",
  notepad: "notesList",
  goals: "goals",
  journal: "journalEntries",
};

export function exportSection(sectionKey) {
  const stateKey = SECTION_MAP[sectionKey];
  if (!stateKey) return;
  const exportObj = {
    type: sectionKey,
    data: state[stateKey],
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lifebos-${sectionKey}-backup-${getTodayDateString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`بکاپ بخش ${sectionKey} دانلود شد`);
}

export function importSection(sectionKey) {
  const stateKey = SECTION_MAP[sectionKey];
  if (!stateKey) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const importObj = JSON.parse(text);
      if (importObj.type === sectionKey && importObj.data !== undefined) {
        const confirmed = await showConfirmModal(
          `داده‌های بخش "${sectionKey}" با این فایل جایگزین شود؟`,
        );
        if (confirmed) {
          state[stateKey] = importObj.data;
          await saveState();
          showToast(`بخش ${sectionKey} با موفقیت بازیابی شد`);
          if (typeof window.render === "function") window.render();
        }
      } else {
        showToast(`فایل مربوط به بخش ${sectionKey} نیست`, "error");
      }
    } catch (err) {
      showToast("فایل معتبر نیست!", "error");
    }
  };
  input.click();
}

export function buildSectionBackupUI() {
  const list = document.getElementById("sectionBackupList");
  if (!list) return;
  const sections = [
    { key: "planner", label: "📋 برنامه روزانه" },
    { key: "habits", label: "✅ عادت‌ها" },
    { key: "focus", label: "🎯 تمرکز" },
    { key: "wellness", label: "🌙 خواب و تغذیه" },
    { key: "exercise", label: "🏃 تحرک" },
    { key: "notepad", label: "📝 یادداشت‌ها" },
    { key: "goals", label: "🎯 اهداف" },
    { key: "journal", label: "📖 ژورنال" },
  ];
  list.innerHTML = sections
    .map(
      (sec) =>
        `<div class="settings-item" style="display:flex; justify-content:space-between;"><span>${sec.label}</span><div><button class="small" onclick="exportSection('${sec.key}')">📥 بکاپ</button><button class="small" onclick="importSection('${sec.key}')">📤 بازیابی</button></div></div>`,
    )
    .join("");
}

// ================== FULL BACKUP ==================
export function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lifebos-full-backup-${getTodayDateString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("بکاپ کامل دانلود شد");
}

export function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      const confirmed = await showConfirmModal(
        "تمام داده‌های فعلی جایگزین شوند؟",
      );
      if (confirmed) {
        Object.assign(state, { ...DEFAULT_STATE, ...json });
        await saveState();
        showToast("داده‌ها با موفقیت بازیابی شدند");
        if (typeof window.render === "function") window.render();
      }
    } catch (err) {
      showToast("فایل معتبر نیست!", "error");
    }
  };
  input.click();
}

// ================== HELP MODAL ==================
export function openHelpModal() {
  const modal = document.getElementById("helpModal");
  if (!modal) return;
  modal.classList.add("active");
  document
    .querySelectorAll("#helpModal .tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelector('#helpModal .tab-btn[data-tab="help-guide"]')
    .classList.add("active");
  document
    .querySelectorAll("#helpModal .tab-content")
    .forEach((c) => c.classList.remove("active"));
  document.getElementById("tab-help-guide").classList.add("active");
  document.querySelectorAll("#helpModal .tab-btn").forEach((btn) => {
    btn.onclick = function () {
      document
        .querySelectorAll("#helpModal .tab-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      document
        .querySelectorAll("#helpModal .tab-content")
        .forEach((c) => c.classList.remove("active"));
      document
        .getElementById("tab-" + this.dataset.tab)
        .classList.add("active");
    };
  });
}

export function closeHelpModal() {
  document.getElementById("helpModal").classList.remove("active");
}

// ================== GLOBAL REGISTRATION ==================
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.changeTheme = changeTheme;
window.toggleTheme = toggleTheme;
window.changeBackgroundType = changeBackgroundType;
window.handleBgImageUpload = handleBgImageUpload;
window.removeBgImage = removeBgImage;
window.toggleDashboardCard = toggleDashboardCard;
window.updateScoring = updateScoring;
window.resetScoringToDefault = resetScoringToDefault;
window.exportSection = exportSection;
window.importSection = importSection;
window.exportData = exportData;
window.importData = importData;
window.openHelpModal = openHelpModal;
window.closeHelpModal = closeHelpModal;
window.calculateTodayPoints = calculateTodayPoints;
window.ALL_BADGES = ALL_BADGES;
window.refreshUI = function () {
  if (typeof window.render === "function") window.render();
};
window.resetAllData = resetAllData;
window.applySystemTheme = applySystemTheme;
window.initSystemThemeListener = initSystemThemeListener;

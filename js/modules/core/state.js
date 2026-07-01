import { getTodayDateString } from "./utils.js";

export const DB_NAME = "LifeBOSProDB_V7";
export const DB_VERSION = 1;
const STORE_NAME = "appState";

export const DEFAULT_STATE = {
  dailyTasks: [],
  habits: [
    { id: 1, name: "مدیتیشن", streak: 0, doneToday: false, icon: "🧘" },
    { id: 2, name: "مطالعه", streak: 0, doneToday: false, icon: "📖" },
    { id: 3, name: "آب کافی", streak: 0, doneToday: false, icon: "💧" },
  ],
  focusSessions: 0,
  focusMinutes: 0,
  focusLog: [],
  sleepLog: [],
  exerciseLog: [],
  nutritionLog: [],
  waterMode: "cups",
  waterGoalCups: 8,
  waterGoalBottles: 2,
  waterUnitIconCup: "🥛",
  waterUnitIconBottle: "🍾",
  waterIntake: [],
  notesList: [],
  goals: [],
  journalEntries: [],
  currentMood: "😊",
  theme: "purple",
  selectedFont: "Vazirmatn",
  dashboardCards: [
    "mood",
    "planner",
    "habits",
    "focus",
    "water",
    "sleep",
    "goals",
    "meals",
    "exercise",
    "badges",
    "notes",
  ],
  userLevel: 1,
  totalPoints: 0,
  badges: [],
  backgroundType: "default",
  backgroundImage: null,
  syncWithSystem: false, // <-- جدید: همگام با تم سیستم
  scoring: {
    habit: 5,
    focusSession: 10,
    water: 8,
    sleep: 10,
    meals: 5,
    exercise: 8,
    journal: 5,
    subtaskScores: { low: 2, normal: 3, medium: 5, high: 7, urgent: 9 },
    parentBonus: { low: 0, normal: 1, medium: 2, high: 3, urgent: 4 },
  },
  lastReset: "",
  lastPointsCalculationDate: "",
  todayEarnedPoints: 0,
};

let state = { ...DEFAULT_STATE };
export { state };

let db = null;
let dbReady = initDB();

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

async function saveStateToDB(stateObj) {
  await dbReady;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ id: "state", value: stateObj });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveState() {
  await saveStateToDB(state);
  if (window.updateTopBar) window.updateTopBar();
}

export async function loadState() {
  await dbReady;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get("state");
    req.onsuccess = () => {
      const data = req.result?.value;
      if (data) {
        const merged = { ...DEFAULT_STATE };
        Object.keys(data).forEach((key) => {
          if (key in merged) merged[key] = data[key];
        });
        if (!Array.isArray(merged.dailyTasks)) merged.dailyTasks = [];
        merged.dailyTasks = merged.dailyTasks.map((task) => ({
          ...task,
          subtasks: Array.isArray(task.subtasks)
            ? task.subtasks.map((sub) => ({
                ...sub,
                importance: sub.importance || "normal",
              }))
            : [],
          persistent:
            typeof task.persistent === "boolean" ? task.persistent : false,
        }));
        if (!Array.isArray(merged.goals)) merged.goals = [];
        merged.goals = merged.goals.map((goal) => ({
          ...goal,
          subtasks: Array.isArray(goal.subtasks)
            ? goal.subtasks.map((sub) => ({
                ...sub,
                importance: sub.importance || "normal",
              }))
            : [],
        }));
        if (!Array.isArray(merged.habits)) merged.habits = DEFAULT_STATE.habits;
        if (!Array.isArray(merged.notesList)) merged.notesList = [];
        if (!Array.isArray(merged.journalEntries)) merged.journalEntries = [];
        if (!Array.isArray(merged.sleepLog)) merged.sleepLog = [];
        if (!Array.isArray(merged.exerciseLog)) merged.exerciseLog = [];
        if (!Array.isArray(merged.nutritionLog)) merged.nutritionLog = [];
        if (!Array.isArray(merged.focusLog)) merged.focusLog = [];
        if (!Array.isArray(merged.badges)) merged.badges = [];
        if (!Array.isArray(merged.dashboardCards))
          merged.dashboardCards = DEFAULT_STATE.dashboardCards;
        if (typeof merged.userLevel !== "number") merged.userLevel = 1;
        if (typeof merged.totalPoints !== "number" || isNaN(merged.totalPoints))
          merged.totalPoints = 0;
        if (
          typeof merged.todayEarnedPoints !== "number" ||
          isNaN(merged.todayEarnedPoints)
        )
          merged.todayEarnedPoints = 0;
        if (typeof merged.syncWithSystem !== "boolean")
          merged.syncWithSystem = false;

        if (typeof merged.waterCups === "number") {
          const oldCups = merged.waterCups;
          const goal = merged.waterGoal || DEFAULT_STATE.waterGoal;
          merged.waterIntake = Array.from({ length: goal }, (_, i) =>
            i < oldCups ? 4 : 0,
          );
          delete merged.waterCups;
        }
        if (!Array.isArray(merged.waterIntake)) merged.waterIntake = [];
        if (typeof merged.waterGoal !== "number" || merged.waterGoal < 1)
          merged.waterGoal = DEFAULT_STATE.waterGoal;
        if (typeof merged.waterUnitIcon !== "string")
          merged.waterUnitIcon = DEFAULT_STATE.waterUnitIcon;
        while (merged.waterIntake.length < merged.waterGoal)
          merged.waterIntake.push(0);
        if (merged.waterIntake.length > merged.waterGoal)
          merged.waterIntake = merged.waterIntake.slice(0, merged.waterGoal);

        if (!merged.scoring || typeof merged.scoring !== "object") {
          merged.scoring = { ...DEFAULT_STATE.scoring };
        } else {
          if (typeof merged.scoring.subtask === "number")
            delete merged.scoring.subtask;
          if (merged.scoring.subtaskBaseScores) {
            if (!merged.scoring.subtaskScores)
              merged.scoring.subtaskScores = {
                ...merged.scoring.subtaskBaseScores,
              };
            delete merged.scoring.subtaskBaseScores;
          }
          if (merged.scoring.parentImportanceBonus) {
            if (!merged.scoring.parentBonus)
              merged.scoring.parentBonus = {
                ...merged.scoring.parentImportanceBonus,
              };
            delete merged.scoring.parentImportanceBonus;
          }
          if (!merged.scoring.subtaskScores)
            merged.scoring.subtaskScores = {
              ...DEFAULT_STATE.scoring.subtaskScores,
            };
          else {
            ["low", "normal", "medium", "high", "urgent"].forEach((l) => {
              if (
                typeof merged.scoring.subtaskScores[l] !== "number" ||
                isNaN(merged.scoring.subtaskScores[l])
              )
                merged.scoring.subtaskScores[l] =
                  DEFAULT_STATE.scoring.subtaskScores[l];
            });
          }
          if (!merged.scoring.parentBonus)
            merged.scoring.parentBonus = {
              ...DEFAULT_STATE.scoring.parentBonus,
            };
          else {
            ["low", "normal", "medium", "high", "urgent"].forEach((l) => {
              if (
                typeof merged.scoring.parentBonus[l] !== "number" ||
                isNaN(merged.scoring.parentBonus[l])
              )
                merged.scoring.parentBonus[l] =
                  DEFAULT_STATE.scoring.parentBonus[l];
            });
          }
          [
            "habit",
            "focusSession",
            "water",
            "sleep",
            "meals",
            "exercise",
            "journal",
          ].forEach((k) => {
            if (
              typeof merged.scoring[k] !== "number" ||
              isNaN(merged.scoring[k])
            )
              merged.scoring[k] = DEFAULT_STATE.scoring[k];
          });
        }

        if (typeof merged.selectedFont !== "string")
          merged.selectedFont = DEFAULT_STATE.selectedFont;
        if (!["default", "glass", "custom"].includes(merged.backgroundType))
          merged.backgroundType = "default";
        if (
          typeof merged.backgroundImage !== "string" &&
          merged.backgroundImage !== null
        )
          merged.backgroundImage = null;

        Object.assign(state, merged);
      } else {
        Object.assign(state, { ...DEFAULT_STATE });
      }
      resolve();
    };
    req.onerror = () => {
      Object.assign(state, { ...DEFAULT_STATE });
      resolve();
    };
  });
}

export async function resetAllData() {
  if (!confirm("ریست کامل؟ تمام داده‌ها و تنظیمات پاک خواهد شد.")) return;
  if (db) {
    db.close();
    db = null;
    dbReady = initDB();
  }
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) await reg.unregister();
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (e) {
    console.warn("SW/Cache cleanup error", e);
  }
  const deleteReq = indexedDB.deleteDatabase(DB_NAME);
  deleteReq.onsuccess = () => window.location.reload(true);
  deleteReq.onerror = () =>
    alert("خطا در حذف داده‌ها. لطفاً همه تب‌ها را ببندید و دوباره تلاش کنید.");
  deleteReq.onblocked = () =>
    alert(
      "پایگاه داده در حال استفاده است. لطفاً همه تب‌های باز برنامه را ببندید و دوباره امتحان کنید.",
    );
}

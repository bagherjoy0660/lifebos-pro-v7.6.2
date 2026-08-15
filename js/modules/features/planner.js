// ================== PLANNER v8.0 (بازنویسی کامل با کلاس‌های تم) ==================
import { state, saveState } from "../core/state.js";
import {
  getImportanceColor,
  getImportanceLabel,
  showImportancePicker,
  showInputModal,
  showConfirmModal,
  showToast,
} from "../core/utils.js";
import { calculateTodayPoints } from "./settings.js";

export function renderPlanner(container) {
  let html = `<div class="card fade-in"><div style="display:flex; justify-content:space-between;"><h2>📋 برنامه امروز</h2><button class="primary" onclick="addNewTask()">+ افزودن وظیفه</button></div><div>`;

  const dailyTasks = state.dailyTasks.filter((t) => !t.persistent);
  const persistentTasks = state.dailyTasks.filter((t) => t.persistent);

  const renderTask = (task) => {
    const done = task.subtasks.filter((s) => s.done).length;
    const total = task.subtasks.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const isPersistent = task.persistent;

    return `<div class="task-card ${isPersistent ? "persistent" : ""}">
      <div class="task-header">
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <span class="badge badge-${task.importance}">${getImportanceLabel(task.importance)}</span>
          <span class="task-title">${task.title}</span>
          ${isPersistent ? '<span style="color:var(--info);" title="ماندگار">📌</span>' : ""}
        </div>
        <div class="task-meta">
          <span class="badge">${pct}%</span>
          <button class="small" onclick="togglePersistent(${task.id})" title="${isPersistent ? "تبدیل به روزانه" : "ماندگار کردن"}">${isPersistent ? "📌" : "📍"}</button>
          <button class="small" onclick="editTask(${task.id})">✏️</button>
          <button class="small danger" onclick="deleteTask(${task.id})">🗑️</button>
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:12px;"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <div>${task.subtasks
        .map(
          (sub) => `
        <div class="subtask-item">
          <input type="checkbox" ${sub.done ? "checked" : ""} onchange="toggleSubtask(${task.id},${sub.id})">
          <span class="subtask-text ${sub.done ? "done" : ""}">${sub.text}</span>
          <span class="badge badge-${sub.importance || "normal"} subtask-badge">${getImportanceLabel(sub.importance || "normal")}</span>
        </div>
      `,
        )
        .join("")}</div>
      <button class="small" style="margin-top:10px;" onclick="addSubtask(${task.id})">+ زیروظیفه</button>
    </div>`;
  };

  if (dailyTasks.length > 0) {
    html += '<h3 style="margin:16px 0 8px; color:var(--text2);">📆 امروز</h3>';
    dailyTasks.forEach((task) => (html += renderTask(task)));
  }

  if (persistentTasks.length > 0) {
    html +=
      '<h3 style="margin:24px 0 8px; color:var(--info);">📌 برنامه‌های ماندگار</h3>';
    persistentTasks.forEach((task) => (html += renderTask(task)));
  }

  if (dailyTasks.length === 0 && persistentTasks.length === 0) {
    html +=
      "<p style='color:var(--text3); text-align:center; padding:40px;'>هنوز وظیفه‌ای ثبت نشده</p>";
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

// ================== GLOBAL HANDLERS (با اعتبارسنجی) ==================

// افزودن وظیفه جدید
window.addNewTask = async function () {
  const title = await showInputModal(
    "عنوان وظیفه جدید",
    "مثال: خرید مواد غذایی",
  );
  if (title === null) return;

  if (!title || !title.trim()) {
    showToast("عنوان وظیفه نمی‌تواند خالی باشد!", "warning");
    return;
  }

  const importance = await showImportancePicker();
  if (importance === null) return;

  state.dailyTasks.push({
    id: Date.now(),
    title: title.trim(),
    importance: importance,
    subtasks: [],
    persistent: false,
  });

  await saveState();
  showToast("وظیفه جدید اضافه شد ✅");
  if (typeof window.render === "function") await window.render();
};

// تغییر وضعیت ماندگار
window.togglePersistent = async function (id) {
  const task = state.dailyTasks.find((t) => t.id === id);
  if (!task) return;
  task.persistent = !task.persistent;
  await saveState();
  showToast(
    task.persistent
      ? "به برنامه ماندگار اضافه شد 📌"
      : "به برنامه روزانه منتقل شد",
  );
  if (typeof window.render === "function") await window.render();
};

// ویرایش وظیفه
window.editTask = async function (id) {
  const task = state.dailyTasks.find((t) => t.id === id);
  if (!task) return;

  const newTitle = await showInputModal("ویرایش عنوان وظیفه", "", task.title);
  if (newTitle === null) return;

  if (!newTitle || !newTitle.trim()) {
    showToast("عنوان وظیفه نمی‌تواند خالی باشد!", "warning");
    return;
  }

  task.title = newTitle.trim();

  const newImportance = await showImportancePicker(task.importance);
  if (newImportance) task.importance = newImportance;

  await saveState();
  showToast("وظیفه ویرایش شد");
  if (typeof window.render === "function") await window.render();
};

// حذف وظیفه
window.deleteTask = async function (id) {
  const confirmed = await showConfirmModal("آیا از حذف این وظیفه مطمئن هستید؟");
  if (!confirmed) return;
  state.dailyTasks = state.dailyTasks.filter((t) => t.id !== id);
  await saveState();
  showToast("وظیفه حذف شد", "error");
  if (typeof window.render === "function") await window.render();
};

// افزودن زیروظیفه
window.addSubtask = async function (taskId) {
  const text = await showInputModal("متن زیروظیفه", "مثال: خرید نان");
  if (text === null) return;

  if (!text || !text.trim()) {
    showToast("متن زیروظیفه نمی‌تواند خالی باشد!", "warning");
    return;
  }

  const importance = await showImportancePicker("normal");
  if (importance === null) return;

  const task = state.dailyTasks.find((t) => t.id === taskId);
  if (!task) return;

  task.subtasks.push({
    id: Date.now(),
    text: text.trim(),
    done: false,
    importance: importance,
  });

  await saveState();
  await calculateTodayPoints();
  showToast("زیروظیفه اضافه شد");
  if (typeof window.render === "function") await window.render();
};

// تغییر وضعیت زیروظیفه (تیک)
window.toggleSubtask = async function (taskId, subId) {
  const task = state.dailyTasks.find((t) => t.id === taskId);
  if (!task) return;
  const sub = task.subtasks.find((s) => s.id === subId);
  if (!sub) return;
  sub.done = !sub.done;
  await saveState();
  await calculateTodayPoints();
  if (typeof window.render === "function") await window.render();
};

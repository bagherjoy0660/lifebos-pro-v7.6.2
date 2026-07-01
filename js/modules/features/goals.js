// ================== GOALS v7.7 (با اعتبارسنجی) ==================
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

export function renderGoals(container) {
  let html = `<div class="card fade-in">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <h2>🎯 اهداف بلندمدت</h2>
      <button class="primary" onclick="addGoal()">+ هدف جدید</button>
    </div>`;

  if (state.goals.length === 0) {
    html += `<p style="color:var(--text3); text-align:center; padding:60px;">هنوز هدفی تعریف نکرده‌ای</p>`;
  } else {
    state.goals.forEach((goal) => {
      const total = goal.subtasks.length;
      const done = goal.subtasks.filter((s) => s.done).length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      html += `
        <div class="card importance-${goal.importance}" style="margin-bottom:20px; background:var(--surface2);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="badge" style="background:${getImportanceColor(goal.importance)};color:#fff;">${getImportanceLabel(goal.importance)}</span>
              <strong>${goal.title}</strong>
            </div>
            <div style="display:flex; gap:8px;">
              <span class="badge">${pct}%</span>
              <button class="small" onclick="editGoal(${goal.id})">✏️</button>
              <button class="small danger" onclick="deleteGoal(${goal.id})">🗑️</button>
            </div>
          </div>
          <div class="progress-bar" style="margin:12px 0;"><div class="progress-fill" style="width:${pct}%;"></div></div>
          <div>${goal.subtasks
            .map(
              (sub) => `
            <div class="subtask-item">
              <input type="checkbox" ${sub.done ? "checked" : ""} onchange="toggleGoalSubtask(${goal.id},${sub.id})" style="width:20px;height:20px;accent-color:var(--accent);">
              <span style="flex:1;text-decoration:${sub.done ? "line-through" : ""};">${sub.text}</span>
              <span class="badge" style="background:${getImportanceColor(sub.importance)};color:#fff;">${getImportanceLabel(sub.importance)}</span>
            </div>
          `,
            )
            .join("")}</div>
          <button class="small" style="margin-top:12px; width:100%;" onclick="addGoalSubtask(${goal.id})">+ زیرهدف</button>
        </div>`;
    });
  }

  html += `</div>`;
  container.innerHTML = html;
}

// ================== GLOBAL HANDLERS (با اعتبارسنجی) ==================

// افزودن هدف جدید
window.addGoal = async function () {
  const title = await showInputModal(
    "عنوان هدف جدید",
    "مثال: یادگیری زبان انگلیسی",
  );
  if (title === null) return; // کاربر لغو کرد

  // اعتبارسنجی: عنوان نباید خالی باشد
  if (!title || !title.trim()) {
    showToast("عنوان هدف نمی‌تواند خالی باشد!", "warning");
    return;
  }

  const importance = await showImportancePicker();
  if (importance === null) return;

  state.goals.push({
    id: Date.now(),
    title: title.trim(),
    importance: importance,
    subtasks: [],
  });

  await saveState();
  showToast(`هدف "${title.trim()}" اضافه شد 🎯`);
  if (typeof window.render === "function") await window.render();
};

// ویرایش هدف
window.editGoal = async function (id) {
  const goal = state.goals.find((g) => g.id === id);
  if (!goal) return;

  const newTitle = await showInputModal("ویرایش عنوان هدف", "", goal.title);
  if (newTitle === null) return; // کاربر لغو کرد

  // اعتبارسنجی: عنوان نباید خالی باشد
  if (!newTitle || !newTitle.trim()) {
    showToast("عنوان هدف نمی‌تواند خالی باشد!", "warning");
    return;
  }

  goal.title = newTitle.trim();

  const newImportance = await showImportancePicker(goal.importance);
  if (newImportance) goal.importance = newImportance;

  await saveState();
  showToast("هدف ویرایش شد");
  if (typeof window.render === "function") await window.render();
};

// حذف هدف
window.deleteGoal = async function (id) {
  const confirmed = await showConfirmModal(
    "آیا از حذف این هدف و تمام زیرهدف‌های آن مطمئن هستید؟",
  );
  if (!confirmed) return;

  const goalName = state.goals.find((g) => g.id === id)?.title || "هدف";
  state.goals = state.goals.filter((g) => g.id !== id);
  await saveState();
  showToast(`${goalName} حذف شد`, "error");
  if (typeof window.render === "function") await window.render();
};

// افزودن زیرهدف
window.addGoalSubtask = async function (gid) {
  const text = await showInputModal("متن زیرهدف", "مثال: روزی ۲۰ کلمه جدید");
  if (text === null) return; // کاربر لغو کرد

  // اعتبارسنجی: متن زیرهدف نباید خالی باشد
  if (!text || !text.trim()) {
    showToast("متن زیرهدف نمی‌تواند خالی باشد!", "warning");
    return;
  }

  const importance = await showImportancePicker("normal");
  if (importance === null) return;

  const goal = state.goals.find((g) => g.id === gid);
  if (!goal) return;

  goal.subtasks.push({
    id: Date.now(),
    text: text.trim(),
    importance: importance,
    done: false,
  });

  await saveState();
  await calculateTodayPoints();
  showToast("زیرهدف اضافه شد");
  if (typeof window.render === "function") await window.render();
};

// تغییر وضعیت زیرهدف (تیک)
window.toggleGoalSubtask = async function (gid, sid) {
  const goal = state.goals.find((g) => g.id === gid);
  const sub = goal?.subtasks.find((s) => s.id === sid);
  if (!sub) return;

  sub.done = !sub.done;
  await saveState();
  await calculateTodayPoints();
  if (typeof window.render === "function") await window.render();
};

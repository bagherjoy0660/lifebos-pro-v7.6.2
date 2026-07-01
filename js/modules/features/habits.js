// ================== HABITS v7.7 (با اعتبارسنجی) ==================
import { state, saveState } from "../core/state.js";
import { calculateTodayPoints } from "./settings.js";
import { showInputModal, showConfirmModal, showToast } from "../core/utils.js";

export function renderHabits(container) {
  let html = `<div class="card fade-in">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <h2>✅ عادت‌های روزانه</h2>
      <button class="primary" onclick="addHabit()">+ عادت جدید</button>
    </div>`;

  if (state.habits.length === 0) {
    html += `<p style="color:var(--text3); text-align:center; padding:40px;">هنوز عادتی ثبت نشده</p>`;
  } else {
    state.habits.forEach((h) => {
      html += `
        <div style="display:flex; align-items:center; gap:12px; padding:14px; background:var(--surface2); border-radius:12px; margin-bottom:10px;">
          <span style="font-size:1.6rem;">${h.icon}</span>
          <span style="flex:1; font-weight:500;">${h.name}</span>
          <span class="badge" style="background:${h.doneToday ? "var(--success)" : "var(--surface3)"}; cursor:pointer; padding:8px 14px;" onclick="toggleHabit(${h.id})">
            ${h.doneToday ? "✓ انجام شد" : "انجام نشده"}
          </span>
          <span style="color:var(--orange); font-weight:bold;">🔥 ${h.streak}</span>
          <button class="small danger" onclick="deleteHabit(${h.id})">🗑️</button>
        </div>`;
    });
  }

  html += `</div>`;
  container.innerHTML = html;
}

// ================== GLOBAL HANDLERS (با اعتبارسنجی) ==================

// افزودن عادت جدید
window.addHabit = async function () {
  const name = await showInputModal("نام عادت جدید", "مثال: مدیتیشن صبحگاهی");
  if (name === null) return; // کاربر لغو کرد

  // اعتبارسنجی: نام عادت نباید خالی باشد
  if (!name || !name.trim()) {
    showToast("نام عادت نمی‌تواند خالی باشد!", "warning");
    return;
  }

  const icon = await showInputModal("آیکون عادت", "مثال: 🧘", "•");
  if (icon === null) return;

  // اعتبارسنجی: آیکون نباید خالی باشد (حداقل یک کاراکتر)
  if (!icon || !icon.trim()) {
    showToast(
      "آیکون نمی‌تواند خالی باشد! از یک ایموجی یا کاراکتر استفاده کنید.",
      "warning",
    );
    return;
  }

  const id = Math.max(0, ...state.habits.map((h) => h.id), 0) + 1;

  state.habits.push({
    id,
    name: name.trim(),
    streak: 0,
    doneToday: false,
    icon: icon.trim() || "•",
  });

  await saveState();
  showToast(`عادت "${name.trim()}" اضافه شد ✅`);
  if (typeof window.render === "function") await window.render();
};

// تغییر وضعیت عادت (انجام/انجام نشده)
window.toggleHabit = async function (id) {
  const h = state.habits.find((x) => x.id === id);
  if (!h) return;

  h.doneToday = !h.doneToday;
  h.streak = h.doneToday ? h.streak + 1 : Math.max(0, h.streak - 1);

  await saveState();
  await calculateTodayPoints();

  showToast(
    h.doneToday
      ? `✅ ${h.name} انجام شد! 🔥 استریک: ${h.streak}`
      : `${h.name} لغو شد`,
  );
  if (typeof window.render === "function") await window.render();
};

// حذف عادت
window.deleteHabit = async function (id) {
  const confirmed = await showConfirmModal("آیا از حذف این عادت مطمئن هستید؟");
  if (!confirmed) return;

  const habitName = state.habits.find((h) => h.id === id)?.name || "عادت";
  state.habits = state.habits.filter((h) => h.id !== id);
  await saveState();
  showToast(`${habitName} حذف شد`, "error");
  if (typeof window.render === "function") await window.render();
};

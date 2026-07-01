// ================== EXERCISE v7.7 (با اعتبارسنجی) ==================
import { state, saveState } from "../core/state.js";
import { getTodayDateString, showToast } from "../core/utils.js";
import { calculateTodayPoints } from "./settings.js";

export function renderExercise(container) {
  const today = getTodayDateString();
  const todayExercises = state.exerciseLog.filter((e) => e.date === today);

  container.innerHTML = `
    <div class="card fade-in">
      <h2>🏃 فعالیت ورزشی</h2>
      <div style="display:flex; gap:8px; margin:20px 0;">
        <input id="exType" placeholder="نوع فعالیت (مثال: پیاده‌روی)" style="flex:1;">
        <input id="exMins" type="number" placeholder="دقیقه" style="width:100px;" min="1">
        <button class="primary" onclick="logExercise()">ثبت</button>
      </div>

      <h3>امروز (${todayExercises.length} فعالیت)</h3>
      <div style="margin-top:12px;">
        ${
          todayExercises.length
            ? todayExercises
                .map(
                  (e) => `
          <div style="display:flex; justify-content:space-between; padding:10px; background:var(--surface2); border-radius:10px; margin-bottom:8px;">
            <span>${e.type}</span>
            <span style="color:var(--accent); font-weight:bold;">${e.minutes} دقیقه</span>
          </div>
        `,
                )
                .join("")
            : `<p style="color:var(--text3); text-align:center; padding:40px 0;">هنوز فعالیتی ثبت نشده</p>`
        }
      </div>
    </div>
  `;
}

// ================== LOG EXERCISE (با اعتبارسنجی) ==================
window.logExercise = async function () {
  const typeInput = document.getElementById("exType");
  const minsInput = document.getElementById("exMins");

  const type = typeInput?.value.trim();
  const mins = parseInt(minsInput?.value);

  // اعتبارسنجی: نوع فعالیت نباید خالی باشد
  if (!type) {
    showToast("لطفاً نوع فعالیت را وارد کنید", "warning");
    typeInput?.focus();
    return;
  }

  // اعتبارسنجی: دقیقه باید عدد مثبت باشد
  if (isNaN(mins) || mins <= 0) {
    showToast("لطفاً دقیقه معتبر (بزرگتر از ۰) وارد کنید", "warning");
    minsInput?.focus();
    return;
  }

  // محدودیت: حداکثر ۵ دقیقه کمتر از ۱ نیست پس نیازی به max نیست

  // ثبت فعالیت
  state.exerciseLog.push({
    date: getTodayDateString(),
    type: type,
    minutes: mins,
  });

  await saveState();
  await calculateTodayPoints();

  showToast(`فعالیت ${type} (${mins} دقیقه) ثبت شد 🏃`, "success");

  // پاک کردن فیلدها
  if (typeInput) typeInput.value = "";
  if (minsInput) minsInput.value = "";

  if (typeof window.render === "function") window.render();
};

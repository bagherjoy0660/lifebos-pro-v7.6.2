// ================== JOURNAL v7.7 (با اعتبارسنجی) ==================
import { state, saveState } from "../core/state.js";
import { getTodayDateString, formatFaDate, showToast } from "../core/utils.js";
import { calculateTodayPoints } from "./settings.js";

export function renderJournal(container) {
  const today = getTodayDateString();
  const moods = ["😄", "😊", "😐", "😕", "😢", "🤩", "😤", "🥱"];

  const todayEntries = state.journalEntries.filter((j) => j.date === today);
  const recentEntries = state.journalEntries.slice(-3).reverse();

  container.innerHTML = `
    <div class="card fade-in" style="
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 20px 24px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow);
    ">
      <div style="
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: repeating-linear-gradient(
          to bottom,
          transparent,
          transparent 31px,
          var(--border) 31px,
          var(--border) 32px
        );
        opacity: 0.25;
        pointer-events: none;
        z-index: 0;
      "></div>

      <div style="position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; font-weight: 700;">📖 ژورنال امروز</h2>
          <span style="color: var(--text3); font-size: 0.9rem;">${formatFaDate(new Date())}</span>
        </div>

        <!-- انتخاب حالت روحی -->
        <div style="display: flex; gap: 10px; margin-bottom: 16px; justify-content: center; flex-wrap: wrap;">
          ${moods
            .map(
              (m) => `
            <span style="
              font-size: 2rem;
              cursor: pointer;
              opacity: ${state.currentMood === m ? 1 : 0.4};
              transform: ${state.currentMood === m ? "scale(1.2)" : "scale(1)"};
              transition: all 0.2s ease;
            " onclick="setMood('${m}')">${m}</span>
          `,
            )
            .join("")}
        </div>

        <!-- Textarea -->
        <textarea id="journalText" placeholder="امروز چه گذشت؟ چه احساسی داری؟ بنویس..."
          style="
            width: 100%;
            min-height: 110px;
            background: transparent;
            border: none;
            outline: none;
            color: var(--text);
            font-size: 0.95rem;
            line-height: 2;
            resize: vertical;
            font-family: var(--font);
            padding: 6px 0;
          "></textarea>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px;">
          <button class="primary" onclick="saveJournal()" style="
            background: var(--accent);
            border: none;
            color: white;
            border-radius: 30px;
            padding: 10px 28px;
            font-weight: bold;
            cursor: pointer;
            transition: 0.2s;
            box-shadow: 0 4px 12px rgba(108,92,231,0.25);
          ">💾 ذخیره</button>
        </div>

        <!-- یادداشت‌های امروز -->
        ${
          todayEntries.length > 0
            ? `
          <div style="margin-top: 20px; border-top: 1px solid var(--border); padding-top: 12px;">
            <h4 style="margin: 0 0 8px 0; color: var(--text2); font-size: 0.9rem;">یادداشت‌های امروز (${todayEntries.length})</h4>
            <div style="max-height: 180px; overflow-y: auto; padding-right: 4px;">
              ${todayEntries
                .slice()
                .reverse()
                .map(
                  (j) => `
                <div style="margin-bottom: 8px; padding: 8px; background: var(--surface2); border-radius: 8px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text3);">
                    <span>${j.mood}</span>
                    <span>${j.time || ""}</span>
                  </div>
                  <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text2); white-space: pre-wrap;">${j.text}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- آخرین نوشته‌ها -->
        <div style="margin-top: 20px; border-top: 1px solid var(--border); padding-top: 12px;">
          <h4 style="margin: 0 0 8px 0; color: var(--text2); font-size: 0.9rem;">آخرین نوشته‌ها</h4>
          <div style="max-height: 200px; overflow-y: auto; padding-right: 4px;">
            ${
              recentEntries
                .map(
                  (j) => `
              <div style="margin-bottom: 8px; padding: 8px; background: var(--surface2); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text3);">
                  <span>${j.mood} ${j.date}</span>
                  <span>${j.time || ""}</span>
                </div>
                <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text2);">${j.text.substring(0, 80)}...</p>
              </div>
            `,
                )
                .join("") ||
              '<p style="color: var(--text3); font-size: 0.85rem;">هنوز نوشته‌ای نداری.</p>'
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

// ================== GLOBAL HANDLERS (با اعتبارسنجی) ==================

// تغییر حالت روحی
window.setMood = async function (m) {
  state.currentMood = m;
  await saveState();
  showToast(`حالت روحی به ${m} تغییر کرد`);
  if (typeof window.render === "function") await window.render();
};

// ذخیره ژورنال (با اعتبارسنجی)
window.saveJournal = async function () {
  const textArea = document.getElementById("journalText");
  const text = textArea?.value?.trim();

  // اعتبارسنجی: متن نباید خالی باشد
  if (!text) {
    showToast("لطفاً چیزی بنویسید!", "warning");
    textArea?.focus();
    return;
  }

  // اعتبارسنجی: حداقل ۳ کاراکتر (اختیاری ولی مفید)
  if (text.length < 3) {
    showToast("متن ژورنال باید حداقل ۳ کاراکتر باشد!", "warning");
    textArea?.focus();
    return;
  }

  const now = new Date();
  const today = getTodayDateString();
  const time = now.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  state.journalEntries.push({
    id: Date.now(),
    date: today,
    time: time,
    mood: state.currentMood,
    text: text,
  });

  await saveState();
  await calculateTodayPoints();
  showToast("📖 ژورنال با موفقیت ذخیره شد", "success");

  // پاک کردن فیلد بعد از ذخیره موفق
  if (textArea) textArea.value = "";
  if (typeof window.render === "function") await window.render();
};

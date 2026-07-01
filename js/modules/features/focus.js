// ================== FOCUS (POMODORO) v7.4 (بدون alert) ==================
import { state, saveState } from "../core/state.js";
import { getTodayDateString } from "../core/utils.js";
import { calculateTodayPoints } from "./settings.js";
import { showToast } from "../core/utils.js";

let pomodoroTimer = null;
let pomodoroSeconds = 25 * 60;
let pomodoroRunning = false;
let pomodoroIsBreak = false;
let pomodoroTotalSeconds = 25 * 60;
let customWorkSeconds = null;
let customBreakSeconds = null;

export function renderFocus(container) {
  const total = pomodoroTotalSeconds;
  const elapsed = total - pomodoroSeconds;
  const progress = total ? elapsed / total : 0;
  const circumference = 2 * Math.PI * 90;
  const dashoffset = circumference * (1 - progress);

  const m = Math.floor(pomodoroSeconds / 60);
  const s = pomodoroSeconds % 60;

  container.innerHTML = `
    <div class="card fade-in" style="background: linear-gradient(145deg, var(--surface2) 0%, var(--surface) 100%); border: 1px solid var(--border); padding: 30px 24px; text-align: center;">
      <h2 style="margin: 0 0 20px 0; font-weight: 700; letter-spacing: -0.5px;">
        ${pomodoroIsBreak ? "☕ استراحت" : "🎯 تمرکز عمیق"}
      </h2>
      
      <div class="pomodoro-ring-container" style="position: relative; width: 200px; height: 200px; margin: 0 auto 24px auto;">
        <svg width="200" height="200" style="transform: rotate(-90deg);">
          <circle cx="100" cy="100" r="90" fill="none" stroke="var(--surface3)" stroke-width="12" />
          <circle cx="100" cy="100" r="90" fill="none" 
                  stroke="${pomodoroIsBreak ? "var(--success)" : "var(--accent)"}" 
                  stroke-width="12"
                  stroke-linecap="round"
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${dashoffset}"
                  style="transition: stroke-dashoffset 0.5s ease;" />
        </svg>
        <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; 
                    font-size: 2.8rem; font-weight: 800; letter-spacing: -1px;
                    color: ${pomodoroRunning ? (pomodoroIsBreak ? "var(--success)" : "var(--accent)") : "var(--text)"};">
          ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}
        </div>
      </div>

      <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
        <button class="pomo-preset-btn" onclick="setPomo(25)" style="width: 70px; height: 70px; border-radius: 50%; 
                background: var(--surface3); border: none; color: var(--text); font-weight: bold; font-size: 0.9rem;
                cursor: pointer; transition: 0.2s; ${!pomodoroRunning && pomodoroTotalSeconds === 25 * 60 ? "box-shadow: 0 0 0 3px var(--accent);" : ""}">
          ۲۵ <br>دقیقه
        </button>
        <button class="pomo-preset-btn" onclick="setPomo(45)" style="width: 70px; height: 70px; border-radius: 50%; 
                background: var(--surface3); border: none; color: var(--text); font-weight: bold; font-size: 0.9rem;
                cursor: pointer; transition: 0.2s; ${!pomodoroRunning && pomodoroTotalSeconds === 45 * 60 ? "box-shadow: 0 0 0 3px var(--accent);" : ""}">
          ۴۵ <br>دقیقه
        </button>
        <button class="pomo-preset-btn" onclick="setPomo(5)" style="width: 70px; height: 70px; border-radius: 50%; 
                background: var(--surface3); border: none; color: var(--text); font-weight: bold; font-size: 0.9rem;
                cursor: pointer; transition: 0.2s; ${!pomodoroRunning && pomodoroTotalSeconds === 5 * 60 ? "box-shadow: 0 0 0 3px var(--success);" : ""}">
          ۵ <br>دقیقه
        </button>
      </div>

      <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 24px;">
        <input type="number" id="customPomoMinutes" placeholder="دلخواه" min="1" 
               style="width: 80px; text-align: center; background: var(--surface3); border: 1px solid var(--border); 
                      border-radius: 20px; padding: 8px 10px; color: var(--text); font-weight: bold;">
        <button onclick="setCustomPomo()" style="background: var(--surface3); border: none; color: var(--text); 
                border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.2rem;">⏱</button>
      </div>

      <div style="display: flex; justify-content: center; gap: 16px;">
        ${
          pomodoroRunning
            ? `<button onclick="pausePomo()" style="background: var(--warning); border: none; color: #000; 
                    border-radius: 30px; padding: 12px 24px; font-weight: bold; cursor: pointer;">⏸ مکث</button>
             <button onclick="stopPomo()" style="background: var(--danger); border: none; color: white; 
                    border-radius: 30px; padding: 12px 24px; font-weight: bold; cursor: pointer;">⏹ پایان</button>`
            : `<button onclick="startPomo()" style="background: var(--accent); border: none; color: white; 
                    border-radius: 30px; padding: 14px 40px; font-weight: bold; font-size: 1.1rem; cursor: pointer; 
                    box-shadow: 0 4px 15px rgba(108,92,231,0.3);">▶ شروع</button>`
        }
      </div>
      
      <div style="margin-top: 24px; display: flex; justify-content: center; gap: 24px; color: var(--text2); font-weight: 500;">
        <span>🎯 ${state.focusSessions} جلسه</span>
        <span>⏳ ${state.focusMinutes} دقیقه</span>
      </div>
    </div>
  `;
}

// ================== POMODORO FUNCTIONS ==================
window.setCustomPomo = function () {
  if (pomodoroRunning) return;
  const input = document.getElementById("customPomoMinutes");
  if (!input) return;
  const mins = parseInt(input.value);
  if (isNaN(mins) || mins <= 0) {
    showToast("لطفاً یک عدد معتبر وارد کنید", "warning");
    return;
  }
  pomodoroSeconds = mins * 60;
  pomodoroTotalSeconds = mins * 60;
  pomodoroIsBreak = false;
  customWorkSeconds = mins * 60;
  customBreakSeconds = 5 * 60;
  window.render();
  showToast(`⏱ تایمر ${mins} دقیقه‌ای تنظیم شد`);
};

window.setPomo = function (min) {
  if (pomodoroRunning) return;
  pomodoroSeconds = min * 60;
  pomodoroTotalSeconds = min * 60;
  pomodoroIsBreak = min <= 10;
  if (pomodoroIsBreak) {
    customBreakSeconds = min * 60;
  } else {
    customWorkSeconds = min * 60;
    customBreakSeconds = 5 * 60;
  }
  window.render();
};

window.startPomo = function () {
  if (pomodoroRunning) return;
  pomodoroRunning = true;
  window.render();

  pomodoroTimer = setInterval(() => {
    if (pomodoroSeconds <= 0) {
      clearInterval(pomodoroTimer);
      pomodoroRunning = false;

      if (!pomodoroIsBreak) {
        const minutes = Math.round(pomodoroTotalSeconds / 60);
        state.focusSessions++;
        state.focusMinutes += minutes;

        const today = getTodayDateString();
        const existing = state.focusLog.find((l) => l.date === today);
        if (existing) {
          existing.sessions++;
          existing.minutes += minutes;
        } else {
          state.focusLog.push({ date: today, sessions: 1, minutes });
        }

        saveState();
        calculateTodayPoints();
        pomodoroIsBreak = true;
        pomodoroSeconds = customBreakSeconds || 5 * 60;
        pomodoroTotalSeconds = pomodoroSeconds;
        showToast("🎯 جلسه فوکوس تمام شد! زمان استراحت", "success", 4000);
      } else {
        pomodoroIsBreak = false;
        pomodoroSeconds = customWorkSeconds || 25 * 60;
        pomodoroTotalSeconds = pomodoroSeconds;
        showToast("☕ استراحت تمام شد! آماده جلسه بعدی؟");
      }
      window.render();
      return;
    }
    pomodoroSeconds--;
    window.render();
  }, 1000);
};

window.pausePomo = function () {
  clearInterval(pomodoroTimer);
  pomodoroRunning = false;
  window.render();
  showToast("⏸ تایمر مکث شد");
};

window.stopPomo = function () {
  clearInterval(pomodoroTimer);
  pomodoroRunning = false;
  pomodoroSeconds = pomodoroTotalSeconds;
  window.render();
  showToast("⏹ تایمر متوقف شد");
};

window.resetPomo = function () {
  clearInterval(pomodoroTimer);
  pomodoroRunning = false;
  pomodoroIsBreak = false;
  pomodoroSeconds = customWorkSeconds || 25 * 60;
  pomodoroTotalSeconds = pomodoroSeconds;
  window.render();
};

window.pomodoroTimer = pomodoroTimer;
window.pomodoroRunning = pomodoroRunning;

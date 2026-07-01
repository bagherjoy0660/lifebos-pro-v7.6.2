// ================== UTILS v7.4 (کامل با Modal و Toast) ==================
export function escapeHtml(text) {
  if (!text) return "";
  return text.replace(
    /[&<>"]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m],
  );
}

export function getImportanceColor(imp) {
  const map = {
    urgent: "var(--danger)",
    high: "var(--warning)",
    medium: "var(--info)",
    normal: "var(--text3)",
    low: "var(--success)",
  };
  return map[imp] || "var(--text3)";
}

export function getImportanceLabel(imp) {
  const map = {
    urgent: "⚡ ضروری",
    high: "🔥 مهم",
    medium: "📌 متوسط",
    normal: "📎 معمولی",
    low: "✅ کم",
  };
  return map[imp] || "معمولی";
}

export function getTodayDateString() {
  return new Date().toDateString();
}

export function formatFaDate(date) {
  return moment(date).locale("fa").format("dddd، jD jMMMM jYYYY");
}

export const THEME_COLORS = {
  purple: { main: "#6c5ce7", light: "#a29bfe" },
  blue: { main: "#0984e3", light: "#74b9ff" },
  green: { main: "#00b894", light: "#55efc4" },
  orange: { main: "#e67e22", light: "#fab1a0" },
  red: { main: "#e74c3c", light: "#ff7675" },
  pink: { main: "#fd79a8", light: "#ffeaa7" },
  teal: { main: "#00cec9", light: "#81ecec" },
  gold: { main: "#fdcb6e", light: "#ffeaa7" },
};

// ================== IMPORTANCE PICKER MODAL ==================
export function showImportancePicker(currentValue = "normal") {
  return new Promise((resolve) => {
    const items = [
      { value: "urgent", label: "⚡ ضروری", color: "var(--danger)" },
      { value: "high", label: "🔥 مهم", color: "var(--warning)" },
      { value: "medium", label: "📌 متوسط", color: "var(--info)" },
      { value: "normal", label: "📎 معمولی", color: "var(--text3)" },
      { value: "low", label: "✅ کم", color: "var(--success)" },
    ];
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    overlay.style.zIndex = "400";
    const modal = document.createElement("div");
    modal.className = "settings-modal";
    modal.style.maxWidth = "320px";
    modal.style.padding = "20px";
    modal.style.textAlign = "center";
    modal.innerHTML = `
      <h3 style="margin-bottom:16px;">انتخاب اولویت</h3>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${items.map((item) => `<button style="background:${item.color}; color:white; padding:12px; border:none; border-radius:12px; font-weight:600; cursor:pointer; ${currentValue === item.value ? "box-shadow:0 0 0 3px white; transform:scale(1.02);" : ""}" class="imp-btn" data-value="${item.value}">${item.label}</button>`).join("")}
      </div>
      <button id="impCancelBtn" style="margin-top:12px; background:var(--surface3); color:var(--text); width:100%;">لغو</button>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    const close = (value) => {
      overlay.remove();
      resolve(value);
    };
    modal.querySelectorAll(".imp-btn").forEach((btn) => {
      btn.onclick = () => close(btn.dataset.value);
    });
    modal.querySelector("#impCancelBtn").onclick = () => close(null);
    overlay.onclick = (e) => {
      if (e.target === overlay) close(null);
    };
  });
}

// ================== INPUT MODAL ==================
export function showInputModal(title, placeholder = "", defaultValue = "") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    overlay.style.zIndex = "400";
    overlay.innerHTML = `
      <div class="settings-modal" style="max-width:420px;">
        <div class="modal-header"><h2>${title}</h2><button class="close-btn" id="closeInputModal">✕</button></div>
        <div class="modal-body">
          <input type="text" id="modalInput" value="${defaultValue.replace(/"/g, "&quot;")}" placeholder="${placeholder}" style="width:100%; padding:14px; font-size:1rem;">
          <div style="display:flex; gap:12px; margin-top:20px;">
            <button id="modalCancel" style="flex:1; background:var(--surface3);">لغو</button>
            <button id="modalSave" class="primary" style="flex:1;">تأیید</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = overlay.querySelector("#modalInput");
    input.focus();
    const close = (value) => {
      overlay.remove();
      resolve(value);
    };
    overlay.querySelector("#modalSave").onclick = () =>
      close(input.value.trim());
    overlay.querySelector("#modalCancel").onclick = () => close(null);
    overlay.querySelector("#closeInputModal").onclick = () => close(null);
    overlay.onclick = (e) => {
      if (e.target === overlay) close(null);
    };
    input.onkeypress = (e) => {
      if (e.key === "Enter") close(input.value.trim());
    };
  });
}

// ================== CONFIRM MODAL ==================
export function showConfirmModal(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    overlay.style.zIndex = "400";
    overlay.innerHTML = `
      <div class="settings-modal" style="max-width:380px; text-align:center;">
        <div class="modal-body">
          <p style="font-size:1.1rem; margin:20px 0;">${message}</p>
          <div style="display:flex; gap:12px;">
            <button id="confirmNo" style="flex:1; background:var(--surface3);">خیر</button>
            <button id="confirmYes" class="danger" style="flex:1;">بله</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector("#confirmYes").onclick = () => {
      overlay.remove();
      resolve(true);
    };
    overlay.querySelector("#confirmNo").onclick = () => {
      overlay.remove();
      resolve(false);
    };
  });
}

// ================== TOAST ==================
export function showToast(message, type = "success", duration = 3000) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
    background:${type === "error" ? "var(--danger)" : type === "warning" ? "var(--warning)" : "var(--accent)"};
    color:white; padding:12px 24px; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.4);
    z-index:1000; font-weight:500; min-width:280px; text-align:center; border-radius:30px;
    animation: toastIn 0.3s, toastOut 0.3s ${duration}ms forwards;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration + 600);
}

// اضافه کردن استایل‌های Toast به صورت داینامیک (یک بار)
if (!document.querySelector("#toastStyles")) {
  const style = document.createElement("style");
  style.id = "toastStyles";
  style.textContent = `
    @keyframes toastIn { from { opacity:0; transform:translate(-50%,20px); } to { opacity:1; transform:translate(-50%,0); } }
    @keyframes toastOut { from { opacity:1; } to { opacity:0; transform:translate(-50%,20px); } }
  `;
  document.head.appendChild(style);
}

// ================== FONT ==================
export const FONT_LIST = [
  {
    id: "Vazirmatn",
    name: "وزیرمتن (پیش‌فرض)",
    family: "'Vazirmatn', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "Samim",
    name: "صمیم",
    family: "'Samim', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Samim:wght@400;500;600;700&display=swap",
  },
  {
    id: "YekanBakh",
    name: "یکان بخ (مدرن)",
    family: "'Yekan Bakh', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Yekan+Bakh:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "Lotus",
    name: "لوتوس (رسمی)",
    family: "'Lotus', serif",
    url: "https://fonts.googleapis.com/css2?family=Lotus:wght@400;700&display=swap",
  },
  {
    id: "IranSans",
    name: "ایران‌سنس (مینیمال)",
    family: "'Iran Sans', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Iran+Sans:wght@400;500;700&display=swap",
  },
];

export function applyFont(fontId) {
  const font = FONT_LIST.find((f) => f.id === fontId) || FONT_LIST[0];
  document.querySelectorAll("link[data-font]").forEach((link) => link.remove());
  if (font.url) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = font.url;
    link.setAttribute("data-font", font.id);
    document.head.appendChild(link);
  }
  document.body.style.fontFamily = font.family;
}

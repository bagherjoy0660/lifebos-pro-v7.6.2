// ================== NOTEPAD v7.7 (با اعتبارسنجی) ==================
import { state, saveState } from "../core/state.js";
import { showInputModal, showConfirmModal, showToast } from "../core/utils.js";

// ---------- MODAL (بدون تغییر) ----------
function showNotepadModal(existingNote = null) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.display = "flex";
    overlay.style.zIndex = "400";

    const isEdit = !!existingNote;
    const titleValue = existingNote?.title || "";
    const contentValue = existingNote?.content || "";
    const imageSrc = existingNote?.image || "";

    overlay.innerHTML = `
      <div class="settings-modal" style="max-width: 520px; width: 92%;">
        <div class="modal-header">
          <h2>${isEdit ? "✏️ ویرایش یادداشت" : "📝 یادداشت جدید"}</h2>
          <button class="close-btn" id="closeNoteModal">✕</button>
        </div>
        <div class="modal-body">
          <input type="text" id="noteTitle" placeholder="عنوان یادداشت" value="${titleValue.replace(/"/g, "&quot;")}" style="margin-bottom:16px; padding:14px;">
          <textarea id="noteContent" placeholder="متن یادداشت را اینجا بنویسید..." style="min-height:180px; margin-bottom:16px; padding:14px;">${contentValue}</textarea>
          <div style="margin-bottom:12px;">
            <label class="upload-btn" style="display:inline-block; cursor:pointer; padding:10px 16px;">
              📷 ${imageSrc ? "تغییر تصویر" : "افزودن تصویر"}
              <input type="file" id="noteImageInput" accept="image/*" style="display:none;">
            </label>
            ${imageSrc ? `<button class="small danger" id="removeImageBtn" style="margin-right:8px;">🗑️ حذف تصویر</button>` : ""}
          </div>
          <div id="noteImagePreview" style="margin:12px 0;">
            ${imageSrc ? `<img src="${imageSrc}" style="max-width:100%; max-height:180px; border-radius:12px;">` : ""}
          </div>
          <div style="display:flex; gap:12px; margin-top:20px;">
            <button class="primary" id="saveNoteBtn" style="flex:1; padding:14px;">💾 ذخیره یادداشت</button>
            <button id="cancelNoteBtn" style="flex:1; padding:14px;">لغو</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let selectedImageData = existingNote?.image || null;
    const imageInput = overlay.querySelector("#noteImageInput");

    imageInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        selectedImageData = ev.target.result;
        const preview = overlay.querySelector("#noteImagePreview");
        preview.innerHTML = `<img src="${selectedImageData}" style="max-width:100%; max-height:180px; border-radius:12px;">`;
      };
      reader.readAsDataURL(file);
    };

    const closeModal = () => {
      overlay.remove();
      resolve(null);
    };

    overlay.querySelector("#closeNoteModal").onclick = closeModal;
    overlay.querySelector("#cancelNoteBtn").onclick = closeModal;
    overlay.querySelector("#saveNoteBtn").onclick = () => {
      const title = overlay.querySelector("#noteTitle").value.trim();
      const content = overlay.querySelector("#noteContent").value.trim();

      // اعتبارسنجی: عنوان نباید خالی باشد
      if (!title) {
        showToast("عنوان نمی‌تواند خالی باشد!", "warning");
        overlay.querySelector("#noteTitle").focus();
        return;
      }
      resolve({ title, content, image: selectedImageData });
      overlay.remove();
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };
  });
}

// ---------- RENDER ----------
export function renderNotepad(container) {
  let html = `<div class="card fade-in">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <h2>📝 یادداشت‌ها</h2>
      <button class="primary" onclick="addNote()">+ یادداشت جدید</button>
    </div>`;

  if (state.notesList.length === 0) {
    html += `<p style="color:var(--text3); text-align:center; padding:80px;">هنوز هیچ یادداشتی نداری.<br>یکی بساز!</p>`;
  } else {
    state.notesList.forEach((note) => {
      html += `
        <div class="card" style="margin-bottom:18px; background:var(--surface2);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <strong>${note.title}</strong>
            <small style="color:var(--text3);">${note.date}</small>
          </div>
          <p style="margin:0 0 12px 0; white-space:pre-wrap; line-height:1.6;">${note.content}</p>
          ${note.image ? `<img src="${note.image}" style="max-width:100%; border-radius:12px; margin:12px 0;" alt="تصویر">` : ""}
          <div style="display:flex; gap:10px;">
            <button class="small" onclick="editNote(${note.id})">✏️ ویرایش</button>
            <button class="small danger" onclick="deleteNote(${note.id})">🗑️ حذف</button>
          </div>
        </div>`;
    });
  }

  html += `</div>`;
  container.innerHTML = html;
}

// ---------- GLOBAL HANDLERS (با اعتبارسنجی) ----------
window.addNote = async function () {
  const result = await showNotepadModal();
  if (!result) return;

  // اعتبارسنجی اضافی: عنوان نباید خالی باشد (قبلاً در مودال انجام شده)
  // فقط مطمئن می‌شویم که عنوان داریم
  if (!result.title || !result.title.trim()) {
    showToast("عنوان یادداشت نمی‌تواند خالی باشد!", "warning");
    return;
  }

  state.notesList.push({
    id: Date.now(),
    title: result.title,
    content: result.content || "",
    image: result.image || null,
    date: new Date().toLocaleDateString("fa-IR"),
  });

  await saveState();
  showToast(`یادداشت "${result.title}" ذخیره شد 📝`);
  if (typeof window.render === "function") await window.render();
};

window.editNote = async function (id) {
  const note = state.notesList.find((n) => n.id === id);
  if (!note) return;

  const result = await showNotepadModal(note);
  if (!result) return;

  // اعتبارسنجی اضافی: عنوان نباید خالی باشد
  if (!result.title || !result.title.trim()) {
    showToast("عنوان یادداشت نمی‌تواند خالی باشد!", "warning");
    return;
  }

  note.title = result.title;
  note.content = result.content || "";
  note.image = result.image || null;

  await saveState();
  showToast(`یادداشت "${note.title}" ویرایش شد`);
  if (typeof window.render === "function") await window.render();
};

window.deleteNote = async function (id) {
  const note = state.notesList.find((n) => n.id === id);
  if (!note) return;

  const confirmed = await showConfirmModal(
    `آیا از حذف یادداشت "${note.title}" مطمئن هستید؟`,
  );
  if (!confirmed) return;

  state.notesList = state.notesList.filter((n) => n.id !== id);
  await saveState();
  showToast(`یادداشت "${note.title}" حذف شد`, "error");
  if (typeof window.render === "function") await window.render();
};

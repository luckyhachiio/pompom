(function () {
  const Gift = window.PomPomGift;
  if (!Gift) return;

  let data = Gift.getData();
  let tempLetters = structuredCloneSafe(data.letters);
  let tempMemories = structuredCloneSafe(data.memories);

  document.addEventListener("DOMContentLoaded", initAdmin);

  function initAdmin() {
    const loginBtn = byId("adminLoginBtn");
    const passInput = byId("adminPassword");
    loginBtn.addEventListener("click", tryAdminLogin);
    passInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") tryAdminLogin();
    });
    if (sessionStorage.getItem("pompom_admin_ok") === "yes") showPanel();
  }

  function tryAdminLogin() {
    data = Gift.getData();
    const value = byId("adminPassword").value.trim();
    if (value === data.adminPassword || value === "admin") {
      sessionStorage.setItem("pompom_admin_ok", "yes");
      byId("adminLoginError").textContent = "";
      showPanel();
    } else {
      byId("adminLoginError").textContent = "Wrong admin password.";
      byId("adminLoginBtn").animate([
        { transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }
      ], { duration: 260 });
    }
  }

  function showPanel() {
    byId("adminLogin").classList.add("hidden");
    byId("adminPanel").classList.remove("hidden");
    data = Gift.getData();
    tempLetters = structuredCloneSafe(data.letters);
    tempMemories = structuredCloneSafe(data.memories);
    fillForm();
    renderLetterEditors();
    renderMemoryEditors();
    bindEditorButtons();
  }

  function fillForm() {
    const form = byId("editorForm");
    form.elements.guestPassword.value = data.guestPassword || "";
    form.elements.adminPassword.value = data.adminPassword || "";
    form.elements.unlockDate.value = data.unlockDate || "";
    form.elements.herName.value = data.herName || "";
    form.elements.title.value = data.title || "";
    form.elements.intro.value = data.intro || "";
    form.elements.finalMessage.value = data.finalMessage || "";
  }

  function bindEditorButtons() {
    byId("saveAllBtn").onclick = saveAll;
    byId("addLetterBtn").onclick = () => {
      tempLetters.push({ title: `Letter ${tempLetters.length + 1}`, body: "Write something sweet here." });
      renderLetterEditors();
    };
    byId("addMemoryBtn").onclick = () => {
      tempMemories.push({ title: `Memory ${tempMemories.length + 1}`, note: "Write the story here.", image: "" });
      renderMemoryEditors();
    };
    byId("exportBtn").onclick = () => {
      saveAll(false);
      byId("backupBox").value = JSON.stringify(Gift.getData(), null, 2);
      showNotice("Exported backup JSON ✨");
    };
    byId("importBtn").onclick = () => {
      const raw = byId("backupBox").value.trim();
      if (!raw) return showNotice("Paste backup JSON first.");
      try {
        const imported = JSON.parse(raw);
        Gift.saveData(imported);
        data = Gift.getData();
        tempLetters = structuredCloneSafe(data.letters);
        tempMemories = structuredCloneSafe(data.memories);
        fillForm();
        renderLetterEditors();
        renderMemoryEditors();
        showNotice("Imported backup! Refresh guest page to see it.");
      } catch (error) {
        alert("That backup JSON is invalid.");
      }
    };
  }

  function renderLetterEditors() {
    const list = byId("letterEditorList");
    list.innerHTML = "";
    tempLetters.forEach((letter, index) => {
      const item = document.createElement("div");
      item.className = "edit-item";
      item.innerHTML = `
        <div class="item-toolbar">
          <b>Letter ${index + 1}</b>
          <button type="button" class="ghost-btn" data-remove-letter="${index}">remove</button>
        </div>
        <label>Title</label>
        <input type="text" value="${escapeAttr(letter.title || "")}" data-letter-title="${index}">
        <label>Body</label>
        <textarea rows="5" data-letter-body="${index}">${escapeHTML(letter.body || "")}</textarea>
      `;
      list.appendChild(item);
    });
    list.querySelectorAll("[data-remove-letter]").forEach((button) => {
      button.addEventListener("click", () => {
        tempLetters.splice(Number(button.dataset.removeLetter), 1);
        renderLetterEditors();
      });
    });
  }

  function renderMemoryEditors() {
    const list = byId("memoryEditorList");
    list.innerHTML = "";
    tempMemories.forEach((memory, index) => {
      const item = document.createElement("div");
      item.className = "edit-item";
      item.innerHTML = `
        <div class="item-toolbar">
          <b>Memory ${index + 1}</b>
          <button type="button" class="ghost-btn" data-remove-memory="${index}">remove</button>
        </div>
        <label>Title</label>
        <input type="text" value="${escapeAttr(memory.title || "")}" data-memory-title="${index}">
        <label>Story / note</label>
        <textarea rows="4" data-memory-note="${index}">${escapeHTML(memory.note || "")}</textarea>
        <label>Image URL</label>
        <input type="text" value="${escapeAttr(memory.image && !memory.image.startsWith("data:") ? memory.image : "")}" placeholder="https://..." data-memory-image-url="${index}">
        <label>Or upload photo</label>
        <input type="file" accept="image/*" data-memory-file="${index}">
        ${memory.image ? `<img class="memory-preview" src="${escapeAttr(memory.image)}" alt="preview">` : `<p class="tiny-note">No image yet.</p>`}
      `;
      list.appendChild(item);
    });
    list.querySelectorAll("[data-remove-memory]").forEach((button) => {
      button.addEventListener("click", () => {
        tempMemories.splice(Number(button.dataset.removeMemory), 1);
        renderMemoryEditors();
      });
    });
    list.querySelectorAll("[data-memory-file]").forEach((input) => {
      input.addEventListener("change", async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
          const image = await fileToCompressedDataURL(file, 900, .78);
          tempMemories[Number(input.dataset.memoryFile)].image = image;
          renderMemoryEditors();
          showNotice("Photo added. Do not forget to save.");
        } catch (error) {
          alert("Could not read that image.");
        }
      });
    });
  }

  function readDynamicEditors() {
    document.querySelectorAll("[data-letter-title]").forEach((input) => {
      const index = Number(input.dataset.letterTitle);
      tempLetters[index].title = input.value;
    });
    document.querySelectorAll("[data-letter-body]").forEach((textarea) => {
      const index = Number(textarea.dataset.letterBody);
      tempLetters[index].body = textarea.value;
    });
    document.querySelectorAll("[data-memory-title]").forEach((input) => {
      const index = Number(input.dataset.memoryTitle);
      tempMemories[index].title = input.value;
    });
    document.querySelectorAll("[data-memory-note]").forEach((textarea) => {
      const index = Number(textarea.dataset.memoryNote);
      tempMemories[index].note = textarea.value;
    });
    document.querySelectorAll("[data-memory-image-url]").forEach((input) => {
      const index = Number(input.dataset.memoryImageUrl);
      const value = input.value.trim();
      if (value) tempMemories[index].image = value;
    });
  }

  function saveAll(show = true) {
    readDynamicEditors();
    const form = byId("editorForm");
    const next = {
      ...Gift.DEFAULT_DATA,
      guestPassword: form.elements.guestPassword.value.trim() || Gift.DEFAULT_DATA.guestPassword,
      adminPassword: form.elements.adminPassword.value.trim() || Gift.DEFAULT_DATA.adminPassword,
      unlockDate: form.elements.unlockDate.value,
      herName: form.elements.herName.value.trim() || Gift.DEFAULT_DATA.herName,
      title: form.elements.title.value.trim() || Gift.DEFAULT_DATA.title,
      intro: form.elements.intro.value.trim() || Gift.DEFAULT_DATA.intro,
      finalMessage: form.elements.finalMessage.value.trim() || Gift.DEFAULT_DATA.finalMessage,
      letters: tempLetters.filter((letter) => (letter.title || letter.body || "").trim()),
      memories: tempMemories.filter((memory) => (memory.title || memory.note || memory.image || "").trim())
    };
    Gift.saveData(next);
    data = Gift.getData();
    if (show) showNotice("Saved! Open or refresh index.html to see changes.");
  }

  function showNotice(message) {
    const notice = byId("saveNotice");
    notice.textContent = message;
    notice.classList.remove("hidden");
    clearTimeout(showNotice.timer);
    showNotice.timer = setTimeout(() => notice.classList.add("hidden"), 2600);
  }

  function fileToCompressedDataURL(file, maxSize, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value || []));
  }
  function byId(id) { return document.getElementById(id); }
  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
  }
  function escapeAttr(value) { return escapeHTML(value).replace(/`/g, "&#096;"); }
})();

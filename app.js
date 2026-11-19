(() => {
  "use strict";

  const STORAGE_KEY = "myDigitalNotebook.notes.v1";
  const THEME_KEY = "myDigitalNotebook.theme.v1";
  const $ = (selector) => document.querySelector(selector);

  const elements = {
    sidebar: $("#sidebar"), mobileMenuBtn: $("#mobileMenuBtn"),
    newNoteBtn: $("#newNoteBtn"), headerNewBtn: $("#headerNewBtn"), emptyNewBtn: $("#emptyNewBtn"),
    themeBtn: $("#themeBtn"), themeIcon: $("#themeIcon"), themeLabel: $("#themeLabel"),
    searchInput: $("#searchInput"), notesGrid: $("#notesGrid"), emptyState: $("#emptyState"),
    allCount: $("#allCount"), totalStat: $("#totalStat"), favoriteStat: $("#favoriteStat"),
    currentView: $("#currentView"), pageTitle: $("#pageTitle"), sectionTitle: $("#sectionTitle"),
    notesSubtitle: $("#notesSubtitle"), sortSelect: $("#sortSelect"), modal: $("#noteModal"),
    modalTitle: $("#modalTitle"), closeModalBtn: $("#closeModalBtn"), cancelBtn: $("#cancelBtn"),
    noteForm: $("#noteForm"), noteTitle: $("#noteTitle"), noteFolder: $("#noteFolder"),
    noteColor: $("#noteColor"), noteContent: $("#noteContent"), toast: $("#toast"), saveStatus: $("#saveStatus")
  };

  const starterNotes = [
    { id: "sample-1", title: "A little study plan", folder: "Study", color: "lavender", content: "• Review class notes for 20 minutes\\n• Practice the difficult questions\\n• Take a short break\\n\\nSmall, consistent steps make a difference.", favorite: true, createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() - 3600000 * 5 },
    { id: "sample-2", title: "Ideas worth exploring", folder: "Ideas", color: "peach", content: "Keep a space for every new idea.\\n\\nWhat could I learn this month?\\nWhat small project can I build next?", favorite: false, createdAt: Date.now() - 86400000, updatedAt: Date.now() - 86400000 },
    { id: "sample-3", title: "A reminder to myself", folder: "Personal", color: "mint", content: "Progress is not always loud.\\n\\nBe patient, keep learning, and celebrate the small wins along the way.", favorite: true, createdAt: Date.now() - 3600000 * 18, updatedAt: Date.now() - 3600000 * 3 }
  ];

  let notes = loadNotes();
  let activeFilter = "all";
  let editingId = null;
  let toastTimer;

  function loadNotes() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? starterNotes : JSON.parse(stored);
    } catch (error) {
      console.warn("Could not read saved notes:", error);
      return starterNotes;
    }
  }

  function persistNotes() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      elements.saveStatus.textContent = "All changes saved locally";
    } catch (error) {
      elements.saveStatus.textContent = "Could not save changes";
      showToast("Browser storage is unavailable. Your changes may not be saved.");
      console.error(error);
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function formatDate(timestamp) {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(timestamp));
  }

  function getVisibleNotes() {
    const query = elements.searchInput.value.trim().toLowerCase();
    let visible = notes.filter(note => {
      const matchesSearch = `${note.title} ${note.content} ${note.folder}`.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (activeFilter === "all") return true;
      if (activeFilter === "favorites") return note.favorite;
      if (activeFilter === "recent") return Date.now() - note.updatedAt < 7 * 86400000;
      return note.folder === activeFilter;
    });

    const sort = elements.sortSelect.value;
    if (sort === "updated") visible.sort((a, b) => b.updatedAt - a.updatedAt);
    if (sort === "created") visible.sort((a, b) => a.createdAt - b.createdAt);
    if (sort === "title") visible.sort((a, b) => a.title.localeCompare(b.title));
    return visible;
  }

  function renderNotes() {
    const visible = getVisibleNotes();
    elements.notesGrid.innerHTML = visible.map(note => `
      <article class="note-card color-${escapeHTML(note.color)}" data-id="${escapeHTML(note.id)}">
        <div class="note-card-top">
          <span class="folder-pill">${escapeHTML(note.folder)}</span>
          <div class="note-actions">
            <button class="note-action favorite-action" data-action="favorite" data-id="${escapeHTML(note.id)}" aria-label="${note.favorite ? "Remove from" : "Add to"} favorites" title="${note.favorite ? "Remove from favorites" : "Add to favorites"}">${note.favorite ? "★" : "☆"}</button>
            <button class="note-action" data-action="edit" data-id="${escapeHTML(note.id)}" aria-label="Edit ${escapeHTML(note.title)}" title="Edit note">✎</button>
            <button class="note-action" data-action="delete" data-id="${escapeHTML(note.id)}" aria-label="Delete ${escapeHTML(note.title)}" title="Delete note">×</button>
          </div>
        </div>
        <h3 class="note-title">${escapeHTML(note.title)}</h3>
        <p class="note-preview">${escapeHTML(note.content)}</p>
        <div class="note-card-bottom"><span>Updated ${formatDate(note.updatedAt)}</span><span>${note.favorite ? '<b class="favorite-star">★</b> Favorite' : "✧ Note"}</span></div>
      </article>
    `).join("");

    elements.emptyState.hidden = visible.length > 0;
    elements.notesGrid.hidden = visible.length === 0;
    elements.allCount.textContent = notes.length;
    elements.totalStat.textContent = notes.length;
    elements.favoriteStat.textContent = notes.filter(note => note.favorite).length;
    updateHeadings();
  }

  function updateHeadings() {
    const labels = {
      all: ["All notes", "Your notes", "Everything you have written, all in one view."],
      favorites: ["Favorites", "Your favorites", "The notes you have marked as important."],
      recent: ["Recent notes", "Recently updated", "Notes you have worked on in the last seven days."],
      Study: ["Study", "Study notes", "Class notes, revision plans, and things you are learning."],
      Personal: ["Personal", "Personal notes", "Thoughts, reminders, and moments to keep."],
      Ideas: ["Ideas", "Your ideas", "Collect creative thoughts before they disappear."],
      Work: ["Work", "Work notes", "Plans, tasks, and useful work information."]
    };
    const info = labels[activeFilter] || labels.all;
    elements.currentView.textContent = info[0];
    elements.pageTitle.innerHTML = `${escapeHTML(info[0])} <span class="sparkle">✦</span>`;
    elements.sectionTitle.textContent = info[1];
    elements.notesSubtitle.textContent = info[2];
    document.querySelectorAll("[data-filter]").forEach(button => {
      button.classList.toggle("active", button.dataset.filter === activeFilter);
    });
  }

  function openModal(note = null) {
    editingId = note ? note.id : null;
    elements.modalTitle.textContent = note ? "Edit your note" : "Create a note";
    elements.noteTitle.value = note ? note.title : "";
    elements.noteFolder.value = note ? note.folder : (["Study", "Personal", "Ideas", "Work"].includes(activeFilter) ? activeFilter : "Study");
    elements.noteColor.value = note ? note.color : "lavender";
    elements.noteContent.value = note ? note.content : "";
    elements.modal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => elements.noteTitle.focus(), 30);
  }

  function closeModal() {
    elements.modal.hidden = true;
    document.body.style.overflow = "";
    editingId = null;
    elements.noteForm.reset();
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2500);
  }

  function createId() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function saveNote(event) {
    event.preventDefault();
    const title = elements.noteTitle.value.trim();
    const content = elements.noteContent.value.trim();
    if (!title || !content) {
      showToast("Please enter a title and note content.");
      return;
    }
    const now = Date.now();
    if (editingId) {
      notes = notes.map(note => note.id === editingId ? {
        ...note, title, content, folder: elements.noteFolder.value,
        color: elements.noteColor.value, updatedAt: now
      } : note);
      showToast("Your note has been updated.");
    } else {
      notes.unshift({
        id: createId(), title, content, folder: elements.noteFolder.value,
        color: elements.noteColor.value, favorite: false, createdAt: now, updatedAt: now
      });
      showToast("Your new note has been saved.");
    }
    persistNotes();
    closeModal();
    renderNotes();
  }

  function handleNoteAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const note = notes.find(item => item.id === button.dataset.id);
    if (!note) return;
    if (button.dataset.action === "edit") openModal(note);
    if (button.dataset.action === "favorite") {
      note.favorite = !note.favorite;
      note.updatedAt = Date.now();
      persistNotes();
      renderNotes();
      showToast(note.favorite ? "Added to favorites." : "Removed from favorites.");
    }
    if (button.dataset.action === "delete") {
      if (window.confirm(`Delete "${note.title}"? This cannot be undone.`)) {
        notes = notes.filter(item => item.id !== note.id);
        persistNotes();
        renderNotes();
        showToast("Note deleted.");
      }
    }
  }

  function applyTheme(theme) {
    const dark = theme === "dark";
    document.body.classList.toggle("dark", dark);
    elements.themeIcon.textContent = dark ? "☀" : "☾";
    elements.themeLabel.textContent = dark ? "Light mode" : "Dark mode";
    document.querySelector('meta[name="theme-color"]').content = dark ? "#171625" : "#6d5dfc";
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }

  elements.newNoteBtn.addEventListener("click", () => openModal());
  elements.headerNewBtn.addEventListener("click", () => openModal());
  elements.emptyNewBtn.addEventListener("click", () => openModal());
  elements.closeModalBtn.addEventListener("click", closeModal);
  elements.cancelBtn.addEventListener("click", closeModal);
  elements.noteForm.addEventListener("submit", saveNote);
  elements.notesGrid.addEventListener("click", handleNoteAction);
  elements.searchInput.addEventListener("input", renderNotes);
  elements.sortSelect.addEventListener("change", renderNotes);

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      renderNotes();
      elements.sidebar.classList.remove("open");
    });
  });

  elements.themeBtn.addEventListener("click", () => {
    applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
  });

  elements.mobileMenuBtn.addEventListener("click", () => elements.sidebar.classList.toggle("open"));
  elements.modal.addEventListener("click", event => { if (event.target === elements.modal) closeModal(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !elements.modal.hidden) closeModal();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      elements.searchInput.focus();
    }
  });

  let savedTheme = "light";
  try { savedTheme = localStorage.getItem(THEME_KEY) || "light"; } catch (_) {}
  applyTheme(savedTheme);
  renderNotes();
})();

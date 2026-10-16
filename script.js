const STORAGE_KEY = "dailyTaskPlanner.tasks.v1";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const taskCount = document.getElementById("taskCount");
const message = document.getElementById("message");
const currentDate = document.getElementById("currentDate");
const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = loadTasks();
let currentFilter = "all";

currentDate.textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter(task =>
      task && typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.completed === "boolean"
    );
  } catch (error) {
    console.error("Could not load saved tasks:", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Could not save tasks:", error);
    showMessage("Unable to save tasks in this browser.", true);
    return false;
  }
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = `small mb-3 ${isError ? "text-danger" : "text-success"}`;
}

function renderTasks() {
  taskList.replaceChildren();
  const visibleTasks = tasks.filter(task => {
    if (currentFilter === "pending") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  taskCount.textContent = String(tasks.length);
  emptyState.hidden = visibleTasks.length > 0;

  visibleTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = "task-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.title} ${task.completed ? "pending" : "completed"}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const title = document.createElement("span");
    title.className = `task-title${task.completed ? " completed" : ""}`;
    title.textContent = task.title;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = makeButton("Edit", "btn-outline-secondary", () => startEditing(item, task));
    editButton.disabled = task.completed;
    editButton.title = task.completed ? "Uncheck the task before editing" : "Edit task";

    const deleteButton = makeButton("Delete", "btn-outline-danger", () => deleteTask(task.id));
    actions.append(editButton, deleteButton);
    item.append(checkbox, title, actions);
    taskList.append(item);
  });
}

function makeButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `btn btn-sm ${className}`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    showMessage("Please enter a task before adding it.", true);
    taskInput.focus();
    return;
  }

  tasks.unshift({ id: createId(), title, completed: false });
  saveTasks();
  currentFilter = "all";
  updateFilterButtons();
  renderTasks();
  taskInput.value = "";
  taskInput.focus();
  showMessage("Task added.");
});

function createId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toggleTask(id) {
  tasks = tasks.map(task => task.id === id
    ? { ...task, completed: !task.completed }
    : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
  showMessage("Task deleted.");
}

function startEditing(item, task) {
  item.replaceChildren();

  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 200;
  input.className = "form-control form-control-sm edit-input";
  input.value = task.title;
  input.setAttribute("aria-label", "Edit task title");

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const saveButton = makeButton("Save", "btn-primary", () => {
    const title = input.value.trim();
    if (!title) {
      showMessage("Task cannot be empty.", true);
      input.focus();
      return;
    }
    tasks = tasks.map(entry => entry.id === task.id ? { ...entry, title } : entry);
    saveTasks();
    renderTasks();
    showMessage("Task updated.");
  });

  const cancelButton = makeButton("Cancel", "btn-outline-secondary", () => renderTasks());
  actions.append(saveButton, cancelButton);
  item.append(input, actions);
  input.focus();
  input.select();

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveButton.click();
    }
    if (event.key === "Escape") renderTasks();
  });
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    updateFilterButtons();
    renderTasks();
  });
});

function updateFilterButtons() {
  filterButtons.forEach(button => {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

updateFilterButtons();
renderTasks();

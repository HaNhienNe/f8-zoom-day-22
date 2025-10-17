
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const todoForm = $('.todo-app-form');
const cancelBtn = $('#cancel-btn');
const modelCloseBtn = $('.modal-close');
const addTaskModal = $('#addTaskModal');
const addBtn = $('.add-btn');
const taskErea = $('.task-grid');
const activeButton = $('#activeButton');
const completedButton = $('#completedButton');
const allButton = $('#allButton');
const keySearch = $('.search-input');
const modalTitle = $('.modal-title');
const submitBtn = $('#submit-btn');

// =============================
// STATE / MODE
// =============================
const MODE = {
    CREATE: 'create',
    UPDATE: 'update',
    _now: '',
    getMode() { return this._now; },
    setMode(value) { this._now = value; }
};

start();

// =============================
// EVENTS LISTENER
// =============================

// Search input
keySearch.addEventListener('input', () => {
    const data = searchTasks();
    renderTask(data);
});

// Filter buttons
activeButton.addEventListener('click', (e) => {
    e.target.classList.add('active');
    completedButton.classList.remove('active');
    allButton.classList.remove('active');
    renderTask();
});

// Filter buttons
completedButton.addEventListener('click', (e) => {
    e.target.classList.add('active');
    activeButton.classList.remove('active');
    allButton.classList.remove('active');
    renderTask();
});

// Filter buttons
allButton.addEventListener('click', (e) => {
    e.target.classList.add('active');
    activeButton.classList.remove('active');
    completedButton.classList.remove('active');
    renderTask();
});

// Task grid (delegate edit/delete/complete)
taskErea.addEventListener('click', (event) => {
    event.stopPropagation();
    const elEdit = event.target.closest('.edit');
    const elDelete = event.target.closest('.delete');
    const elComplete = event.target.closest('.complete');
    const currentTaskID = event.target.closest('.task-card')?.dataset?.id;
    const data = getAllData();
    const currentTask = data.find(task => task.id === currentTaskID);

    if (elEdit && !currentTask.isCompleted) {
        openModal();
        MODE.setMode(MODE.UPDATE);
        fillDataFom(todoForm, currentTask);
    }

    if (elDelete) {
        const msg = `Are you sure you want to remove this task?\n${currentTask.title}`;
        if (!confirm(msg)) return;
        currentTask.isDeleted = true;
        localStorage.setItem('tasks', JSON.stringify(data));
        renderTask();
    }

    if (elComplete) {
        currentTask.isCompleted = !currentTask.isCompleted;
        localStorage.setItem('tasks', JSON.stringify(data));
        renderTask();
    }
});

// Modal open/close buttons
addBtn.addEventListener('click', openModal);
modelCloseBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

// =============================
// STARTUP
// =============================
function start() {
    const data = searchTasks();
    renderTask(data);
}

// =============================
// MODAL
// =============================

function openModal() {
    console.log('adasd')
    addTaskModal.classList.add('show');
    setTimeout(() => {
        updateUiForm();
        $('#taskTitle')?.focus();
    }, 200);
}

function closeModal() {
    updateUiForm();
    todoForm.reset();
    addTaskModal.classList.remove('show');
    MODE.setMode(MODE.CREATE);
}

function updateUiForm() {
    clerErr();
    if (MODE.getMode() === MODE.UPDATE) {
        modalTitle.innerHTML = 'Update Task';
        submitBtn.innerHTML = 'Save';
    } else {
        modalTitle.innerHTML = 'Add New Task';
        submitBtn.innerHTML = 'Create Task';
    }
}

// =============================
// LOCALS STORAGE
// =============================
function getDataFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key)) ?? [];
}

function getAllData() {
    return getDataFromLocalStorage("tasks");
}

function getCurrentTaskById(id) {
    const data = getDataFromLocalStorage("tasks");
    return data.find(task => task.id === id);
}

function createID() {
    const data = getDataFromLocalStorage("tasks") ?? [];
    return `${data.length + 1}`;
}

// =============================
// SEARCH / FILTER
// =============================
function searchTasks() {
    const data = getDataFromLocalStorage('tasks') ?? [];
    const completedOn = $('#completedButton')?.classList.contains('active');
    const activeOn = $('#activeButton')?.classList.contains('active');
    const key = keySearch.value.trim().toLowerCase();

    let keyStatus = null;
    if (completedOn && !activeOn) keyStatus = true;
    else if (activeOn && !completedOn) keyStatus = false;

    return data.filter(task => {
        const matchesStatus = keyStatus === null ? true : task?.isCompleted === keyStatus;
        const title = String(task?.title ?? '').toLowerCase();
        const desc = String(task?.description ?? '').toLowerCase();
        const matchesQuery = key ? (title.includes(key) || desc.includes(key)) : true;
        return matchesStatus && matchesQuery && !task.isDeleted;
    });
}

// =============================
// FORM
// =============================
function fillDataFom(targetForm, dataFill) {
    for (const [key, value] of Object.entries(dataFill)) {
        const el = targetForm.querySelector(`[name="${key}"]`);
        if (el && key !== "isCompleted" && key !== "isDeleted") {
            el.value = value;
        }
    }
}

function clerErr() {
    $$('.message-error').forEach(elErr => { elErr.remove(); });
    $$('.is-invalid')?.forEach(elErr => { elErr.classList.remove('is-invalid'); });
}
// Submit Form
todoForm.onsubmit = (event) => {
    event.preventDefault();
    const newTask = {
        id: "",
        title: "",
        description: "",
        category: "",
        priority: "",
        startTime: "",
        endTime: "",
        dueDate: "",
        cardColor: "",
        isCompleted: false,
        isDeleted: false,
    };
    const formData = new FormData(todoForm);
    Object.assign(newTask, Object.fromEntries(formData.entries()));

    // Trim
    for (const k in newTask) {
        if (typeof newTask[k] === 'string') newTask[k] = newTask[k].trim();
    }

    clerErr();
    const resultValide = validateTask(newTask);
    if (resultValide.hasError) {
        const resultsErr = resultValide.ressults;
        const length = resultsErr.length;
        for (let i = 0; i < length; i++) {
            const err = resultsErr[i];
            let el = $(`[name="${err.name}"]`);
            if (el) {
                el.classList.add("is-invalid");
                const messageEl = document.createElement('div');
                messageEl.className = "message-error";
                messageEl.innerHTML = err.messages.map(msg => `<p>${msg}</p>`).join('');
                el.after(messageEl);
                el.onchange = (e) => {
                    e.target.classList.remove("is-invalid");
                    messageEl.remove();
                };
                if (i === 0) { el.focus(); }
            }
        }
        return;
    }

    const data = getAllData();
    if (MODE.getMode() === MODE.UPDATE) {
        const oldTask = data.find(task => task.id === newTask.id);
        Object.assign(oldTask, newTask);
    } else {
        data.unshift(newTask);
    }

    newTask.id = newTask.id ? newTask.id : createID();
    localStorage.setItem("tasks", JSON.stringify(data));
    todoForm.reset();
    renderTask();
    closeModal();
    MODE.setMode(MODE.CREATE);
    currentTaskID = null;
};

// =============================
// RENDER
// =============================
function renderTask(data = searchTasks()) {
    const html = data.map((task) => {
        return `<div class="task-card ${escapeHTML(task.cardColor)} ${task.isCompleted ? "completed" : ""}" data-id="${task.id}">
      <div class="task-header">
        <h3 class="task-title">${getIconCategory(task.category)} | ${truncateText(escapeHTML(task.title))}</h3>
        <button class="task-menu">
          <i class="fa-solid fa-ellipsis fa-icon"></i>
          <div class="dropdown-menu">
            <div class="dropdown-item edit ${task.isCompleted ? 'disabled' : ''}">
              <i class="fa-solid fa-pen-to-square fa-icon"></i>
              Edit
            </div>
            <div class="dropdown-item complete">
              <i class="fa-solid fa-check fa-icon"></i>
              ${task.isCompleted ? "Mark as Active" : "Mark as Completed"}
            </div>
            <div class="dropdown-item delete">
              <i class="fa-solid fa-trash fa-icon"></i>
              Delete
            </div>
          </div>
        </button>
      </div>
      <p class="task-description">${escapeHTML(task.description)}</p>
      <div class="task-meta">
        <div class="task-time">${escapeHTML(formatTime12H(task.startTime))} - ${escapeHTML(formatTime12H(task.endTime))}</div>
        <div class="task-date">${escapeHTML(task.dueDate)}</div>
      </div>
    </div>`;
    }).join('');
    taskErea.innerHTML = html;
}

function getIconCategory(key) {
    const categorys = {
        meeting: `<i class="fa-solid fa-user-group" title="${key}"></i>`,
        design: `<i class="fa-solid fa-palette" title="${key}"></i>`,
        development: `<i class="fa-solid fa-code" title="${key}"></i>`,
        planning: `<i class="fa-solid fa-brain" title="${key}"></i>`,
        client: `<i class="fa-solid fa-bell-concierge" title="${key}"></i>`,
        other: `<i class="fa-solid fa-spinner" title="${key}"></i>`,
    }
    return key ? categorys[key] : categorys['other'];
}

// =============================
// UTILS
// =============================

// XSS escape
function escapeHTML(input) {
    const element = document.createElement('div');
    element.textContent = input;
    return element.innerHTML;
}

// Truncate Text
function truncateText(str, maxWords = 5, maxChars = 25, ellipsis = '...') {
    if (!str) return '';
    const trimmed = str.trim();
    let Words = trimmed.split(/\s+/).splice(0, maxWords);

    if (Words.join(' ').length <= maxChars) {
        return str;
    }

    let newWord = '';
    for (let i = 0; i < Words.length; i++) {
        let word = Words[i];
        if (word.length > maxChars) {
            newWord = word.slice(0, maxChars);
            break;
        }
        if (i < Words.length - 1) {
            word = word + ' ';
        }
        if (newWord.length + word.length <= maxChars) {
            newWord += word;
        } else {
            break;
        }
    }
    return `${newWord} ${ellipsis}`;
}

// Format time 12H
function formatTime12H(timeStr) {
    if (!timeStr) return "";
    let [h, m] = timeStr.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${suffix}`;
}

// =============================
// VALIDATION
// =============================
function validateTask(task) {
    const result = { hasError: false, ressults: [], }
    if (!task) return result;

    for (const [key, value] of Object.entries(task)) {
        let msgError = "";
        const err = { name: key, messages: [] };

        // common required
        if (!value && key !== "description" && key !== "isCompleted" && key !== "isDeleted" && key !== "id") {
            result.hasError = true;
            msgError = `Required field!`;
            err.messages.push(msgError);
        }

        switch (key) {
            case "title":
                const data = getAllData();
                const existsTask = data.indexOf(task => task.title === value);

                if (existsTask !== -1) {
                    if (MODE.getMode() === MODE.UPDATE) {
                        break;
                    }
                    result.hasError = true;
                    msgError = "Task already exists!";
                    err.messages.push(msgError);
                }
                break;

            case "endTime":
                if (task.startTime && task.endTime) {
                    const [startH, startM] = task.startTime.split(':').map(Number);
                    const [endH, endM] = task.endTime.split(':').map(Number);
                    const startTotal = startH * 60 + startM;
                    const endTotal = endH * 60 + endM;
                    if (endTotal < startTotal) {
                        result.hasError = true;
                        msgError = "End time must be after start time!";
                        err.messages.push(msgError);
                    }
                }
                break;
        }

        err.messages.length > 0 && result.ressults.push(err);
    }
    return result;
}

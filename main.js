const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const todoForm = $('.todo-app-form');
const cancelBtn = $('#cancel-btn');
const modelCloseBtn = $('.modal-close');
const addTaskModal = $('#addTaskModal');
const addBtn = $('.add-btn');

const data = [];

// ----- Modal -----
function toggleModal(show = false) {
    addTaskModal.classList.toggle('show', show);
    if (show) {
        $('.modal').scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        setTimeout(() => {
            const inputTitle = $('#taskTitle');
            inputTitle.focus();
        }, 100);
    }
}
const closeModal = () => toggleModal(false);
addBtn.onclick = () => toggleModal(true);
modelCloseBtn.onclick = closeModal;
cancelBtn.onclick = closeModal;

// ----- Form -----
todoForm.onsubmit = (event) => {
    event.preventDefault();
    const newTask = {
        title: "",
        description: "",
        category: "",
        priority: "",
        startTime: "",
        endTime: "",
        DueDate: "",
        cardColor: "",
        isCompleted: false,
    };
    const formData = new FormData(todoForm);
    Object.assign(newTask, Object.fromEntries(formData.entries()));

    // Trim
    for (const k in newTask) {
        if (typeof newTask[k] === 'string') newTask[k] = newTask[k].trim();
    }
    data.unshift(newTask);
    renderTask();
    todoForm.reset();
    closeModal();
}

// ----- Render -----
function renderTask() {
    const html = data.map(task => {
        return `<div class="task-card ${escapeHTML(task.cardColor)} ${task.isCompleted ? "completed" : ""}">
                <div class="task-header">
                    <h3 class="task-title">${escapeHTML(task.title)}</h3>
                    <button class="task-menu">
                        <i class="fa-solid fa-ellipsis fa-icon"></i>
                        <div class="dropdown-menu">
                            <div class="dropdown-item">
                                <i class="fa-solid fa-pen-to-square fa-icon"></i>
                                Edit
                            </div>
                            <div class="dropdown-item complete">
                                <i class="fa-solid fa-check fa-icon"></i>
                                Mark as Active
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
                    <div class="task-time">${escapeHTML(formatTime12H(task.startTime))} - ${escapeHTML(formatTime12H(task.endTime))} </div>
                    <div class="task-date">${escapeHTML(task.dueDate)}</div>
                </div>
            </div>`;
    }).join('');
    $('.task-grid').innerHTML = html;
}

// ----- XSS -----
function escapeHTML(input) {
    const element = document.createElement('div');
    element.textContent = input;
    return element.innerHTML;
}

function formatTime12H(timeStr) {
    if (!timeStr) return "";
    let [h, m] = timeStr.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${suffix}`;
}
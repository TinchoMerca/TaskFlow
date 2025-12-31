// --- 1. CONFIGURACIÓN Y ESTADO ---

// Datos de categorías (Configuración visual)
const CATEGORIES = [
    { name: 'Personal', color: 'bg-rose-500', text: 'text-rose-500', bgSoft: 'bg-rose-100', border: 'border-rose-200', ring: 'ring-rose-100' },
    { name: 'Trabajo', color: 'bg-blue-500', text: 'text-blue-500', bgSoft: 'bg-blue-100', border: 'border-blue-200', ring: 'ring-blue-100' },
    { name: 'Urgente', color: 'bg-amber-500', text: 'text-amber-500', bgSoft: 'bg-amber-100', border: 'border-amber-200', ring: 'ring-amber-100' },
    { name: 'Estudio', color: 'bg-violet-500', text: 'text-violet-500', bgSoft: 'bg-violet-100', border: 'border-violet-200', ring: 'ring-violet-100' },
];

// Estado de la aplicación
let state = {
    tasks: JSON.parse(localStorage.getItem('taskflow-data')) || [], // Cargar del localStorage o iniciar vacío
    currentCategory: 'Personal',
    filter: 'all' // all, active, completed
};

// --- 2. SELECTORES DEL DOM ---
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const categoryContainer = document.getElementById('category-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const currentDateElement = document.getElementById('current-date');
const clearBtn = document.getElementById('clear-btn');
const clearContainer = document.getElementById('clear-container');
const filterButtons = document.querySelectorAll('.filter-btn');

// --- 3. FUNCIONES PRINCIPALES ---

// Inicializar la aplicación
function init() {
    renderDate();
    renderCategories();
    renderTasks();
    updateProgress();
    lucide.createIcons(); // Inicializar iconos
}

// Guardar en LocalStorage
function saveTasks() {
    localStorage.setItem('taskflow-data', JSON.stringify(state.tasks));
    renderTasks();
    updateProgress();
}

// Renderizar la fecha actual
function renderDate() {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = new Date().toLocaleDateString('es-ES', options);
    // Capitalizar primera letra
    currentDateElement.innerHTML = `<i data-lucide="calendar" width="14"></i> ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`;
}

// Renderizar los botones de categoría
function renderCategories() {
    categoryContainer.innerHTML = CATEGORIES.map(cat => {
        const isActive = state.currentCategory === cat.name;
        // Clases dinámicas basadas en si está activo o no
        const activeClasses = `${cat.bgSoft} ${cat.text} ${cat.border} ring-2 ring-offset-1 ${cat.ring}`;
        const inactiveClasses = 'bg-transparent text-slate-400 border-slate-200 hover:bg-slate-50';
        
        return `
            <button
                type="button"
                onclick="setCategory('${cat.name}')"
                class="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${isActive ? activeClasses : inactiveClasses}"
            >
                <div class="w-2 h-2 rounded-full ${cat.color}"></div>
                ${cat.name}
            </button>
        `;
    }).join('');
}

// Renderizar la lista de tareas
function renderTasks() {
    taskList.innerHTML = '';

    // Filtrar tareas
    const filteredTasks = state.tasks.filter(task => {
        if (state.filter === 'active') return !task.completed;
        if (state.filter === 'completed') return task.completed;
        return true;
    });

    // Mostrar mensaje si no hay tareas
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <div class="bg-slate-100 p-4 rounded-full mb-3">
                    <i data-lucide="layout-list" width="32" height="32"></i>
                </div>
                <p class="text-sm font-medium">No hay tareas aquí</p>
            </div>
        `;
    } else {
        // Generar HTML para cada tarea
        filteredTasks.forEach(task => {
            const catConfig = CATEGORIES.find(c => c.name === task.category) || CATEGORIES[0];
            
            const taskHTML = `
                <div class="task-enter group flex items-center bg-white border border-slate-100 p-3 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                    <button 
                        onclick="toggleTask(${task.id})"
                        class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            task.completed 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-slate-300 text-transparent hover:border-emerald-400'
                        }"
                    >
                        <i data-lucide="check" width="14" stroke-width="3"></i>
                    </button>

                    <div class="ml-3 flex-1 min-w-0 cursor-pointer" onclick="toggleTask(${task.id})">
                        <p class="text-sm font-semibold truncate transition-all duration-300 ${
                            task.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'
                        }">
                            ${task.text}
                        </p>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[10px] px-1.5 py-0.5 rounded-md font-bold ${catConfig.bgSoft} ${catConfig.text}">
                                ${task.category}
                            </span>
                            <span class="text-[10px] text-slate-400">${task.createdAt}</span>
                        </div>
                    </div>

                    <button 
                        onclick="deleteTask(${task.id})"
                        class="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                        <i data-lucide="trash-2" width="16"></i>
                    </button>
                </div>
            `;
            taskList.insertAdjacentHTML('beforeend', taskHTML);
        });
    }

    // Mostrar/Ocultar botón de limpiar
    const hasCompleted = state.tasks.some(t => t.completed);
    clearContainer.classList.toggle('hidden', !hasCompleted);

    // Importante: Volver a renderizar los iconos porque el HTML cambió
    lucide.createIcons();
}

// Actualizar barra de progreso
function updateProgress() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressText.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
}

// --- 4. MANEJADORES DE ACCIONES (ACTIONS) ---

// Cambiar categoría seleccionada
// Nota: Usamos window.function para que sea accesible desde el HTML inline onclick
window.setCategory = (categoryName) => {
    state.currentCategory = categoryName;
    renderCategories();
};

// Añadir tarea
function addTask(e) {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        category: state.currentCategory,
        createdAt: new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    };

    state.tasks.unshift(newTask); // Añadir al principio
    taskInput.value = '';
    checkInput(); // Deshabilitar botón
    saveTasks();
}

// Alternar estado completado/pendiente
window.toggleTask = (id) => {
    state.tasks = state.tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks();
};

// Eliminar tarea
window.deleteTask = (id) => {
    state.tasks = state.tasks.filter(task => task.id !== id);
    saveTasks();
};

// Limpiar completadas
clearBtn.addEventListener('click', () => {
    state.tasks = state.tasks.filter(task => !task.completed);
    saveTasks();
});

// Filtrar tareas (Event Delegation)
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Actualizar estado
        state.filter = btn.dataset.filter;
        
        // Actualizar UI de los botones
        filterButtons.forEach(b => {
            const isSelected = b.dataset.filter === state.filter;
            const indicator = b.querySelector('.active-indicator');
            
            if (isSelected) {
                b.classList.remove('text-slate-400');
                b.classList.add('text-indigo-600');
                indicator.classList.remove('hidden');
            } else {
                b.classList.add('text-slate-400');
                b.classList.remove('text-indigo-600');
                indicator.classList.add('hidden');
            }
        });

        renderTasks();
    });
});

// Habilitar/deshabilitar botón de añadir
function checkInput() {
    addBtn.disabled = !taskInput.value.trim();
}

// --- 5. EVENT LISTENERS ---

taskForm.addEventListener('submit', addTask);
taskInput.addEventListener('input', checkInput);

// Iniciar
init();
(function () {
    'use strict';

    const STORAGE_KEY = 'todo-app-items-v1';

    const form = document.getElementById('todoForm');
    const input = document.getElementById('todoInput');
    const list = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');
    const clearBtn = document.getElementById('clearCompleted');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const countAll = document.getElementById('countAll');
    const countActive = document.getElementById('countActive');
    const countCompleted = document.getElementById('countCompleted');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const dateDisplay = document.getElementById('dateDisplay');

    let todos = loadTodos();
    let currentFilter = 'all';

    function loadTodos() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveTodos() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function addTodo(text) {
        const trimmed = text.trim();
        if (!trimmed) return;
        todos.unshift({
            id: generateId(),
            text: trimmed,
            completed: false,
            createdAt: Date.now(),
        });
        saveTodos();
        render();
    }

    function toggleTodo(id) {
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;
        todo.completed = !todo.completed;
        saveTodos();
        render();
    }

    function deleteTodo(id) {
        todos = todos.filter((t) => t.id !== id);
        saveTodos();
        render();
    }

    function updateTodo(id, newText) {
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;
        const trimmed = newText.trim();
        if (!trimmed) {
            deleteTodo(id);
            return;
        }
        todo.text = trimmed;
        saveTodos();
        render();
    }

    function clearCompleted() {
        const hasCompleted = todos.some((t) => t.completed);
        if (!hasCompleted) return;
        todos = todos.filter((t) => !t.completed);
        saveTodos();
        render();
    }

    function setFilter(filter) {
        currentFilter = filter;
        filterBtns.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        render();
    }

    function getVisibleTodos() {
        if (currentFilter === 'active') return todos.filter((t) => !t.completed);
        if (currentFilter === 'completed') return todos.filter((t) => t.completed);
        return todos;
    }

    function createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = 'todo-item' + (todo.completed ? ' completed' : '');
        li.dataset.id = todo.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.setAttribute('aria-label', '标记完成');
        checkbox.addEventListener('change', () => toggleTodo(todo.id));

        const text = document.createElement('span');
        text.className = 'todo-text';
        text.textContent = todo.text;
        text.title = '双击编辑';
        text.addEventListener('dblclick', () => startEditing(li, todo));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = '删除';
        deleteBtn.setAttribute('aria-label', '删除任务');
        deleteBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

        li.appendChild(checkbox);
        li.appendChild(text);
        li.appendChild(deleteBtn);
        return li;
    }

    function startEditing(li, todo) {
        const textEl = li.querySelector('.todo-text');
        if (!textEl) return;

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'edit-input';
        editInput.value = todo.text;
        editInput.maxLength = 200;

        li.replaceChild(editInput, textEl);
        editInput.focus();
        editInput.setSelectionRange(editInput.value.length, editInput.value.length);

        let finished = false;
        const commit = () => {
            if (finished) return;
            finished = true;
            updateTodo(todo.id, editInput.value);
        };
        const cancel = () => {
            if (finished) return;
            finished = true;
            render();
        };

        editInput.addEventListener('blur', commit);
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                commit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            }
        });
    }

    function updateCounts() {
        const total = todos.length;
        const completed = todos.filter((t) => t.completed).length;
        const active = total - completed;

        countAll.textContent = total;
        countActive.textContent = active;
        countCompleted.textContent = completed;

        progressText.textContent = `${completed} / ${total}`;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        progressFill.style.width = percent + '%';

        clearBtn.disabled = completed === 0;
    }

    function render() {
        const visible = getVisibleTodos();
        list.innerHTML = '';

        if (visible.length === 0) {
            emptyState.classList.add('visible');
            if (todos.length > 0) {
                const msg = emptyState.querySelector('p');
                if (msg) {
                    msg.textContent =
                        currentFilter === 'active' ? '没有进行中的任务' :
                        currentFilter === 'completed' ? '还没有完成的任务' :
                        '暂无任务，开始添加吧！';
                }
            } else {
                const msg = emptyState.querySelector('p');
                if (msg) msg.textContent = '暂无任务，开始添加吧！';
            }
        } else {
            emptyState.classList.remove('visible');
            const fragment = document.createDocumentFragment();
            visible.forEach((todo) => fragment.appendChild(createTodoElement(todo)));
            list.appendChild(fragment);
        }

        updateCounts();
    }

    function renderDate() {
        const now = new Date();
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        dateDisplay.textContent = `${y}年${m}月${d}日 · ${weekdays[now.getDay()]}`;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo(input.value);
        input.value = '';
        input.focus();
    });

    filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    clearBtn.addEventListener('click', clearCompleted);

    renderDate();
    render();
})();

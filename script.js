/*
 * Modern Todo Application
 * Author: Mahmoud Ashraf (SNO7E)
 * GitHub: https://github.com/SNO7E-G
 * 
 * A feature-rich todo management application with:
 * - Task management (add, complete, delete)
 * - Due dates with visual indicators
 * - Priority levels
 * - Recurring tasks
 * - Browser notifications
 * - Dark/light theme support
 * - Responsive design and touch support
 * - Accessibility features
 * - Advanced filtering and grouping
 * - Performance optimizations
 */

// DOM elements - Change from const to let to allow refreshing references
let todoForm = document.getElementById('todo-form');
let todoInput = document.getElementById('todo-input');
let dueDateInput = document.getElementById('due-date');
let prioritySelect = document.getElementById('priority');
let recurringSelect = document.getElementById('recurring');
let enableNotificationsCheckbox = document.getElementById('enable-notifications');
let notificationTimeSelect = document.getElementById('notification-time');
let todoList = document.getElementById('todo-list');
let tasksLeftEl = document.getElementById('tasks-left');
let clearAllBtn = document.getElementById('clear-all');
let clearCompletedBtn = document.getElementById('clear-completed');
let filterBtns = document.querySelectorAll('.filter-btn');
let themeToggle = document.getElementById('theme-toggle');
let loadingIndicator = document.querySelector('#todo-form-loading');
let statusRegion = document.getElementById('status-region');
let alertRegion = document.getElementById('alert-region');
let recurringEndDateContainer = document.getElementById('recurring-end-date-container');
let recurringEndDateInput = document.getElementById('recurring-end-date');
let recurringEndTypeSelect = document.getElementById('recurring-end-type');
let recurringOccurrencesInput = document.getElementById('recurring-occurrences');

// App state
let todos = [];
let currentFilter = 'all';
let draggedItem = null;
let notificationPermission = false;
let notificationTimers = {};
let prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
let isLoading = false;

// Make sure DOM references are always fresh - Update all DOM references
function refreshDOMReferences() {
    // Re-query all DOM elements to ensure they're up to date
    todoForm = document.getElementById('todo-form');
    todoInput = document.getElementById('todo-input');
    dueDateInput = document.getElementById('due-date');
    prioritySelect = document.getElementById('priority');
    recurringSelect = document.getElementById('recurring');
    enableNotificationsCheckbox = document.getElementById('enable-notifications');
    notificationTimeSelect = document.getElementById('notification-time');
    todoList = document.getElementById('todo-list');
    tasksLeftEl = document.getElementById('tasks-left');
    clearAllBtn = document.getElementById('clear-all');
    clearCompletedBtn = document.getElementById('clear-completed');
    filterBtns = document.querySelectorAll('.filter-btn');
    themeToggle = document.getElementById('theme-toggle');
    loadingIndicator = document.querySelector('#todo-form-loading');
    statusRegion = document.getElementById('status-region');
    alertRegion = document.getElementById('alert-region');
    recurringEndDateContainer = document.getElementById('recurring-end-date-container');
    recurringEndDateInput = document.getElementById('recurring-end-date');
    recurringEndTypeSelect = document.getElementById('recurring-end-type');
    recurringOccurrencesInput = document.getElementById('recurring-occurrences');
}

// Show loading indicator
function showLoading() {
    isLoading = true;
    if (loadingIndicator) {
        loadingIndicator.classList.add('show');
    }
}

// Hide loading indicator
function hideLoading() {
    isLoading = false;
    if (loadingIndicator) {
        loadingIndicator.classList.remove('show');
    }
}

// Initialize theme based on user preference or system setting
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeToggleIcon(savedTheme);
    } else if (prefersDarkScheme.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeToggleIcon('dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeToggleIcon('light');
    }
}

// Update theme toggle icon based on current theme
function updateThemeToggleIcon(theme) {
    if (!themeToggle) return;
    
    if (theme === 'dark') {
        themeToggle.innerHTML = '☀️'; // Sun for dark mode (to switch to light)
        themeToggle.setAttribute('title', 'Switch to light mode');
        themeToggle.setAttribute('aria-label', 'Switch to light mode');
    } else {
        themeToggle.innerHTML = '🌙'; // Moon for light mode (to switch to dark)
        themeToggle.setAttribute('title', 'Switch to dark mode');
        themeToggle.setAttribute('aria-label', 'Switch to dark mode');
    }
}

// Toggle between light and dark theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeToggleIcon(newTheme);
    announceToScreenReader(`Switched to ${newTheme} mode`);
}

// Initialize app with category functions removed
function init() {
    try {
        showLoading();
        
        // Add enhanced styles
        addEnhancedStyles();
        
        // Ensure all DOM references are up to date
        refreshDOMReferences();
        
        loadFromStorage();
        initTheme();
        initSoundPreference(); // Initialize sound preference
        updateRecurringOptions();
        renderTodos();
        updateTasksLeft();
        // Remove category rendering functions
        addEventListeners();
        initEnhancedFeatures();
        
        // Enhance UI elements for better look and feel
        enhanceUIElements();
        
        // Check for recurring todos
        checkForRecurringTodos();
        
        // Request notification permission if needed
        if ('Notification' in window) {
            requestNotificationPermission();
        }
        
        // Listen for system theme changes
        if (prefersDarkScheme) {
            prefersDarkScheme.addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                    updateThemeToggleIcon(e.matches ? 'dark' : 'light');
                }
            });
        }
        
        // Initialize new features like search, sorting and virtual scrolling
        initNewFeatures();
        
        announceToScreenReader('Todo app initialized. Use arrow keys to navigate, Enter to toggle completion, and Delete to remove items.');
    } catch (error) {
        console.error('Error during initialization:', error);
        announceToScreenReader('Error initializing the application. Please refresh the page.', 'assertive');
    } finally {
        hideLoading();
    }
}

// Initialize sound preference
function initSoundPreference() {
    const soundToggle = document.getElementById('sound-toggle');
    const soundIcon = document.getElementById('sound-icon');
    
    // Check if user has a preference saved
    if (!localStorage.getItem('muteSound')) {
        // Default is sound enabled
        localStorage.setItem('muteSound', 'false');
    }
    
    if (soundToggle && soundIcon) {
        const soundMuted = localStorage.getItem('muteSound') === 'true';
        if (soundMuted) {
            soundToggle.classList.add('muted');
            soundIcon.className = 'fas fa-volume-mute';
        } else {
            soundToggle.classList.remove('muted');
            soundIcon.className = 'fas fa-volume-up';
        }
    }
}

// Add enhanced styles to the application
function addEnhancedStyles() {
    // Add CSS variables dynamically if needed
    const customStyles = document.createElement('style');
    document.head.appendChild(customStyles);
    
    // Define priority colors and other dynamic styles
    const styleContent = `
        :root {
            --priority-high: ${getComputedStyle(document.documentElement).getPropertyValue('--error-color')};
            --priority-normal: ${getComputedStyle(document.documentElement).getPropertyValue('--primary-color')};
            --priority-low: ${getComputedStyle(document.documentElement).getPropertyValue('--success-color')};
        }
    `;
    
    customStyles.textContent = styleContent;
    
    // Add custom classes to elements that need enhanced styling
    document.querySelectorAll('button, input, select').forEach(el => {
        if (!el.classList.contains('enhanced')) {
            el.classList.add('enhanced');
        }
    });
    
    // Add focus trap to modal dialogs for accessibility
    document.querySelectorAll('.modal').forEach(modal => {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
    });
}

// Improved add todo function without category handling
function addTodo(e) {
    e.preventDefault();
    
    const text = todoInput.value.trim();
    // Real-time validation
    if (!text) {
        todoInput.classList.add('input-error');
        // Remove the error class after the animation completes
        setTimeout(() => {
            todoInput.classList.remove('input-error');
        }, 300); // Match animation duration
        todoInput.focus();
        announceToScreenReader('Task description cannot be empty.', 'assertive');
        return; // Stop execution if input is empty
    }
    
    // Additional validation for recurring tasks
    if (recurringSelect.value && recurringEndTypeSelect && 
        recurringEndTypeSelect.value === 'until' && 
        recurringEndDateInput && !recurringEndDateInput.value) {
        
        announceToScreenReader('Please select an end date for the recurring task.', 'assertive');
        recurringEndDateInput.focus();
        return;
    }
    
    showLoading();
    
    // Handle recurring task options
    let recurringOptions = null;
    if (recurringSelect.value && recurringSelect.value !== '') {
        recurringOptions = {
            pattern: recurringSelect.value,
            endType: recurringEndTypeSelect ? recurringEndTypeSelect.value : 'until', // Default to 'until'
            endDate: recurringEndDateInput && recurringEndDateInput.value ? recurringEndDateInput.value : null,
            occurrences: recurringEndTypeSelect && 
                        recurringEndTypeSelect.value === 'occurrences' && 
                        recurringOccurrencesInput ? 
                parseInt(recurringOccurrencesInput.value) : null,
            currentOccurrence: 1 // Start with the first occurrence
        };
    }
    
    const newTodo = {
        id: Date.now().toString(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: dueDateInput.value || null,
        priority: prioritySelect.value,
        recurring: recurringOptions,
        notifications: enableNotificationsCheckbox.checked ? {
            enabled: true,
            time: parseInt(notificationTimeSelect.value)
        } : null,
        lastRecurred: null
    };
    
    todos.unshift(newTodo);
    
    // Play the add sound
    playSound('add');
    
    // Reset the form AFTER getting feedback info
    resetTodoForm();
    
    // Schedule a notification if needed
    if (newTodo.dueDate && newTodo.notifications) {
        scheduleNotification(newTodo);
    }
    
    saveToStorage();
    renderTodos();
    updateTasksLeft();
    
    announceToScreenReader(`Added task: ${text}`);
    
    hideLoading();

    // Remove error style on input
    todoInput.addEventListener('input', () => {
        if (todoInput.classList.contains('input-error')) {
            todoInput.classList.remove('input-error');
        }
    });
}

// Reset todo form with recurring end date options and animation
function resetTodoForm() {
    // Add a temporary class for animation
    if (todoForm) {
        todoForm.classList.add('form-reset');
        
        // Remove the class after animation completes
        setTimeout(() => {
            todoForm.classList.remove('form-reset');
        }, 500);
    }
    
    // Reset values
    todoInput.value = '';
    dueDateInput.value = '';
    prioritySelect.value = 'normal';
    recurringSelect.value = '';
    enableNotificationsCheckbox.checked = false;
    notificationTimeSelect.disabled = true;
    
    // Reset recurring end date options
    if (recurringEndDateContainer) {
        recurringEndDateContainer.style.display = 'none';
    }
    
    if (recurringEndDateInput) {
        recurringEndDateInput.value = '';
    }
    
    if (recurringEndTypeSelect) {
        // Set back to the first option (which is now 'until')
        recurringEndTypeSelect.selectedIndex = 0;
    }
    
    if (recurringOccurrencesInput) {
        recurringOccurrencesInput.value = '3'; // Smaller default value
        recurringOccurrencesInput.parentElement.style.display = 'none';
    }
    
    // Focus back on the input field after slight delay for better UX
    setTimeout(() => {
        todoInput.focus();
    }, 100);
}

// Get filtered todos - without category filtering
function getFilteredTodos() {
    let filtered = [...todos];
    
    // Apply completion filter
    if (currentFilter === 'active') {
        filtered = filtered.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(todo => todo.completed);
    }
    
    return filtered;
}

// Render todos in DOM with improved accessibility - without category filtering
function renderTodos() {
    todoList.innerHTML = '';
    
    const filteredTodos = getFilteredTodos();
    const emptyPlaceholder = document.getElementById('empty-todo-placeholder');
    
    // Get sort criteria
    const sortSelect = document.getElementById('sort-todos');
    const sortCriteria = sortSelect ? sortSelect.value : 'priority';
    
    // Sort the todos based on the selected criteria
    const sortedTodos = sortTodos(filteredTodos, sortCriteria);
    
    if (sortedTodos.length === 0) {
        // Show empty state placeholder instead of adding empty message to list
        if (emptyPlaceholder) {
            emptyPlaceholder.style.display = 'flex';
            
            // Update the placeholder message based on filter
            const placeholderText = emptyPlaceholder.querySelector('p');
            if (placeholderText) {
                placeholderText.textContent = currentFilter === 'all' 
                    ? 'No tasks to display. Add a new task to get started!' 
                    : `No ${currentFilter} tasks to display.`;
            }
        }
        return;
    } else if (emptyPlaceholder) {
        // Hide empty state
        emptyPlaceholder.style.display = 'none';
    }
    
    // Create a document fragment to improve performance
    const fragment = document.createDocumentFragment();
    
    sortedTodos.forEach(todo => {
        // Create todo element
        const todoEl = createTodoElement(todo);
        fragment.appendChild(todoEl);
    });
    
    // Append all elements at once for better performance
    todoList.appendChild(fragment);
}

// Create a visual todo element from a todo object - without category display
function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.setAttribute('data-id', todo.id);
    li.setAttribute('draggable', 'true');
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'listitem');
    
    // Add classes based on todo properties
    if (todo.completed) {
        li.classList.add('completed');
    }
    
    if (todo.priority) {
        li.classList.add(`priority-${todo.priority}`);
    }
    
    if (todo.dueDate) {
        if (isOverdue(todo.dueDate)) {
            li.classList.add('overdue');
        } else if (isDueSoon(todo.dueDate)) {
            li.classList.add('due-soon');
        }
    }
    
    if (todo.recurring) {
        li.classList.add('recurring');
    }
    
    // Add entrance animation based on whether it's a new todo
    const isNew = todo.createdAt && (Date.now() - new Date(todo.createdAt).getTime() < 5000);
    if (isNew) {
        li.classList.add('new-todo');
        // Remove the new-todo class after animation completes to avoid repeat animations
        setTimeout(() => {
            li.classList.remove('new-todo');
        }, 1000);
    } else {
        li.classList.add('fade-in');
    }
    
    const checkbox = document.createElement('button');
    checkbox.className = 'todo-checkbox';
    checkbox.setAttribute('aria-label', todo.completed ? 'Mark incomplete' : 'Mark complete');
    checkbox.setAttribute('aria-pressed', todo.completed ? 'true' : 'false');
    checkbox.innerHTML = `<span class="checkbox-icon">${todo.completed ? '✓' : ''}</span>`;
    
    checkbox.addEventListener('click', () => {
        toggleTodo(todo.id);
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    });
    
    const textContainer = document.createElement('div');
    textContainer.className = 'todo-text-container';
    
    const textEl = document.createElement('span');
    textEl.className = 'todo-text';
    textEl.textContent = todo.text;
    
    // Add metadata container for due date, created date, etc.
    const metaContainer = document.createElement('div');
    metaContainer.className = 'todo-meta';
    
    // Add priority indicator
    if (todo.priority && todo.priority !== 'normal') {
        const priorityEl = document.createElement('span');
        priorityEl.className = `todo-priority priority-${todo.priority}`;
        priorityEl.innerHTML = `<i class="fas fa-flag" aria-hidden="true"></i> ${todo.priority.charAt(0).toUpperCase()}${todo.priority.slice(1)}`;
        metaContainer.appendChild(priorityEl);
    }
    
    // Add due date
    if (todo.dueDate) {
        const dueEl = document.createElement('span');
        dueEl.className = 'todo-due-date';
        if (isOverdue(todo.dueDate)) {
            dueEl.classList.add('overdue');
            dueEl.innerHTML = `<i class="fas fa-calendar-times" aria-hidden="true"></i> ${formatDueDate(todo.dueDate)}`;
        } else if (isDueSoon(todo.dueDate)) {
            dueEl.classList.add('due-soon');
            dueEl.innerHTML = `<i class="fas fa-calendar-day" aria-hidden="true"></i> ${formatDueDate(todo.dueDate)}`;
        } else {
            dueEl.innerHTML = `<i class="fas fa-calendar" aria-hidden="true"></i> ${formatDueDate(todo.dueDate)}`;
        }
        metaContainer.appendChild(dueEl);
    }
    
    // Add recurring indicator
    if (todo.recurring) {
        const recurEl = document.createElement('span');
        recurEl.className = 'todo-recurring';
        recurEl.innerHTML = `<i class="fas fa-sync-alt" aria-hidden="true"></i> ${todo.recurring.pattern}`;
        
        // Add tooltip with more details about recurrence
        let recurDetails = `Repeats: ${todo.recurring.pattern}`;
        if (todo.recurring.endType === 'until' && todo.recurring.endDate) {
            recurDetails += `, until ${new Date(todo.recurring.endDate).toLocaleDateString()}`;
        } else if (todo.recurring.endType === 'occurrences' && todo.recurring.occurrences) {
            recurDetails += `, ${todo.recurring.currentOccurrence}/${todo.recurring.occurrences} times`;
        }
        
        recurEl.setAttribute('title', recurDetails);
        recurEl.setAttribute('aria-label', recurDetails);
        metaContainer.appendChild(recurEl);
    }
    
    // Add notification indicator if enabled
    if (todo.notifications && todo.notifications.enabled) {
        const notifEl = document.createElement('span');
        notifEl.className = 'todo-notification';
        notifEl.innerHTML = `<i class="fas fa-bell" aria-hidden="true"></i>`;
        
        // Show notification time in tooltip
        const notifTime = todo.notifications.time;
        let notifDetails = 'Notification: ';
        if (notifTime === 0) {
            notifDetails += 'At due time';
        } else if (notifTime === 60) {
            notifDetails += '1 hour before';
        } else if (notifTime === 1440) {
            notifDetails += '1 day before';
        } else {
            notifDetails += `${notifTime} minutes before`;
        }
        
        notifEl.setAttribute('title', notifDetails);
        notifEl.setAttribute('aria-label', notifDetails);
        metaContainer.appendChild(notifEl);
    }
    
    textContainer.appendChild(textEl);
    textContainer.appendChild(metaContainer);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('aria-label', `Delete task: ${todo.text}`);
    deleteBtn.innerHTML = '×';
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        deleteTodo(todo.id);
        
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50]); // pattern for delete
        }
    });
        
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '<i class="fas fa-grip-lines" aria-hidden="true"></i>';
    dragHandle.setAttribute('aria-hidden', 'true'); // Hide from screen readers
    
    li.appendChild(dragHandle);
    li.appendChild(checkbox);
    li.appendChild(textContainer);
    li.appendChild(deleteBtn);
    
    // Add drag and drop event listeners
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('dragenter', handleDragEnter);
    li.addEventListener('dragleave', handleDragLeave);
    li.addEventListener('drop', handleDrop);
    
    // Add keyboard event for handling Enter/Space on the li element
    li.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            checkbox.click(); // Toggle completion on Enter/Space
        } else if (e.key === 'Delete') {
            e.preventDefault();
            deleteBtn.click(); // Delete on Delete key
        }
    });
    
    // Add double click to edit functionality
    li.addEventListener('dblclick', function(e) {
        // Only trigger if clicking on the text
        if (e.target === textEl || e.target === textContainer) {
            const currentText = todo.text;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentText;
            input.className = 'edit-todo-input';
            
            // Replace the text with input
            textContainer.replaceChild(input, textEl);
            input.focus();
            input.setSelectionRange(0, input.value.length);
            
            // Handle saving on blur or Enter
            const saveEdit = () => {
                const newText = input.value.trim();
                if (newText && newText !== currentText) {
                    editTodoText(todo.id, newText);
                } else {
                    // If empty or unchanged, just restore the original
                    textContainer.replaceChild(textEl, input);
                }
            };
            
            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveEdit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    textContainer.replaceChild(textEl, input);
                }
            });
        }
    });
    
    return li;
}

// Function to edit todo text
function editTodoText(id, newText) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, text: newText };
        }
        return todo;
    });
    
    saveToStorage();
    renderTodos();
    announceToScreenReader(`Updated task to: ${newText}`);
}

// Add event listeners with improved robustness - without category functions
function addEventListeners() {
    // Form events
    if (todoForm) todoForm.addEventListener('submit', addTodo);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllTodos);
    if (clearCompletedBtn) clearCompletedBtn.addEventListener('click', clearCompletedTodos);
    
    // Sound toggle functionality
    const soundToggle = document.getElementById('sound-toggle');
    const soundIcon = document.getElementById('sound-icon');
    
    if (soundToggle && soundIcon) {
        // Set initial state based on localStorage
        const soundMuted = localStorage.getItem('muteSound') === 'true';
        if (soundMuted) {
            soundToggle.classList.add('muted');
            soundIcon.className = 'fas fa-volume-mute';
        }
        
        soundToggle.addEventListener('click', () => {
            const currentlyMuted = localStorage.getItem('muteSound') === 'true';
            localStorage.setItem('muteSound', !currentlyMuted);
            
            if (currentlyMuted) {
                // Unmute
                soundToggle.classList.remove('muted');
                soundIcon.className = 'fas fa-volume-up';
                playSound('add'); // Play test sound
            } else {
                // Mute
                soundToggle.classList.add('muted');
                soundIcon.className = 'fas fa-volume-mute';
            }
            
            announceToScreenReader(`Sound effects ${currentlyMuted ? 'enabled' : 'disabled'}`);
        });
    }
    
    // Enhanced todo input for better UX
    if (todoInput) {
        // Add animation effect on focus/blur for better visual feedback
        todoInput.addEventListener('focus', () => {
            todoInput.parentElement?.classList.add('input-focused');
        });
        
        todoInput.addEventListener('blur', () => {
            todoInput.parentElement?.classList.remove('input-focused');
        });
        
        // Add debounced character counting for better UX
        const charCounter = document.createElement('span');
        charCounter.classList.add('char-counter');
        todoInput.parentElement?.appendChild(charCounter);
        
        const updateCounter = debounce(function() {
            const length = todoInput.value.length;
            const maxLength = 100; // Suggested max length
            charCounter.textContent = `${length}/${maxLength}`;
            
            if (length > maxLength) {
                charCounter.classList.add('exceeded');
            } else {
                charCounter.classList.remove('exceeded');
            }
            
            // Only show counter when there's text
            charCounter.style.opacity = length > 0 ? '1' : '0';
        }, 200);
        
        todoInput.addEventListener('input', updateCounter);
        
        // Add keydown handling for keyboard navigation
        todoInput.addEventListener('keydown', handleTodoInputKeydown);
    }
    
    // Filter events
    if (filterBtns) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                setFilter(filter);
            });
        });
    }
    
    // Sort event listener
    const sortSelect = document.getElementById('sort-todos');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            renderTodos();
            announceToScreenReader(`Tasks sorted by ${sortSelect.options[sortSelect.selectedIndex].text}`);
        });
    }
    
    // Schedule optimizer button
    const scheduleBtn = document.getElementById('view-schedule');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', showOptimizedSchedule);
    }
    
    // Recurring options event listeners
    if (recurringSelect) {
        recurringSelect.addEventListener('change', handleRecurringChange);
    }
    
    if (recurringEndTypeSelect) {
        recurringEndTypeSelect.addEventListener('change', function() {
            const endTypeValue = this.value;
            
            // Show/hide appropriate inputs based on selection
            if (recurringEndDateInput) {
                recurringEndDateInput.parentElement.style.display = 
                    endTypeValue === 'until' ? 'block' : 'none';
            }
            
            if (recurringOccurrencesInput) {
                recurringOccurrencesInput.parentElement.style.display = 
                    endTypeValue === 'occurrences' ? 'block' : 'none';
            }
        });
    }
    
    // Notification events
    if (enableNotificationsCheckbox) {
        enableNotificationsCheckbox.addEventListener('change', handleNotificationToggle);
    }
    
    // Todo input events
    if (todoInput) {
        todoInput.addEventListener('keydown', handleTodoInputKeydown);
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Error handling
    window.addEventListener('error', handleError);
    
    // Before unload - clean up and save
    window.addEventListener('beforeunload', () => {
        saveToStorage();
    });
    
    // Add bulk action buttons
    const completeAllBtn = document.getElementById('complete-all');
    const uncompleteAllBtn = document.getElementById('uncomplete-all');
    const deleteFilteredBtn = document.getElementById('delete-filtered');
    const updateRecurringBtn = document.getElementById('update-recurring');
    
    if (completeAllBtn) {
        completeAllBtn.addEventListener('click', () => toggleAllTodos(true));
    }
    
    if (uncompleteAllBtn) {
        uncompleteAllBtn.addEventListener('click', () => toggleAllTodos(false));
    }
    
    if (deleteFilteredBtn) {
        deleteFilteredBtn.addEventListener('click', bulkDeleteTodos);
    }
    
    if (updateRecurringBtn) {
        updateRecurringBtn.addEventListener('click', batchUpdateRecurring);
    }
}

// Helper function to announce changes to screen readers
function announceToScreenReader(message, priority = 'polite') {
    const region = priority === 'assertive' ? alertRegion : statusRegion;
    if (region) {
        region.textContent = message;
        
        // Clear after 3 seconds to avoid cluttering screen reader output
        setTimeout(() => {
            region.textContent = '';
        }, 3000);
    }
}

// Save data to local storage - without categories
function saveToStorage() {
    try {
    localStorage.setItem('todos', JSON.stringify(todos));
    } catch (error) {
        console.error('Error saving to localStorage', error);
        announceToScreenReader('Failed to save your data. Please check if you have enough storage space.', 'assertive');
    }
}

// Load data from local storage - without categories
function loadFromStorage() {
    const storedTodos = localStorage.getItem('todos');
    
    if (storedTodos) {
        try {
            todos = JSON.parse(storedTodos);
            
            // Migrate old recurring format to new format if needed
            todos = todos.map(todo => {
                if (todo.recurring && typeof todo.recurring === 'string') {
                    // Convert old string format to new object format
                    todo.recurring = {
                        pattern: todo.recurring,
                        endType: 'until',
                        endDate: null,
                        currentOccurrence: 1
                    };
                }
                
                // Remove category from todos if present
                if (todo.category) {
                    delete todo.category;
                }
                
                return todo;
            });
        } catch (error) {
            console.error('Error parsing todos from localStorage', error);
            todos = [];
        }
    }
}

// Add recurring change handler that was referenced but not defined
function handleRecurringChange() {
    const isRecurring = recurringSelect.value !== '';
    
    // Show/hide recurring options based on selection
    if (recurringEndDateContainer) {
        recurringEndDateContainer.style.display = isRecurring ? 'block' : 'none';
    }
    
    // Default to "until" for end type if recurring is enabled
    if (isRecurring && recurringEndTypeSelect) {
        const endTypeValue = recurringEndTypeSelect.value;
        
        // Show appropriate end type input
        if (recurringEndDateInput) {
            recurringEndDateInput.parentElement.style.display = 
                endTypeValue === 'until' ? 'block' : 'none';
        }
        
        if (recurringOccurrencesInput) {
            recurringOccurrencesInput.parentElement.style.display = 
                endTypeValue === 'occurrences' ? 'block' : 'none';
        }
    }
}

// Update recurring options
function updateRecurringOptions() {
    // Hide recurring end date container initially
    if (recurringEndDateContainer) {
        recurringEndDateContainer.style.display = 'none';
    }
    
    // Set today as the minimum date for recurring end date
    if (recurringEndDateInput) {
        const today = new Date().toISOString().split('T')[0];
        recurringEndDateInput.setAttribute('min', today);
    }
}

// Handle recurring todo completion logic
function handleRecurringCompletion(todo) {
    if (!todo.recurring) return;
    
    const pattern = todo.recurring.pattern;
    
    // Only create a new recurring instance if it wasn't already recreated
    if (!todo.lastRecurred || new Date(todo.lastRecurred).getTime() < new Date().getTime() - 86400000) {
        // Calculate the next date based on the pattern
        const nextDate = getNextDate(todo.dueDate, pattern);
        
        // Check if we should create a new recurring todo
        if (shouldCreateRecurring(todo, nextDate)) {
            // Create a new instance of the todo
            const newTodo = {
                ...todo,
                id: Date.now().toString(),
                completed: false,
                createdAt: new Date().toISOString(),
                dueDate: nextDate.toISOString().split('T')[0],
                lastRecurred: new Date().toISOString()
            };
            
            // Increment occurrence counter if needed
            if (newTodo.recurring.endType === 'occurrences' && newTodo.recurring.occurrences) {
                newTodo.recurring.currentOccurrence = (newTodo.recurring.currentOccurrence || 1) + 1;
            }
            
            // Add the new todo to the list
            todos.push(newTodo);
            
            // Schedule notification for new todo if needed
            if (newTodo.notifications && newTodo.notifications.enabled) {
                scheduleNotification(newTodo);
            }
            
            // Update the original todo to prevent duplicate recurrences
            todo.lastRecurred = new Date().toISOString();
        }
    }
}

// Helper to calculate next date for recurring todos
function getNextDate(currentDateStr, pattern) {
    const currentDate = new Date(currentDateStr);
    const nextDate = new Date(currentDate);
    
    switch (pattern) {
        case 'daily':
            nextDate.setDate(currentDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(currentDate.getDate() + 7);
            break;
        case 'biweekly':
            nextDate.setDate(currentDate.getDate() + 14);
            break;
        case 'monthly':
            nextDate.setMonth(currentDate.getMonth() + 1);
            break;
        case 'quarterly':
            nextDate.setMonth(currentDate.getMonth() + 3);
            break;
        case 'yearly':
            nextDate.setFullYear(currentDate.getFullYear() + 1);
            break;
        case 'weekdays':
            // Skip to next weekday
            nextDate.setDate(currentDate.getDate() + 1);
            while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
                nextDate.setDate(nextDate.getDate() + 1);
            }
            break;
        case 'weekends':
            // Skip to next weekend day
            nextDate.setDate(currentDate.getDate() + 1);
            while (nextDate.getDay() !== 0 && nextDate.getDay() !== 6) {
                nextDate.setDate(nextDate.getDate() + 1);
            }
            break;
        default:
            nextDate.setDate(currentDate.getDate() + 1);
    }
    
    return nextDate;
}

// Should we create a recurring todo based on end conditions
function shouldCreateRecurring(todo, nextDate) {
    if (!todo.recurring) return false;
    
    // Check end conditions
    if (todo.recurring.endType === 'until' && todo.recurring.endDate) {
        const endDate = new Date(todo.recurring.endDate);
        if (nextDate > endDate) {
            return false;
        }
    } else if (todo.recurring.endType === 'occurrences' && todo.recurring.occurrences) {
        const currentOccurrence = todo.recurring.currentOccurrence || 1;
        if (currentOccurrence >= todo.recurring.occurrences) {
            return false;
        }
    }
    
    return true;
}

// Toggle all todos at once - for bulk actions
function toggleAllTodos(completedState) {
    // Get filtered todos to only act on visible ones
    const filteredTodos = getFilteredTodos();
    
    if (filteredTodos.length === 0) {
        announceToScreenReader('No tasks to update', 'polite');
        return;
    }
    
    // Get IDs of filtered todos
    const filteredIds = filteredTodos.map(todo => todo.id);
    
    // Update all todos that match the filter
    todos = todos.map(todo => {
        if (filteredIds.includes(todo.id)) {
            // If we're completing and it's not already completed, handle recurring logic
            if (completedState && !todo.completed && todo.recurring) {
                handleRecurringCompletion(todo);
            }
            
            // Clear notification if task completed
            if (completedState && !todo.completed && todo.notifications) {
                clearNotification(todo.id);
            }
            
            return { ...todo, completed: completedState };
        }
        return todo;
    });
    
    saveToStorage();
    renderTodos();
    updateTasksLeft();
    
    const action = completedState ? 'completed' : 'marked active';
    announceToScreenReader(`${filteredTodos.length} tasks ${action}`, 'polite');
}

// Bulk delete filtered todos
function bulkDeleteTodos() {
    const filteredTodos = getFilteredTodos();
    
    if (filteredTodos.length === 0) {
        announceToScreenReader('No tasks to delete', 'polite');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${filteredTodos.length} tasks?`)) {
        return;
    }
    
    const filteredIds = filteredTodos.map(todo => todo.id);
    
    // Clear notifications for deleted todos
    filteredTodos.forEach(todo => {
        if (todo.notifications) {
            clearNotification(todo.id);
        }
    });
    
    // Remove todos that match the filter
    todos = todos.filter(todo => !filteredIds.includes(todo.id));
    
    saveToStorage();
    renderTodos();
    updateTasksLeft();
    
    announceToScreenReader(`Deleted ${filteredTodos.length} tasks`, 'polite');
}

// Batch update recurring todos
function batchUpdateRecurring() {
    const recurringTodos = todos.filter(todo => todo.recurring && !todo.completed);
    
    if (recurringTodos.length === 0) {
        announceToScreenReader('No recurring tasks to update', 'polite');
        return;
    }
    
    checkForRecurringTodos();
    
    announceToScreenReader('Updated recurring tasks', 'polite');
}

// Enhanced keyboard navigation with improved context
function handleKeyboardNavigation(e) {
    // Only handle navigation keys when not in an input or contenteditable
    if (e.target.matches('input, textarea, select, [contenteditable]')) {
        return;
    }
    
    // Show keyboard shortcuts help (press ? key)
    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        showKeyboardShortcutsHelp();
        return;
    }
    
    // Handle up/down arrow keys to navigate todo items
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        const todos = document.querySelectorAll('.todo-item');
        const currentIndex = Array.from(todos).findIndex(todo => 
            todo === document.activeElement
        );
        
        if (currentIndex !== -1 || e.target.closest('.todo-list')) {
            e.preventDefault();
            const nextIndex = e.key === 'ArrowUp' 
                ? Math.max(0, currentIndex - 1)
                : Math.min(todos.length - 1, currentIndex + 1);
            
            if (todos[nextIndex]) {
                todos[nextIndex].focus();
                todos[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    } else if (e.key === 'Escape') {
        // Close any open edit inputs
        const editInputs = document.querySelectorAll('.edit-todo-input');
        if (editInputs.length > 0) {
            editInputs.forEach(input => {
                input.blur();
            });
        }
        
        // Close any open modals
        const modals = document.querySelectorAll('.modal[style*="display: flex"]');
        if (modals.length > 0) {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    } else if (e.key === 'a' && e.ctrlKey && e.shiftKey) {
        // Ctrl+Shift+A to toggle all todos
        e.preventDefault();
        toggleAllTodos(true);
    } else if (e.key === 'z' && e.ctrlKey && e.shiftKey) {
        // Ctrl+Shift+Z to untoggle all todos
        e.preventDefault();
        toggleAllTodos(false);
    } else if (e.key === 'd' && e.ctrlKey && e.shiftKey) {
        // Ctrl+Shift+D to delete filtered todos
        e.preventDefault();
        bulkDeleteTodos();
    }
}

// Show keyboard shortcuts help modal
function showKeyboardShortcutsHelp() {
    // Create modal container if it doesn't exist
    let helpModal = document.getElementById('keyboard-shortcuts-modal');
    if (!helpModal) {
        helpModal = document.createElement('div');
        helpModal.id = 'keyboard-shortcuts-modal';
        helpModal.className = 'modal keyboard-modal';
        document.body.appendChild(helpModal);
    }
    
    // Create modal content with keyboard shortcuts
    helpModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Keyboard Shortcuts</h2>
                <button class="close-modal" aria-label="Close shortcuts help">&times;</button>
            </div>
            <div class="modal-body">
                <div class="shortcuts-container">
                    <div class="shortcuts-section">
                        <h3>Navigation</h3>
                        <ul class="shortcuts-list">
                            <li><kbd>↑</kbd> / <kbd>↓</kbd> - Navigate through tasks</li>
                            <li><kbd>Tab</kbd> - Move between interactive elements</li>
                            <li><kbd>Alt</kbd> + <kbd>N</kbd> - Focus new task input</li>
                            <li><kbd>Alt</kbd> + <kbd>S</kbd> - Focus search</li>
                            <li><kbd>Ctrl</kbd> + <kbd>F</kbd> - Focus search</li>
                        </ul>
                    </div>
                    
                    <div class="shortcuts-section">
                        <h3>Task Management</h3>
                        <ul class="shortcuts-list">
                            <li><kbd>Enter</kbd> or <kbd>Space</kbd> - Toggle task completion</li>
                            <li><kbd>Delete</kbd> - Delete focused task</li>
                            <li><kbd>Ctrl</kbd> + <kbd>Enter</kbd> - Submit new task</li>
                            <li><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> - Complete all tasks</li>
                            <li><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> - Uncomplete all tasks</li>
                            <li><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> - Delete filtered tasks</li>
                        </ul>
                    </div>
                    
                    <div class="shortcuts-section">
                        <h3>Miscellaneous</h3>
                        <ul class="shortcuts-list">
                            <li><kbd>Alt</kbd> + <kbd>T</kbd> - Toggle theme</li>
                            <li><kbd>Esc</kbd> - Close modals or cancel editing</li>
                            <li><kbd>?</kbd> - Show this help</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="close-btn">Close</button>
            </div>
        </div>
    `;
    
    // Show the modal
    helpModal.style.display = 'flex';
    
    // Add event listeners for closing
    const closeButtons = helpModal.querySelectorAll('.close-modal, .close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
    });
    
    // Close when clicking outside the modal
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpModal.style.display === 'flex') {
            helpModal.style.display = 'none';
        }
    });
    
    announceToScreenReader('Showing keyboard shortcuts help');
}

// Helper function to get the next 7 days names with dates
function getNextSevenDays() {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
        const dayDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        days.push(`${dayName} (${dayDate})`);
    }
    
    return days;
}

// Enhanced error handling
function handleError(error) {
    console.error('Application error:', error);
    
    // Check if the error is storage related
    if (error.name === 'QuotaExceededError' || 
        error.message.includes('storage') || 
        error.message.includes('quota')) {
        
        announceToScreenReader('Storage error: You may have run out of space. Try clearing some data.', 'assertive');
        
        // Show error modal
        showErrorModal('Storage Space Error', 
            'You have run out of storage space. This could affect saving your todos. ' +
            'Please try deleting some items or clearing old data.');
            
    } else if (error.message.includes('permission')) {
        // Notification permissions issue
        announceToScreenReader('Permission error: Please check notification permissions.', 'assertive');
        
        showErrorModal('Permission Error', 
            'There was an issue with permissions. If you enabled notifications, ' +
            'please make sure they are allowed in your browser settings.');
            
    } else {
        // Generic error
        announceToScreenReader('An error occurred. Please refresh the page.', 'assertive');
        
        showErrorModal('Application Error', 
            'Something went wrong. You may need to refresh the page. ' +
            'If the problem persists, try clearing your browser data.');
    }
}

// Show error modal
function showErrorModal(title, message) {
    // Create error modal if it doesn't exist
    let errorModal = document.getElementById('error-modal');
    if (!errorModal) {
        errorModal = document.createElement('div');
        errorModal.id = 'error-modal';
        errorModal.className = 'modal error-modal';
        document.body.appendChild(errorModal);
    }
    
    // Create modal content
    errorModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-modal" aria-label="Close error message">&times;</button>
            </div>
            <div class="modal-body">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p class="error-message">${message}</p>
            </div>
            <div class="modal-footer">
                <button class="close-btn">Close</button>
            </div>
        </div>
    `;
    
    // Show the modal
    errorModal.style.display = 'flex';
    
    // Add event listeners for closing
    const closeButtons = errorModal.querySelectorAll('.close-modal, .close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            errorModal.style.display = 'none';
        });
    });
    
    // Close when clicking outside the modal
    errorModal.addEventListener('click', (e) => {
        if (e.target === errorModal) {
            errorModal.style.display = 'none';
        }
    });
}

// Debounce helper to improve performance
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Add performance monitoring
function monitorPerformance() {
    // Start performance mark for rendering
    if (window.performance) {
        // Measure render time
        const renderTodosOriginal = renderTodos;
        renderTodos = function() {
            performance.mark('renderStart');
            renderTodosOriginal();
            performance.mark('renderEnd');
            performance.measure('renderTime', 'renderStart', 'renderEnd');
            
            // Log if render is taking too long
            const measurements = performance.getEntriesByName('renderTime');
            if (measurements.length > 0) {
                const lastMeasure = measurements[measurements.length - 1];
                if (lastMeasure.duration > 100) {
                    console.warn('Render taking too long:', lastMeasure.duration.toFixed(2) + 'ms');
                    
                    // If consistently slow with many todos, enable virtual scrolling
                    if (lastMeasure.duration > 200 && getFilteredTodos().length > 20) {
                        console.info('Enabling virtual scrolling for performance');
                        implementVirtualScrolling();
                    }
                }
            }
        };
    }
}

// Handle keydown events in todo input for quick submission and navigation
function handleTodoInputKeydown(e) {
    // Check for Ctrl+Enter to submit the form
    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        todoForm.dispatchEvent(new Event('submit'));
    }
    
    // Handle Tab navigation behavior
    if (e.key === 'Tab' && !e.shiftKey) {
        // Focus due date when Tab pressed in todo input
        if (dueDateInput) {
            e.preventDefault();
            dueDateInput.focus();
        }
    }
}

// Initialize all features
window.addEventListener('DOMContentLoaded', () => {
    try {
        init();
        monitorPerformance();
    } catch (error) {
        console.error('Critical initialization error:', error);
        handleError(error);
    }
});

// Drag and drop handlers for todo items
function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
    this.classList.add('dragging');
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
    
    // Announce to screen readers
    announceToScreenReader('Started dragging task: ' + this.querySelector('.todo-text').textContent);
}

function handleDragEnd(e) {
    draggedItem = null;
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('dragging');
        item.classList.remove('drag-over');
    });
    
    announceToScreenReader('Dropped task');
}

function handleDragOver(e) {
    e.preventDefault();
    return false;
}

function handleDragEnter(e) {
    e.preventDefault();
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();
    
    if (draggedItem === this) return false;
    
    // Get todo IDs
    const draggedId = draggedItem.getAttribute('data-id');
    const dropId = this.getAttribute('data-id');
    
    // Find indices of items in the todos array
    const draggedIndex = todos.findIndex(todo => todo.id === draggedId);
    const dropIndex = todos.findIndex(todo => todo.id === dropId);
    
    if (draggedIndex === -1 || dropIndex === -1) return false;
    
    // Reorder the array
    const [movedItem] = todos.splice(draggedIndex, 1);
    todos.splice(dropIndex, 0, movedItem);
    
    // Save and re-render
    saveToStorage();
    renderTodos();
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
        navigator.vibrate([20, 30, 20]);
    }
    
    announceToScreenReader('Reordered tasks');
    
    return false;
}

// Toggle todo completion state
function toggleTodo(id) {
    // Find the todo and its DOM element before making changes
    const todo = todos.find(t => t.id === id);
    const todoElement = document.querySelector(`.todo-item[data-id="${id}"]`);
    
    if (!todo) return;
    
    // Create a visual feedback effect before toggling
    if (todoElement) {
        // Add a temporary class for the animation
        const newState = !todo.completed;
        
        if (newState) {
            // Completing animation
            todoElement.classList.add('completing');
            // Play a success sound if browser supports it
            playSound('complete');
            
            // Dispatch the custom event for confetti effect
            const rect = todoElement.getBoundingClientRect();
            const eventDetail = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                todoId: id
            };
            window.dispatchEvent(new CustomEvent('todo-completed', { detail: eventDetail }));
        } else {
            // Uncompleting animation
            todoElement.classList.add('uncompleting');
        }
        
        // Give the animation time to run before updating the state
        setTimeout(() => {
            // Update the todo object in the array
            todos = todos.map(todo => {
                if (todo.id === id) {
                    // If we're completing the todo and it's recurring, handle that logic
                    if (!todo.completed && todo.recurring) {
                        handleRecurringCompletion(todo);
                    }
                    
                    // Clear notification if completing a task
                    if (!todo.completed && todo.notifications) {
                        clearNotification(todo.id);
                    }
                    
                    return { ...todo, completed: !todo.completed };
                }
                return todo;
            });
            
            saveToStorage();
            renderTodos();
            updateTasksLeft();
            
            // Announce the change to screen readers
            announceToScreenReader(`Marked "${todo.text}" as ${!todo.completed ? 'completed' : 'active'}`);
        }, 300); // Match with animation duration
    } else {
        // If element isn't in the DOM, just update the state without animation
        todos = todos.map(todo => {
            if (todo.id === id) {
                // Handle recurring and notifications
                if (!todo.completed && todo.recurring) {
                    handleRecurringCompletion(todo);
                }
                
                if (!todo.completed && todo.notifications) {
                    clearNotification(todo.id);
                }
                
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        
        saveToStorage();
        renderTodos();
        updateTasksLeft();
        
        // Announce the change to screen readers
        announceToScreenReader(`Marked "${todo.text}" as ${!todo.completed ? 'completed' : 'active'}`);
    }
}

// Simple sound effects for important actions
function playSound(type) {
    // Only play sounds if not disabled by user preference
    if (localStorage.getItem('muteSound') === 'true') return;
    
    try {
        // Create the audio context if possible
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioCtx();
            
            // Create an oscillator
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Set sound parameters based on type
            switch (type) {
                case 'complete':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                    oscillator.start();
                    oscillator.stop(audioCtx.currentTime + 0.2);
                    break;
                    
                case 'delete':
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(330, audioCtx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                    oscillator.start();
                    oscillator.stop(audioCtx.currentTime + 0.2);
                    break;
                    
                case 'add':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                    oscillator.start();
                    oscillator.stop(audioCtx.currentTime + 0.2);
                    break;
            }
        }
    } catch (error) {
        console.log('Sound not supported or enabled');
    }
}

// Delete a todo
function deleteTodo(id) {
    // Get the todo before we delete it for accessibility announcement
    const todo = todos.find(t => t.id === id);
    
    if (!todo) return;
    
    // Find the DOM element for animation
    const todoElement = document.querySelector(`.todo-item[data-id="${id}"]`);
    
    // Play delete sound
    playSound('delete');
    
    // Animate deletion if element exists
    if (todoElement) {
        todoElement.classList.add('deleting');
        
        // Give animation time to complete
        setTimeout(() => {
            // Clear any notifications for this todo
            clearNotification(id);
            
            // Remove from the array
            todos = todos.filter(todo => todo.id !== id);
            
            saveToStorage();
            renderTodos();
            updateTasksLeft();
            
            if (todo) {
                announceToScreenReader(`Deleted "${todo.text}"`);
            }
        }, 300); // Match animation duration
    } else {
        // If element isn't in DOM, just remove without animation
        clearNotification(id);
        todos = todos.filter(todo => todo.id !== id);
        saveToStorage();
        renderTodos();
        updateTasksLeft();
        
        if (todo) {
            announceToScreenReader(`Deleted "${todo.text}"`);
        }
    }
}

// Update the displayed count of tasks left
function updateTasksLeft() {
    const activeTodos = todos.filter(todo => !todo.completed);
    
    if (tasksLeftEl) {
        tasksLeftEl.textContent = `${activeTodos.length} task${activeTodos.length !== 1 ? 's' : ''} left`;
    }
}

// Clear all todos at once
function clearAllTodos() {
    if (todos.length === 0) {
        announceToScreenReader('No tasks to clear', 'polite');
        return;
    }
    
    if (!confirm('Are you sure you want to delete ALL tasks?')) {
        return;
    }
    
    // Clear all notifications
    todos.forEach(todo => {
        if (todo.notifications) {
            clearNotification(todo.id);
        }
    });
    
    todos = [];
    saveToStorage();
    renderTodos();
    updateTasksLeft();
    
    announceToScreenReader('All tasks cleared', 'assertive');
}

// Clear only completed todos
function clearCompletedTodos() {
    const completedTodos = todos.filter(todo => todo.completed);
    
    if (completedTodos.length === 0) {
        announceToScreenReader('No completed tasks to clear', 'polite');
        return;
    }
    
    // Clear notifications for completed todos
    completedTodos.forEach(todo => {
        if (todo.notifications) {
            clearNotification(todo.id);
        }
    });
    
    todos = todos.filter(todo => !todo.completed);
    saveToStorage();
    renderTodos();
    updateTasksLeft();
    
    announceToScreenReader(`Cleared ${completedTodos.length} completed tasks`);
}

// Set current filter
function setFilter(filter) {
    currentFilter = filter;
    
    // Update active state on filter buttons
    filterBtns.forEach(btn => {
        const isActive = btn.getAttribute('data-filter') === filter;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    
    renderTodos();
    announceToScreenReader(`Showing ${filter} tasks`);
}

// Add error handling
function addErrorHandling() {
    // Global error handling is already set up
    window.addEventListener('error', handleError);
    
    // Add additional unhandled promise rejection handling
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        handleError(event.reason || new Error('Unhandled Promise Rejection'));
    });
}

// Function to update empty state placeholder visibility
function updateEmptyStatePlaceholder() {
    const emptyPlaceholder = document.getElementById('empty-todo-placeholder');
    if (!emptyPlaceholder) return;
    
    if (todos.length === 0) {
        emptyPlaceholder.style.display = 'flex';
    } else {
        emptyPlaceholder.style.display = 'none';
    }
}

// Initialize new features like search and virtual scrolling
function initNewFeatures() {
    // Add smart task grouping
    addSmartTaskGrouping();
    
    // Add virtual scrolling if many todos
    if (todos.length > 100) {
        addInfiniteScroll();
    }
    
    // Check if we need to set up categories
    updateEmptyStatePlaceholder();
    
    // Add drag and drop functionality
    todoList?.querySelectorAll('.todo-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
    });
}

// Show optimized schedule view
function showOptimizedSchedule() {
    // Calculate a 7-day optimized schedule
    const schedule = generateOptimizedSchedule();
    
    // Create modal container if it doesn't exist
    let scheduleModal = document.getElementById('schedule-modal');
    if (!scheduleModal) {
        scheduleModal = document.createElement('div');
        scheduleModal.id = 'schedule-modal';
        scheduleModal.className = 'modal';
        document.body.appendChild(scheduleModal);
    }
    
    // Get day names for the next 7 days
    const dayNames = getNextSevenDays();
    
    // Create modal content
    scheduleModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Optimized 7-Day Schedule</h2>
                <button class="close-modal" aria-label="Close schedule">&times;</button>
            </div>
            <div class="modal-body">
                <div class="schedule-grid">
                    ${dayNames.map((day, index) => `
                        <div class="schedule-day">
                            <h3>${day}</h3>
                            <div class="schedule-tasks">
                                ${schedule[index].length > 0 
                                    ? schedule[index].map(task => `
                                        <div class="schedule-task priority-${task.priority || 'normal'}">
                                            <span class="task-text">${task.text}</span>
                                            ${task.dueDate ? `<span class="task-due">${formatDueDate(task.dueDate)}</span>` : ''}
                                        </div>
                                    `).join('')
                                    : '<div class="empty-day">No tasks</div>'
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <p>Tasks are optimally distributed based on due dates, priority, and workload balance.</p>
                <button class="close-btn">Close</button>
            </div>
        </div>
    `;
    
    // Show the modal
    scheduleModal.style.display = 'flex';
    
    // Add event listeners for closing
    const closeButtons = scheduleModal.querySelectorAll('.close-modal, .close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            scheduleModal.style.display = 'none';
        });
    });
    
    // Close when clicking outside the modal
    scheduleModal.addEventListener('click', (e) => {
        if (e.target === scheduleModal) {
            scheduleModal.style.display = 'none';
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && scheduleModal.style.display === 'flex') {
            scheduleModal.style.display = 'none';
        }
    });
    
    announceToScreenReader('Showing optimized schedule for the next 7 days');
}

// Generate optimized task schedule for 7 days
function generateOptimizedSchedule() {
    // Get incomplete tasks
    const incompleteTasks = todos.filter(todo => !todo.completed);
    
    // Initialize 7-day schedule
    const schedule = Array(7).fill(null).map(() => []);
    
    // First assign tasks with due dates to their specific days
    incompleteTasks.forEach(todo => {
        if (todo.dueDate) {
            const dueDate = new Date(todo.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Calculate days from today (0 = today, 1 = tomorrow, etc.)
            const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
            
            // If due within next 7 days, add to that day
            if (daysDiff >= 0 && daysDiff < 7) {
                schedule[daysDiff].push(todo);
            }
        }
    });
    
    // Then distribute tasks without due dates based on priority and workload balance
    const tasksWithoutDueDate = incompleteTasks.filter(todo => !todo.dueDate);
    
    // Sort by priority
    tasksWithoutDueDate.sort((a, b) => {
        const priorityMap = { high: 3, normal: 2, low: 1 };
        return (priorityMap[b.priority] || 2) - (priorityMap[a.priority] || 2);
    });
    
    // Distribute to balance workload across days
    tasksWithoutDueDate.forEach(todo => {
        // Find the day with the least tasks
        const dayIndex = schedule
            .map((day, index) => ({ count: day.length, index }))
            .sort((a, b) => a.count - b.count)[0].index;
        
        schedule[dayIndex].push(todo);
    });
    
    // For each day, sort tasks by priority
    schedule.forEach(day => {
        day.sort((a, b) => {
            const priorityMap = { high: 3, normal: 2, low: 1 };
            return (priorityMap[b.priority] || 2) - (priorityMap[a.priority] || 2);
        });
    });
    
    return schedule;
}

// Get the names of the next 7 days starting from today
function getNextSevenDays() {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Format: "Monday (6/15)" or "Today" or "Tomorrow"
        let dayName;
        if (i === 0) {
            dayName = 'Today';
        } else if (i === 1) {
            dayName = 'Tomorrow';
        } else {
            const options = { weekday: 'long' };
            dayName = date.toLocaleDateString('en-US', options);
        }
        
        // Add the date
        dayName += ` (${date.getMonth() + 1}/${date.getDate()})`;
        
        days.push(dayName);
    }
    
    return days;
}

// Sort todos algorithm - multiple criteria with improved performance
function sortTodos(todoList, criteria = 'priority') {
    // Show loading for long lists
    if (todoList.length > 50) {
        showLoading();
    }
    
    const sortedList = [...todoList];
    
    // Start performance measurement for sorting
    const sortStart = performance.now();
    
    try {
        switch (criteria) {
            case 'priority':
                // Cached priority scores for better performance
                const priorityScores = new Map();
                
                sortedList.sort((a, b) => {
                    // Use cached scores if available
                    if (!priorityScores.has(a.id)) {
                        priorityScores.set(a.id, calculateTaskPriorityScore(a));
                    }
                    if (!priorityScores.has(b.id)) {
                        priorityScores.set(b.id, calculateTaskPriorityScore(b));
                    }
                    
                    return priorityScores.get(b.id) - priorityScores.get(a.id);
                });
                break;
                
            case 'dueDate':
                return sortedList.sort((a, b) => {
                    // Handle null due dates
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;  // Null dates at the end
                    if (!b.dueDate) return -1;
                    
                    // Always prioritize urgent overdue tasks
                    const aOverdue = isOverdue(a.dueDate);
                    const bOverdue = isOverdue(b.dueDate);
                    
                    if (aOverdue && !bOverdue) return -1;
                    if (!aOverdue && bOverdue) return 1;
                    
                    // Then sort by date
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                
            case 'alphabetical':
                return sortedList.sort((a, b) => a.text.localeCompare(b.text));
                
            case 'dateCreated':
                return sortedList.sort((a, b) => {
                    if (!a.createdAt && !b.createdAt) return 0;
                    if (!a.createdAt) return 1;
                    if (!b.createdAt) return -1;
                    
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                
            default:
                return sortedList;
        }
    } catch (error) {
        console.error('Error during sorting:', error);
        // Fall back to simpler sort if there's an error
        return sortedList.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            return 0;
        });
    } finally {
        // Measure sort performance
        const sortEnd = performance.now();
        if (sortEnd - sortStart > 100) {
            console.log(`Sort performance warning: ${sortEnd - sortStart}ms for ${todoList.length} items`);
        }
        
        if (todoList.length > 50) {
            hideLoading();
        }
    }
    
    return sortedList;
}

// Task priority score algorithm - calculates importance score for sorting and highlighting
function calculateTaskPriorityScore(todo) {
    let score = 0;
    
    // Base priority scores
    const priorityScores = {
        low: 1,
        normal: 2,
        high: 3,
        urgent: 5
    };
    
    // Add base priority score
    score += priorityScores[todo.priority] || priorityScores.normal;
    
    // Due date factor - tasks due sooner get higher scores
    if (todo.dueDate) {
        const now = new Date();
        const due = new Date(todo.dueDate);
        const daysUntilDue = Math.floor((due - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) {
            // Overdue tasks get highest priority
            score += 10;
        } else if (daysUntilDue === 0) {
            // Due today
            score += 8;
        } else if (daysUntilDue <= 2) {
            // Due in next 2 days
            score += 5;
        } else if (daysUntilDue <= 7) {
            // Due this week
            score += 3;
        } else {
            // Due later
            score += 1;
        }
    }
    
    // Recurring tasks get slight boost (they're typically important)
    if (todo.recurring) {
        score += 1;
    }
    
    // Tasks with notifications also get slight boost
    if (todo.notifications && todo.notifications.enabled) {
        score += 1;
    }
    
    // Calculate recency factor - newer tasks get a small boost
    if (todo.createdAt) {
        const now = new Date();
        const created = new Date(todo.createdAt);
        const daysOld = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        
        // Diminishing recency bonus
        score += Math.max(0, 1 - (daysOld / 14));
    }
    
    return score;
}

// Function to check if a date is overdue
function isOverdue(dateStr) {
    if (!dateStr) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);
    
    return dueDate < today;
}

// Function to check if a date is due soon (within 2 days)
function isDueSoon(dateStr) {
    if (!dateStr) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);
    
    // Not overdue but due within 2 days
    return !isOverdue(dateStr) && 
           (dueDate - today) <= (2 * 24 * 60 * 60 * 1000);
}

// Format due date for display
function formatDueDate(dateStr) {
    if (!dateStr) return '';
    
    const dueDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Format based on when it's due
    if (dueDate.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        // Format as MM/DD/YYYY or use locale formatting
        return dueDate.toLocaleDateString();
    }
}

// Check for recurring todos that need to be generated
function checkForRecurringTodos() {
    // Find completed recurring todos that need new instances
    todos.forEach(todo => {
        if (todo.completed && todo.recurring) {
            handleRecurringCompletion(todo);
        }
    });
    
    // Save any changes to storage
    saveToStorage();
    renderTodos();
    updateTasksLeft();
}

// Request notification permission from the browser
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
    }
    
    if (Notification.permission === 'granted') {
        notificationPermission = true;
        return;
    }
    
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                notificationPermission = true;
                announceToScreenReader('Notification permission granted. You will receive alerts for tasks with due dates.');
            }
        });
    }
}

// Schedule a notification for a todo
function scheduleNotification(todo) {
    if (!todo.dueDate || !todo.notifications || !todo.notifications.enabled) {
        return;
    }
    
    // Clear any existing notification timer for this todo
    clearNotification(todo.id);
    
    // Calculate when the notification should be shown
    const dueDate = new Date(todo.dueDate);
    dueDate.setHours(9, 0, 0, 0); // Default to 9 AM on the due date
    
    // Subtract the notification time (in minutes) from the due date
    const notificationTime = new Date(dueDate.getTime() - (todo.notifications.time * 60 * 1000));
    
    // If the notification time is in the past, don't schedule it
    if (notificationTime < new Date()) {
        return;
    }
    
    // Schedule the notification
    const timeUntilNotification = notificationTime.getTime() - new Date().getTime();
    
    // Store the timer ID so it can be cleared later if needed
    notificationTimers[todo.id] = setTimeout(() => {
        showNotification(todo);
    }, timeUntilNotification);
}

// Show a notification for a todo
function showNotification(todo) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }
    
    const title = `Todo: ${todo.text}`;
    let body = '';
    
    if (todo.dueDate) {
        if (isOverdue(todo.dueDate)) {
            body = `This task is overdue!`;
        } else {
            body = `Due ${formatDueDate(todo.dueDate)}`;
        }
    }
    
    const notification = new Notification(title, {
        body,
        icon: '/favicon.ico', // Use your app's favicon
        badge: '/favicon.ico',
        tag: todo.id, // Use the todo ID as the tag to avoid duplicates
        renotify: true // Notify even if there's already a notification with this tag
    });
    
    // Add click event to focus the app when the notification is clicked
    notification.onclick = function() {
        window.focus();
        // Find and highlight the todo
        const todoElement = document.querySelector(`.todo-item[data-id="${todo.id}"]`);
        if (todoElement) {
            todoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            todoElement.classList.add('highlight-pulse');
            todoElement.focus();
            
            // Remove the highlight class after animation completes
            setTimeout(() => {
                todoElement.classList.remove('highlight-pulse');
            }, 1500);
        }
    };
}

// Clear a scheduled notification
function clearNotification(todoId) {
    if (notificationTimers[todoId]) {
        clearTimeout(notificationTimers[todoId]);
        delete notificationTimers[todoId];
    }
}

// Handle notification toggle changes
function handleNotificationToggle() {
    const isEnabled = enableNotificationsCheckbox.checked;
    
    // Enable/disable notification time selection
    if (notificationTimeSelect) {
        notificationTimeSelect.disabled = !isEnabled;
    }
    
    // If enabling notifications, check for permission
    if (isEnabled && Notification.permission !== 'granted') {
        requestNotificationPermission();
    }
}

// Initialize enhanced features for the todo app
function initEnhancedFeatures() {
    // Add confetti effect for task completion
    addConfettiEffect();
    
    // Add touch and gesture support
    addTouchSupport();
    
    // Add keyboard accessibility
    addKeyboardAccessibility();
    
    // Add performance monitoring
    monitorPerformance();
    
    // Add error handling
    addErrorHandling();
    
    // Add new enhanced features
    addAnimatedTransitions();
    addVisualFeedback();
    enhanceDarkModeToggle();
    addChecklistCompletionAnimation();
}

// Add confetti effect for completed tasks
function addConfettiEffect() {
    // Create a confetti container
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    // Function to add the effect when a todo is completed
    window.addEventListener('todo-completed', (e) => {
        if (!e.detail || localStorage.getItem('muteSound') === 'true') {
            return;
        }
        
        // Create some confetti particles
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-particle';
            confetti.style.backgroundColor = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'][Math.floor(Math.random() * 5)];
            confetti.style.left = `${e.detail.x}px`;
            confetti.style.top = `${e.detail.y}px`;
            
            // Random size, rotation and speed
            const size = Math.random() * 10 + 5;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            
            // Generate random positions
            const destinationX = e.detail.x + (Math.random() - 0.5) * 200;
            const destinationY = e.detail.y + Math.random() * 100 + 50;
            
            // Create animation
            confetti.animate(
                [
                    { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
                    { transform: `translate(${destinationX - e.detail.x}px, ${destinationY - e.detail.y}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
                ], 
                {
                    duration: 1000 + Math.random() * 1000,
                    easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
                }
            );
            
            confettiContainer.appendChild(confetti);
            
            // Remove the particle when animation is complete
            setTimeout(() => {
                confetti.remove();
            }, 2000);
        }
    });
}

// Add touch support for mobile devices
function addTouchSupport() {
    let touchStartY = 0;
    let touchStartX = 0;
    
    // Add touch event listeners to todo items
    todoList?.addEventListener('touchstart', (e) => {
        // Only handle touches on todo items
        if (!e.target.closest('.todo-item')) return;
        
        const todoItem = e.target.closest('.todo-item');
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        
        // Add active state
        todoItem.classList.add('touch-active');
    }, { passive: true });
    
    todoList?.addEventListener('touchmove', (e) => {
        if (!e.target.closest('.todo-item')) return;
        
        const todoItem = e.target.closest('.todo-item');
        const touchY = e.touches[0].clientY;
        const touchX = e.touches[0].clientX;
        
        // Calculate distance moved
        const deltaY = touchY - touchStartY;
        const deltaX = touchX - touchStartX;
        
        // If swiping horizontally more than vertically
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
            // Prevent page scrolling
            e.preventDefault();
            
            // Move the item with the swipe
            todoItem.style.transform = `translateX(${deltaX}px)`;
            
            // Change appearance based on swipe distance
            if (deltaX < -80) {
                // Delete gesture
                todoItem.classList.add('swipe-delete');
                todoItem.classList.remove('swipe-complete');
            } else if (deltaX > 80) {
                // Complete gesture
                todoItem.classList.add('swipe-complete');
                todoItem.classList.remove('swipe-delete');
            } else {
                todoItem.classList.remove('swipe-delete', 'swipe-complete');
            }
        }
    });
    
    todoList?.addEventListener('touchend', (e) => {
        if (!e.target.closest('.todo-item')) return;
        
        const todoItem = e.target.closest('.todo-item');
        const todoId = todoItem.getAttribute('data-id');
        
        // Clean up visual state
        todoItem.classList.remove('touch-active');
        
        // Get the final touch position
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        
        // Handle swipe actions
        if (deltaX < -100) {
            // Delete on swipe left
            deleteTodo(todoId);
        } else if (deltaX > 100) {
            // Toggle completion on swipe right
            toggleTodo(todoId);
        } else {
            // Reset position with animation
            todoItem.style.transition = 'transform 0.3s ease';
            todoItem.style.transform = '';
            
            // Clear the transition after it completes
            setTimeout(() => {
                todoItem.style.transition = '';
                todoItem.classList.remove('swipe-delete', 'swipe-complete');
            }, 300);
        }
    });
}

// Add keyboard accessibility features
function addKeyboardAccessibility() {
    // Alt+T to toggle theme
    document.addEventListener('keydown', (e) => {
        if (e.key === 't' && e.altKey) {
            e.preventDefault();
            toggleTheme();
        } else if (e.key === 'n' && e.altKey) {
            e.preventDefault();
            // Focus on the new todo input
            todoInput?.focus();
        }
    });
    
    // Ensure all interactive elements have appropriate ARIA roles
    document.querySelectorAll('button').forEach(button => {
        if (!button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', button.textContent || 'Button');
        }
    });
}

// Implement virtual scrolling for performance with large lists
function implementVirtualScrolling() {
    if (todoList && todos.length > 100) {
        // Add a class to the list so we can add special styles
        todoList.classList.add('virtual-scroll');
        
        // Create a wrapper if it doesn't exist
        let wrapper = todoList.parentElement;
        if (!wrapper.classList.contains('todo-list-wrapper')) {
            wrapper = document.createElement('div');
            wrapper.className = 'todo-list-wrapper';
            todoList.parentNode.insertBefore(wrapper, todoList);
            wrapper.appendChild(todoList);
        }
        
        // Set a fixed height on the wrapper
        wrapper.style.height = '500px'; // Adjust based on your UI
        wrapper.style.overflowY = 'auto';
        
        // Create a function to render only visible items
        const renderVisibleTodos = debounce(() => {
            const scrollTop = wrapper.scrollTop;
            const viewportHeight = wrapper.clientHeight;
            
            // Constants for calculation
            const itemHeight = 60; // Approximate height of a todo item
            const buffer = 5; // Number of items to render above/below viewport
            
            // Calculate which items should be visible
            const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
            const endIndex = Math.min(
                todos.length - 1, 
                Math.ceil((scrollTop + viewportHeight) / itemHeight) + buffer
            );
            
            // Get filtered and sorted todos
            const filteredTodos = getFilteredTodos();
            const sortSelect = document.getElementById('sort-todos');
            const sortCriteria = sortSelect ? sortSelect.value : 'priority';
            const sortedTodos = sortTodos(filteredTodos, sortCriteria);
            
            // Clear current items
            todoList.innerHTML = '';
            
            // Create a placeholder div to maintain scroll height
            const totalHeight = sortedTodos.length * itemHeight;
            todoList.style.height = `${totalHeight}px`;
            todoList.style.position = 'relative';
            
            // Render only the visible items
            for (let i = startIndex; i <= endIndex && i < sortedTodos.length; i++) {
                const todoEl = createTodoElement(sortedTodos[i]);
                todoEl.style.position = 'absolute';
                todoEl.style.top = `${i * itemHeight}px`;
                todoEl.style.width = '100%';
                todoList.appendChild(todoEl);
            }
        }, 50);
        
        // Add scroll event listener
        wrapper.addEventListener('scroll', renderVisibleTodos);
        
        // Override renderTodos to use virtualization
        const originalRenderTodos = renderTodos;
        renderTodos = function() {
            if (todos.length > 100) {
                // Use virtual scrolling
                renderVisibleTodos();
            } else {
                // Use normal rendering for smaller lists
                originalRenderTodos();
            }
        };
    }
}

// Add infinite scroll implementation for large lists
function addInfiniteScroll() {
    const todoListContainer = todoList?.parentElement;
    if (!todoListContainer) return;
    
    // Initial load count
    let displayLimit = 30;
    const loadMoreThreshold = 200; // px from bottom to trigger load more
    
    // Create "load more" button
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'load-more-btn';
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.style.display = 'none';
    todoListContainer.after(loadMoreBtn);
    
    // Override renderTodos for pagination
    const originalRenderTodos = renderTodos;
    renderTodos = function() {
        // Get all filtered and sorted todos
        const filteredTodos = getFilteredTodos();
        const sortSelect = document.getElementById('sort-todos');
        const sortCriteria = sortSelect ? sortSelect.value : 'priority';
        const sortedTodos = sortTodos(filteredTodos, sortCriteria);
        
        // If small number of todos, just use normal rendering
        if (sortedTodos.length <= 50) {
            originalRenderTodos();
            loadMoreBtn.style.display = 'none';
            return;
        }
        
        // Clear current list
        todoList.innerHTML = '';
        
        // Only display limited number of todos
        const todosToRender = sortedTodos.slice(0, displayLimit);
        
        // Create and add todo elements
        const fragment = document.createDocumentFragment();
        todosToRender.forEach(todo => {
            const todoEl = createTodoElement(todo);
            fragment.appendChild(todoEl);
        });
        
        todoList.appendChild(fragment);
        
        // Update the load more button
        if (displayLimit < sortedTodos.length) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.textContent = `Load More (${sortedTodos.length - displayLimit} remaining)`;
        } else {
            loadMoreBtn.style.display = 'none';
        }
        
        // Update tasks left count
        updateTasksLeft();
    };
    
    // Add scroll handler for automatic loading
    todoListContainer.addEventListener('scroll', () => {
        const scrollPosition = todoListContainer.scrollTop + todoListContainer.clientHeight;
        const scrollHeight = todoListContainer.scrollHeight;
        
        if (scrollHeight - scrollPosition < loadMoreThreshold && loadMoreBtn.style.display !== 'none') {
            // Load more when near the bottom
            loadMore();
        }
    });
    
    // Load more function
    function loadMore() {
        displayLimit += 20; // Increase by 20 each time
        renderTodos();
        
        // Announce to screen readers
        announceToScreenReader(`Loaded more tasks. Now showing ${displayLimit} tasks.`);
    }
    
    // Add click handler for the button
    loadMoreBtn.addEventListener('click', loadMore);
}

// Enhance UI elements with subtle effects and improved usability
function enhanceUIElements() {
    // Add subtle hover effects to interactive elements
    const style = document.createElement('style');
    style.textContent = `
        .todo-item {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .todo-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .todo-checkbox {
            transition: transform 0.2s ease;
        }
        .todo-checkbox:hover {
            transform: scale(1.1);
        }
        button:not(.todo-checkbox) {
            position: relative;
            overflow: hidden;
        }
        button:not(.todo-checkbox)::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 5px;
            height: 5px;
            background: rgba(255,255,255,0.5);
            opacity: 0;
            border-radius: 100%;
            transform: scale(1, 1) translate(-50%, -50%);
            transform-origin: 50% 50%;
        }
        button:not(.todo-checkbox):focus::after,
        button:not(.todo-checkbox):active::after {
            animation: ripple 0.6s ease-out;
        }
        @keyframes ripple {
            0% {
                transform: scale(0, 0) translate(-50%, -50%);
                opacity: 0.5;
            }
            100% {
                transform: scale(20, 20) translate(-50%, -50%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add focus styles for keyboard users
    document.querySelectorAll('button, input, select').forEach(el => {
        el.addEventListener('focus', () => {
            el.classList.add('keyboard-focus');
        });
        
        el.addEventListener('blur', () => {
            el.classList.remove('keyboard-focus');
        });
        
        // Remove focus class on mouse down to differentiate mouse and keyboard focus
        el.addEventListener('mousedown', () => {
            el.classList.remove('keyboard-focus');
        });
    });
    
    // Make buttons more responsive by providing visual feedback
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            
            // Set position based on click coordinates
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            
            // Add to button and then remove after animation
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add progress indicator for tasks completion
    const tasksProgressContainer = document.createElement('div');
    tasksProgressContainer.className = 'tasks-progress-container';
    
    const tasksProgress = document.createElement('div');
    tasksProgress.className = 'tasks-progress';
    
    tasksProgressContainer.appendChild(tasksProgress);
    
    if (tasksLeftEl) {
        tasksLeftEl.parentNode.insertBefore(tasksProgressContainer, tasksLeftEl.nextSibling);
    }
    
    // Update progress bar when tasks change
    const updateProgress = () => {
        const totalTasks = todos.length;
        const completedTasks = todos.filter(todo => todo.completed).length;
        
        if (totalTasks > 0) {
            const percentage = (completedTasks / totalTasks) * 100;
            tasksProgress.style.width = `${percentage}%`;
            tasksProgress.setAttribute('aria-valuenow', percentage);
        } else {
            tasksProgress.style.width = '0%';
            tasksProgress.setAttribute('aria-valuenow', 0);
        }
    };
    
    // Override functions that modify tasks to update progress
    const originalRenderTodos = renderTodos;
    renderTodos = function() {
        originalRenderTodos();
        updateProgress();
    };
}

// Add animated transitions for todos
function addAnimatedTransitions() {
    // Create style element for animations
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .todo-item {
            transition: transform 0.3s ease, opacity 0.3s ease, background-color 0.3s ease;
            animation: fadeIn 0.3s ease forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .todo-item.completing {
            animation: completeTask 0.5s ease forwards;
        }
        
        @keyframes completeTask {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); background-color: var(--success-color-light); }
            100% { transform: scale(1); }
        }
        
        .todo-checkbox {
            transition: transform 0.2s ease, background-color 0.3s ease;
        }
        
        .todo-checkbox:hover {
            transform: scale(1.1);
        }
        
        .todo-item .todo-text {
            transition: text-decoration 0.3s ease, opacity 0.3s ease;
        }
        
        .highlight-pulse {
            animation: highlightPulse 1.5s ease;
        }
        
        @keyframes highlightPulse {
            0% { background-color: transparent; }
            25% { background-color: var(--highlight-color); }
            100% { background-color: transparent; }
        }
        
        .form-reset {
            animation: formReset 0.5s ease;
        }
        
        @keyframes formReset {
            0% { transform: scale(1); }
            50% { transform: scale(0.98); }
            100% { transform: scale(1); }
        }
        
        /* Ripple effect for buttons */
        .ripple-effect {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        /* Progress indicator */
        .tasks-progress-container {
            height: 4px;
            background-color: var(--background-color-secondary);
            margin: 8px 0;
            border-radius: 2px;
            overflow: hidden;
        }
        
        .tasks-progress {
            height: 100%;
            background-color: var(--primary-color);
            transition: width 0.5s ease;
            width: 0%;
        }
        
        /* Improved focus styles */
        .keyboard-focus {
            outline: 3px solid var(--highlight-color) !important;
            outline-offset: 2px !important;
        }
    `;
    
    document.head.appendChild(styleEl);
}

// Add visual feedback for user actions
function addVisualFeedback() {
    // Add a toast notification system
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
    
    // Global function to show toast notifications
    window.showToast = function(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'toast-progress';
        toast.appendChild(progressBar);
        
        toastContainer.appendChild(toast);
        
        // Animate the progress bar
        progressBar.style.transition = `width ${duration}ms linear`;
        
        // Force reflow to ensure animation starts
        progressBar.getBoundingClientRect();
        
        progressBar.style.width = '0%';
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
        
        return toast;
    };
    
    // Add toast styles
    const toastStyles = document.createElement('style');
    toastStyles.textContent = `
        .toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .toast {
            min-width: 250px;
            padding: 15px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            color: white;
            position: relative;
            overflow: hidden;
            animation: toast-in 0.3s ease forwards;
        }
        
        .toast-hide {
            animation: toast-out 0.3s ease forwards;
        }
        
        @keyframes toast-in {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes toast-out {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .toast-info {
            background-color: var(--primary-color);
        }
        
        .toast-success {
            background-color: var(--success-color);
        }
        
        .toast-error {
            background-color: var(--error-color);
        }
        
        .toast-warning {
            background-color: var(--warning-color);
        }
        
        .toast-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            width: 100%;
            background-color: rgba(255,255,255,0.3);
        }
    `;
    
    document.head.appendChild(toastStyles);
    
    // Override key functions to add visual feedback
    const originalToggleTodo = toggleTodo;
    toggleTodo = function(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            const newState = !todo.completed;
            
            originalToggleTodo(id);
            
            if (newState) {
                showToast(`✓ Completed: ${todo.text}`, 'success', 2000);
            }
        } else {
            originalToggleTodo(id);
        }
    };
    
    const originalDeleteTodo = deleteTodo;
    deleteTodo = function(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            const message = `🗑️ Deleted: ${todo.text}`;
            originalDeleteTodo(id);
            showToast(message, 'info', 2000);
        } else {
            originalDeleteTodo(id);
        }
    };
    
    const originalAddTodo = addTodo;
    addTodo = function(e) {
        const todoText = todoInput.value.trim();
        if (todoText) {
            originalAddTodo(e);
            showToast(`✚ Added: ${todoText}`, 'success', 2000);
        } else {
            originalAddTodo(e);
        }
    };
}

// Add dark mode toggle animation
function enhanceDarkModeToggle() {
    if (!themeToggle) return;
    
    // Replace existing toggle with a more animated version
    const newToggle = document.createElement('button');
    newToggle.id = 'theme-toggle';
    newToggle.className = 'theme-toggle-enhanced';
    
    // Get current theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    // Set initial state
    newToggle.innerHTML = `
        <div class="toggle-track">
            <div class="toggle-sun"><i class="fas fa-sun"></i></div>
            <div class="toggle-moon"><i class="fas fa-moon"></i></div>
            <div class="toggle-thumb"></div>
        </div>
    `;
    
    // Add the active class if dark mode is on
    if (currentTheme === 'dark') {
        newToggle.classList.add('active');
    }
    
    // Replace the old toggle
    themeToggle.parentNode.replaceChild(newToggle, themeToggle);
    
    // Update the DOM reference
    themeToggle = newToggle;
    
    // Add toggle event
    themeToggle.addEventListener('click', toggleTheme);
    
    // Add styles
    const toggleStyles = document.createElement('style');
    toggleStyles.textContent = `
        .theme-toggle-enhanced {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            outline: none;
            width: 50px;
            height: 24px;
        }
        
        .toggle-track {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: var(--background-color-secondary);
            border-radius: 12px;
            transition: background-color 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 5px;
        }
        
        .theme-toggle-enhanced.active .toggle-track {
            background-color: var(--primary-color-light);
        }
        
        .toggle-sun, .toggle-moon {
            font-size: 14px;
            color: var(--text-color-secondary);
            z-index: 1;
        }
        
        .toggle-thumb {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background-color: white;
            border-radius: 50%;
            transition: transform 0.3s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .theme-toggle-enhanced.active .toggle-thumb {
            transform: translateX(26px);
        }
    `;
    
    document.head.appendChild(toggleStyles);
    
    // Override the theme toggle function
    const originalToggleTheme = toggleTheme;
    toggleTheme = function() {
        originalToggleTheme();
        
        // Update the toggle state
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        if (currentTheme === 'dark') {
            themeToggle.classList.add('active');
        } else {
            themeToggle.classList.remove('active');
        }
    };
}

// Add checklist completion animation
function addChecklistCompletionAnimation() {
    // Add style for checklist animation
    const checklistStyle = document.createElement('style');
    checklistStyle.textContent = `
        .todo-checkbox .checkbox-icon {
            position: relative;
        }
        
        .todo-checkbox .checkbox-icon::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background-color: var(--success-color-light);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            opacity: 0;
            z-index: -1;
        }
        
        .todo-item.completing .todo-checkbox .checkbox-icon::before {
            animation: checkbox-pulse 0.5s ease-out;
        }
        
        @keyframes checkbox-pulse {
            0% { width: 0; height: 0; opacity: 0.8; }
            100% { width: 40px; height: 40px; opacity: 0; }
        }
        
        .todo-checkbox .checkmark {
            stroke-dasharray: 20;
            stroke-dashoffset: 20;
            transition: stroke-dashoffset 0.3s ease;
        }
        
        .todo-item.completed .todo-checkbox .checkmark {
            stroke-dashoffset: 0;
        }
    `;
    
    document.head.appendChild(checklistStyle);
    
    // Update the checkbox creation in createTodoElement
    const originalCreateTodoElement = createTodoElement;
    createTodoElement = function(todo) {
        const todoEl = originalCreateTodoElement(todo);
        
        // Replace the checkbox content with SVG for animation
        const checkbox = todoEl.querySelector('.todo-checkbox');
        if (checkbox) {
            checkbox.innerHTML = `
                <span class="checkbox-icon">
                    ${todo.completed ? `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path class="checkmark" d="M5 12l5 5L20 7" />
                        </svg>
                    ` : ''}
                </span>
            `;
        }
        
        return todoEl;
    };
}

// Add smart task grouping and enhanced filtering
function addSmartTaskGrouping() {
    // Create filter controls container if it doesn't exist
    let filterControlsContainer = document.querySelector('.filter-controls');
    if (!filterControlsContainer) {
        filterControlsContainer = document.createElement('div');
        filterControlsContainer.className = 'filter-controls';
        
        // Find appropriate location to insert
        const todoApp = document.querySelector('.todo-app');
        const todoListContainer = document.querySelector('.todo-list-container');
        
        if (todoListContainer) {
            todoListContainer.before(filterControlsContainer);
        } else if (todoApp) {
            const todoHeader = todoApp.querySelector('header') || todoApp.querySelector('h1').parentNode;
            todoHeader.after(filterControlsContainer);
        } else {
            // Fallback to adding after todo form
            todoForm.after(filterControlsContainer);
        }
    }
    
    // Add grouping options
    const groupingControl = document.createElement('div');
    groupingControl.className = 'grouping-control';
    groupingControl.innerHTML = `
        <label for="group-by">Group by:</label>
        <select id="group-by" class="enhanced">
            <option value="none">None</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="recurring">Recurring Status</option>
        </select>
    `;
    
    // Add enhanced filter options
    const filterControl = document.createElement('div');
    filterControl.className = 'filter-control';
    filterControl.innerHTML = `
        <button id="filter-dropdown-btn" class="filter-dropdown-btn enhanced">
            <i class="fas fa-filter"></i> Filter
            <i class="fas fa-chevron-down"></i>
        </button>
        <div id="filter-dropdown" class="filter-dropdown" style="display: none;">
            <div class="filter-section">
                <h4>Status</h4>
                <div class="filter-option">
                    <input type="checkbox" id="filter-active" checked>
                    <label for="filter-active">Active</label>
                </div>
                <div class="filter-option">
                    <input type="checkbox" id="filter-completed" checked>
                    <label for="filter-completed">Completed</label>
                </div>
            </div>
            <div class="filter-section">
                <h4>Priority</h4>
                <div class="filter-option">
                    <input type="checkbox" id="filter-high" checked>
                    <label for="filter-high">High</label>
                </div>
                <div class="filter-option">
                    <input type="checkbox" id="filter-normal" checked>
                    <label for="filter-normal">Normal</label>
                </div>
                <div class="filter-option">
                    <input type="checkbox" id="filter-low" checked>
                    <label for="filter-low">Low</label>
                </div>
            </div>
            <div class="filter-section">
                <h4>Due Date</h4>
                <div class="filter-option">
                    <input type="checkbox" id="filter-overdue" checked>
                    <label for="filter-overdue">Overdue</label>
                </div>
                <div class="filter-option">
                    <input type="checkbox" id="filter-due-soon" checked>
                    <label for="filter-due-soon">Due Soon</label>
                </div>
                <div class="filter-option">
                    <input type="checkbox" id="filter-future" checked>
                    <label for="filter-future">Future</label>
                </div>
                <div class="filter-option">
                    <input type="checkbox" id="filter-no-date" checked>
                    <label for="filter-no-date">No Date</label>
                </div>
            </div>
            <div class="filter-section">
                <h4>Other</h4>
                <div class="filter-option">
                    <input type="checkbox" id="filter-recurring" checked>
                    <label for="filter-recurring">Recurring</label>
                </div>
                <div class="filter-option">
                    <input type="checkbox" id="filter-with-notifications" checked>
                    <label for="filter-with-notifications">With Notifications</label>
                </div>
            </div>
            <div class="filter-actions">
                <button id="apply-filters" class="primary-btn">Apply</button>
                <button id="reset-filters">Reset</button>
            </div>
        </div>
    `;
    
    // Add styles for new controls
    const controlStyles = document.createElement('style');
    controlStyles.textContent = `
        .filter-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            margin-top: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .grouping-control, .filter-control {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .filter-dropdown-btn {
            display: flex;
            align-items: center;
            gap: 5px;
            background-color: var(--background-color-secondary);
            border: 1px solid var(--border-color);
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .filter-dropdown-btn:hover {
            background-color: var(--hover-color);
        }
        
        .filter-dropdown {
            position: absolute;
            background-color: var(--background-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 15px;
            z-index: 100;
            width: 250px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .filter-section {
            margin-bottom: 15px;
        }
        
        .filter-section h4 {
            margin-top: 0;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .filter-option {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        
        .filter-option input {
            margin-right: 8px;
        }
        
        .filter-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
        }
        
        .todo-group {
            margin-bottom: 20px;
        }
        
        .todo-group-header {
            padding: 8px 10px;
            background-color: var(--background-color-secondary);
            border-radius: 4px;
            margin-bottom: 8px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .todo-group-header .group-count {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .todo-group-header.priority-high {
            background-color: var(--priority-high-bg);
            color: var(--priority-high);
        }
        
        .todo-group-header.priority-low {
            background-color: var(--priority-low-bg);
            color: var(--priority-low);
        }
        
        .todo-group-header.overdue {
            background-color: var(--error-color-light);
            color: var(--error-color-dark);
        }
        
        .todo-group-header.due-soon {
            background-color: var(--warning-color-light);
            color: var(--warning-color-dark);
        }
        
        .todo-group-collapse {
            cursor: pointer;
            margin-left: 5px;
            transition: transform 0.3s;
        }
        
        .todo-group-collapsed .todo-group-collapse {
            transform: rotate(-90deg);
        }
        
        .todo-group-collapsed .todo-group-items {
            display: none;
        }
    `;
    
    document.head.appendChild(controlStyles);
    
    // Add controls to container
    filterControlsContainer.appendChild(groupingControl);
    filterControlsContainer.appendChild(filterControl);
    
    // Add event listeners
    const groupBySelect = document.getElementById('group-by');
    if (groupBySelect) {
        groupBySelect.addEventListener('change', function() {
            localStorage.setItem('groupBy', this.value);
            renderTodos();
        });
        
        // Set initial value from localStorage
        const savedGrouping = localStorage.getItem('groupBy');
        if (savedGrouping) {
            groupBySelect.value = savedGrouping;
        }
    }
    
    // Updated filter dropdown toggle for better UX
    const filterDropdownBtn = document.getElementById('filter-dropdown-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    
    if (filterDropdownBtn && filterDropdown) {
        // Improve dropdown positioning to avoid popup issues
        filterDropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            const isVisible = filterDropdown.style.display !== 'none';
            
            // Toggle display with animation
            if (isVisible) {
                filterDropdown.classList.remove('show');
                setTimeout(() => {
                    filterDropdown.style.display = 'none';
                }, 200);
            } else {
                filterDropdown.style.display = 'block';
                // Use requestAnimationFrame to ensure display change takes effect first
                requestAnimationFrame(() => {
                    filterDropdown.classList.add('show');
                });
                
                // Position the dropdown relative to its parent container
                // instead of using absolute positioning based on viewport
                filterDropdown.style.top = '100%';
                filterDropdown.style.left = '0';
                filterDropdown.style.width = '100%';
                filterDropdown.style.maxHeight = '350px';
                
                // Ensure it's visible on screen
                const dropdownRect = filterDropdown.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                
                if (dropdownRect.bottom > viewportHeight) {
                    // If it goes off-screen, position it above the button
                    filterDropdown.style.top = 'auto';
                    filterDropdown.style.bottom = '100%';
                }
            }
            
            // Toggle active state of button
            filterDropdownBtn.classList.toggle('active', !isVisible);
            filterDropdownBtn.setAttribute('aria-expanded', !isVisible);
        });
        
        // Improved accessibility
        filterDropdownBtn.setAttribute('aria-haspopup', 'true');
        filterDropdownBtn.setAttribute('aria-expanded', 'false');
        filterDropdown.setAttribute('role', 'menu');
        
        // Improved close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (filterDropdown.style.display !== 'none' && 
                !filterDropdownBtn.contains(e.target) && 
                !filterDropdown.contains(e.target)) {
                
                filterDropdown.classList.remove('show');
                filterDropdownBtn.classList.remove('active');
                filterDropdownBtn.setAttribute('aria-expanded', 'false');
                
                setTimeout(() => {
                    filterDropdown.style.display = 'none';
                }, 200);
            }
        });
        
        // Add keyboard accessibility
        filterDropdownBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                if (filterDropdown.style.display === 'none') {
                    filterDropdownBtn.click();
                    
                    // Focus the first checkbox
                    setTimeout(() => {
                        filterDropdown.querySelector('input[type="checkbox"]')?.focus();
                    }, 100);
                }
            }
            
            if (e.key === 'Escape' && filterDropdown.style.display !== 'none') {
                filterDropdownBtn.click();
            }
        });
        
        // Add keyboard navigation within dropdown
        filterDropdown.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                filterDropdownBtn.click();
                filterDropdownBtn.focus();
            }
            
            if (e.key === 'Tab' && !e.shiftKey) {
                const focusableElements = filterDropdown.querySelectorAll('input, button');
                const lastElement = focusableElements[focusableElements.length - 1];
                
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    filterDropdownBtn.focus();
                }
            }
        });
    }
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            // Save filter state
            const filters = {
                status: {
                    active: document.getElementById('filter-active').checked,
                    completed: document.getElementById('filter-completed').checked
                },
                priority: {
                    high: document.getElementById('filter-high').checked,
                    normal: document.getElementById('filter-normal').checked,
                    low: document.getElementById('filter-low').checked
                },
                dueDate: {
                    overdue: document.getElementById('filter-overdue').checked,
                    dueSoon: document.getElementById('filter-due-soon').checked,
                    future: document.getElementById('filter-future').checked,
                    noDate: document.getElementById('filter-no-date').checked
                },
                other: {
                    recurring: document.getElementById('filter-recurring').checked,
                    withNotifications: document.getElementById('filter-with-notifications').checked
                }
            };
            
            localStorage.setItem('advancedFilters', JSON.stringify(filters));
            filterDropdown.style.display = 'none';
            renderTodos();
            
            // Show feedback toast
            if (window.showToast) {
                showToast('Filters applied', 'info', 2000);
            }
        });
    }
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            // Reset all checkboxes to checked
            filterDropdown.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = true;
            });
            
            // Clear saved filters
            localStorage.removeItem('advancedFilters');
            
            // Update the UI
            filterDropdown.style.display = 'none';
            renderTodos();
            
            // Show feedback
            if (window.showToast) {
                showToast('Filters reset', 'info', 2000);
            }
        });
    }
    
    // Load saved filters on initialization
    const savedFilters = localStorage.getItem('advancedFilters');
    if (savedFilters) {
        try {
            const filters = JSON.parse(savedFilters);
            
            // Apply saved filter states
            if (filters.status) {
                document.getElementById('filter-active').checked = filters.status.active;
                document.getElementById('filter-completed').checked = filters.status.completed;
            }
            
            if (filters.priority) {
                document.getElementById('filter-high').checked = filters.priority.high;
                document.getElementById('filter-normal').checked = filters.priority.normal;
                document.getElementById('filter-low').checked = filters.priority.low;
            }
            
            if (filters.dueDate) {
                document.getElementById('filter-overdue').checked = filters.dueDate.overdue;
                document.getElementById('filter-due-soon').checked = filters.dueDate.dueSoon;
                document.getElementById('filter-future').checked = filters.dueDate.future;
                document.getElementById('filter-no-date').checked = filters.dueDate.noDate;
            }
            
            if (filters.other) {
                document.getElementById('filter-recurring').checked = filters.other.recurring;
                document.getElementById('filter-with-notifications').checked = filters.other.withNotifications;
            }
        } catch (error) {
            console.error('Error loading saved filters:', error);
            // Reset filters in case of parse error
            localStorage.removeItem('advancedFilters');
        }
    }
}

// Screenshot functionality
async function captureScreenshot() {
    try {
        // Create a feedback element
        const feedback = document.createElement('div');
        feedback.className = 'screenshot-feedback';
        feedback.innerHTML = `
            <div class="screenshot-overlay">
                <div class="screenshot-message">
                    <i class="fas fa-camera"></i>
                    <span>Capturing screenshot...</span>
                </div>
            </div>
        `;
        document.body.appendChild(feedback);

        // Trigger the native screenshot API if available
        if ('mediaDevices' in navigator) {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const videoTrack = stream.getVideoTracks()[0];
            
            // Capture the frame
            const imageCapture = new ImageCapture(videoTrack);
            const bitmap = await imageCapture.grabFrame();
            
            // Convert to blob
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const context = canvas.getContext('2d');
            context.drawImage(bitmap, 0, 0);
            
            // Save the image
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `todo-app-screenshot-${new Date().toISOString().slice(0,10)}.png`;
                a.click();
                URL.revokeObjectURL(url);
            });

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            
            // Show success message
            showToast('Screenshot saved successfully!', 'success');
        } else {
            showToast('Screenshot feature not supported in your browser', 'error');
        }
    } catch (error) {
        console.error('Screenshot error:', error);
        showToast('Failed to capture screenshot', 'error');
    } finally {
        // Remove feedback element
        const feedback = document.querySelector('.screenshot-feedback');
        if (feedback) {
            feedback.remove();
        }
    }
}

// Add screenshot button to header
function addScreenshotButton() {
    const header = document.querySelector('header');
    if (header) {
        const screenshotBtn = document.createElement('button');
        screenshotBtn.className = 'screenshot-btn';
        screenshotBtn.innerHTML = '<i class="fas fa-camera"></i>';
        screenshotBtn.setAttribute('aria-label', 'Take screenshot');
        screenshotBtn.setAttribute('title', 'Take screenshot');
        
        screenshotBtn.addEventListener('click', captureScreenshot);
        header.appendChild(screenshotBtn);
    }
}

// Initialize screenshot feature
document.addEventListener('DOMContentLoaded', () => {
    addScreenshotButton();
});

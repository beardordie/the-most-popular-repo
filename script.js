/**
 * Ephemeral To-Do List
 * A task list that actively fights procrastination by erasing itself
 */

// ========================================
// Configuration
// ========================================

const CONFIG = {
  STORAGE_KEY: 'ephemeral_tasks',
  ARCHIVE_KEY: 'ephemeral_archive',
  DESTRUCTION_TIME: 5000, // 5 seconds in ms
  UPDATE_INTERVAL: 50,    // Update UI every 50ms for smooth countdown
  SNOOZE_DURATION: 60000,  // 60 seconds snooze
  TIMER_THRESHOLDS: {
    WARNING: 0.5,  // 50% remaining - yellow
    DANGER: 0.2   // 20% remaining - red
  }
};

// ========================================
// DOM Elements
// ========================================

const elements = {
  form: document.getElementById('task-form'),
  input: document.getElementById('task-input'),
  lifespanSelect: document.getElementById('lifespan-select'),
  taskList: document.getElementById('task-list'),
  archiveToggle: document.getElementById('archive-toggle'),
  archiveSection: document.getElementById('archive-section'),
  archiveList: document.getElementById('archive-list')
};

// ========================================
// State Management
// ========================================

/**
 * Get all tasks from sessionStorage
 * @returns {Array} Array of task objects
 */
function getTasks() {
  try {
    const stored = sessionStorage.getItem(CONFIG.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading tasks from storage:', error);
    return [];
  }
}

/**
 * Save tasks to sessionStorage
 * @param {Array} tasks - Array of task objects
 */
function saveTasks(tasks) {
  try {
    sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to storage:', error);
  }
}

/**
 * Get all archived tasks from sessionStorage
 * @returns {Array} Array of archived task objects
 */
function getArchivedTasks() {
  try {
    const stored = sessionStorage.getItem(CONFIG.ARCHIVE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading archived tasks from storage:', error);
    return [];
  }
}

/**
 * Save archived tasks to sessionStorage
 * @param {Array} tasks - Array of archived task objects
 */
function saveArchivedTasks(tasks) {
  try {
    sessionStorage.setItem(CONFIG.ARCHIVE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving archived tasks to storage:', error);
  }
}

/**
 * Generate a unique ID for a task
 * @returns {string} Unique identifier
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Create a new task object
 * @param {string} text - Task description
 * @param {number} lifespanSeconds - Lifespan in seconds
 * @returns {Object} Task object
 */
function createTask(text, lifespanSeconds) {
  const now = Date.now();
  return {
    id: generateId(),
    text: text.trim(),
    expiresAt: now + (lifespanSeconds * 1000),
    totalDuration: lifespanSeconds * 1000,
    status: 'alive'
  };
}

// ========================================
// UI Rendering
// ========================================

/**
 * Format time remaining as MM:SS.ms
 * @param {number} remainingMs - Remaining time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(remainingMs) {
  if (remainingMs <= 0) return '00:00.0';
  
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((remainingMs % 1000) / 100);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms}`;
}

/**
 * Get countdown color class based on remaining time percentage
 * @param {number} remainingMs - Remaining time in milliseconds
 * @param {number} totalMs - Total duration in milliseconds
 * @returns {string} CSS class name
 */
function getCountdownClass(remainingMs, totalMs) {
  if (totalMs <= 0) return 'danger';
  
  const percentage = remainingMs / totalMs;
  
  if (percentage <= CONFIG.TIMER_THRESHOLDS.DANGER) {
    return 'danger';
  } else if (percentage <= CONFIG.TIMER_THRESHOLDS.WARNING) {
    return 'warning';
  }
  return 'healthy';
}

/**
 * Split text into character spans for disintegration animation
 * @param {string} text - Task text
 * @returns {string} HTML string with character spans
 */
function splitTextIntoChars(text) {
  return text.split('').map(char => {
    if (char === ' ') {
      return '<span class="char char-space"></span>';
    }
    return `<span class="char">${char}</span>`;
  }).join('');
}

/**
 * Render a single task item
 * @param {Object} task - Task object
 * @returns {HTMLElement} Task list item element
 */
function renderTask(task) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.taskId = task.id;
  
  // Checkbox for manual completion
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.title = 'Mark as complete';
  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      handleManualComplete(task.id);
    }
  });
  
  const textSpan = document.createElement('span');
  textSpan.className = 'task-text';
  textSpan.innerHTML = splitTextIntoChars(task.text);
  
  const countdownSpan = document.createElement('span');
  countdownSpan.className = 'countdown healthy';
  countdownSpan.dataset.countdown = task.id;
  
  // Snooze button
  const snoozeBtn = document.createElement('button');
  snoozeBtn.className = 'snooze-btn';
  snoozeBtn.title = 'Snooze (+60 seconds)';
  snoozeBtn.textContent = '⏰';
  snoozeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleSnooze(task.id);
  });
  
  li.appendChild(checkbox);
  li.appendChild(textSpan);
  li.appendChild(countdownSpan);
  li.appendChild(snoozeBtn);
  
  return li;
}

/**
 * Render all active tasks to the DOM
 * @param {Array} tasks - Array of task objects
 */
function renderTasks(tasks) {
  elements.taskList.innerHTML = '';
  
  if (tasks.length === 0) {
    return;
  }
  
  // Sort tasks by expiration time (earliest first)
  const sortedTasks = [...tasks].sort((a, b) => a.expiresAt - b.expiresAt);
  
  sortedTasks.forEach(task => {
    const taskElement = renderTask(task);
    elements.taskList.appendChild(taskElement);
  });
}

/**
 * Render an archived task item
 * @param {Object} task - Archived task object
 * @returns {HTMLElement} Archived task list item element
 */
function renderArchivedTask(task) {
  const li = document.createElement('li');
  li.className = 'archive-item';
  li.dataset.taskId = task.id;
  
  const textSpan = document.createElement('span');
  textSpan.className = 'archive-task-text';
  textSpan.textContent = task.text;
  
  const originalDuration = Math.round(task.totalDuration / 60000);
  const durationSpan = document.createElement('span');
  durationSpan.className = 'archive-duration';
  durationSpan.textContent = `${originalDuration} min`;
  
  // Revive button
  const reviveBtn = document.createElement('button');
  reviveBtn.className = 'revive-btn';
  reviveBtn.title = 'Revive task';
  reviveBtn.textContent = '♻️';
  reviveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleRevive(task.id);
  });
  
  li.appendChild(textSpan);
  li.appendChild(durationSpan);
  li.appendChild(reviveBtn);
  
  return li;
}

/**
 * Render all archived tasks to the DOM
 * @param {Array} tasks - Array of archived task objects
 */
function renderArchivedTasks(tasks) {
  elements.archiveList.innerHTML = '';
  
  if (tasks.length === 0) {
    elements.archiveList.innerHTML = '<li class="archive-empty">No archived tasks</li>';
    return;
  }
  
  tasks.forEach(task => {
    const taskElement = renderArchivedTask(task);
    elements.archiveList.appendChild(taskElement);
  });
}

/**
 * Update countdown display for a task
 * @param {string} taskId - Task ID
 * @param {number} remainingMs - Remaining time in milliseconds
 * @param {number} totalMs - Total duration in milliseconds
 */
function updateCountdown(taskId, remainingMs, totalMs) {
  const countdownElement = document.querySelector(`[data-countdown="${taskId}"]`);
  if (!countdownElement) return;
  
  countdownElement.textContent = formatTime(remainingMs);
  
  // Update color class
  countdownElement.classList.remove('healthy', 'warning', 'danger');
  countdownElement.classList.add(getCountdownClass(remainingMs, totalMs));
}

// ========================================
// Task Management
// ========================================

/**
 * Add a new task
 * @param {string} text - Task description
 * @param {number} lifespanSeconds - Lifespan in seconds
 */
function addTask(text, lifespanSeconds) {
  const tasks = getTasks();
  const newTask = createTask(text, lifespanSeconds);
  tasks.push(newTask);
  saveTasks(tasks);
  
  // Add to DOM
  const taskElement = renderTask(newTask);
  elements.taskList.appendChild(taskElement);
  
  // Clear input
  elements.input.value = '';
  elements.input.focus();
}

/**
 * Remove a task from storage and DOM
 * @param {string} taskId - Task ID to remove
 */
function removeTask(taskId) {
  let tasks = getTasks();
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks(tasks);
  
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskElement) {
    taskElement.remove();
  }
}

/**
 * Archive a task instead of removing it
 * @param {string} taskId - Task ID to archive
 */
function archiveTask(taskId) {
  const tasks = getTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) return;
  
  const task = tasks[taskIndex];
  
  // Remove from active tasks
  tasks.splice(taskIndex, 1);
  saveTasks(tasks);
  
  // Add to archive
  const archivedTasks = getArchivedTasks();
  archivedTasks.push({
    ...task,
    status: 'archived',
    archivedAt: Date.now()
  });
  saveArchivedTasks(archivedTasks);
  
  // Remove from DOM
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskElement) {
    taskElement.remove();
  }
  
  // Update archive display if visible
  renderArchivedTasks(getArchivedTasks());
}

/**
 * Handle manual completion via checkbox
 * @param {string} taskId - Task ID to complete
 */
function handleManualComplete(taskId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return;
  
  // Snap timer to 0 to trigger immediate destruction
  task.expiresAt = Date.now();
  saveTasks(tasks);
  
  // Start destruction immediately
  startDestruction(task);
}

/**
 * Handle snooze button click - add 60 seconds to timer
 * @param {string} taskId - Task ID to snooze
 */
function handleSnooze(taskId) {
  const tasks = getTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) return;
  
  // Add 60 seconds to the timer
  tasks[taskIndex].expiresAt += CONFIG.SNOOZE_DURATION;
  saveTasks(tasks);
  
  // Update the countdown display immediately
  const remainingMs = tasks[taskIndex].expiresAt - Date.now();
  updateCountdown(taskId, remainingMs, tasks[taskIndex].totalDuration);
}

/**
 * Handle revive button click - restore archived task
 * @param {string} taskId - Task ID to revive
 */
function handleRevive(taskId) {
  const archivedTasks = getArchivedTasks();
  const taskIndex = archivedTasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) return;
  
  const task = archivedTasks[taskIndex];
  
  // Remove from archive
  archivedTasks.splice(taskIndex, 1);
  saveArchivedTasks(archivedTasks);
  
  // Add back to active tasks with original duration
  const tasks = getTasks();
  const now = Date.now();
  const revivedTask = {
    ...task,
    status: 'alive',
    expiresAt: now + task.totalDuration,
    revivedAt: now
  };
  tasks.push(revivedTask);
  saveTasks(tasks);
  
  // Add to DOM
  const taskElement = renderTask(revivedTask);
  elements.taskList.appendChild(taskElement);
  
  // Update archive display
  renderArchivedTasks(getArchivedTasks());
}

/**
 * Handle archive toggle button click
 */
function handleArchiveToggle() {
  elements.archiveSection.classList.toggle('hidden');
  const isVisible = !elements.archiveSection.classList.contains('hidden');
  elements.archiveToggle.textContent = isVisible ? '📂' : '📁';
  
  if (isVisible) {
    renderArchivedTasks(getArchivedTasks());
  }
}

/**
 * Start the destruction process for a task
 * @param {Object} task - Task object
 */
function startDestruction(task) {
  // Update task status
  const tasks = getTasks();
  const taskIndex = tasks.findIndex(t => t.id === task.id);
  if (taskIndex !== -1) {
    tasks[taskIndex].status = 'destroying';
    saveTasks(tasks);
  }
  
  const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
  if (!taskElement) return;
  
  // Add destroying class
  taskElement.classList.add('destroying');
  
  // Calculate delays for each character
  const chars = taskElement.querySelectorAll('.char');
  const charArray = Array.from(chars);
  
  if (charArray.length > 0) {
    const maxDelay = 4; // 4 seconds max delay so last char finishes at 5s
    
    charArray.forEach((char, index) => {
      const delay = (index / (charArray.length - 1)) * maxDelay;
      char.style.animationDelay = `${delay}s`;
    });
  }
  
  // Remove after destruction time - archive instead of completely delete
  setTimeout(() => {
    archiveTask(task.id);
  }, CONFIG.DESTRUCTION_TIME);
}

// ========================================
// Countdown Engine
// ========================================

let animationFrameId = null;
let lastUpdateTime = 0;

/**
 * Main countdown loop using requestAnimationFrame
 */
function startCountdownEngine() {
  function tick(currentTime) {
    const tasks = getTasks();
    const now = Date.now();
    
    tasks.forEach(task => {
      if (task.status === 'destroying') return;
      
      const remainingMs = task.expiresAt - now;
      
      if (remainingMs <= 0) {
        // Task has expired - start destruction
        startDestruction(task);
      } else {
        // Update countdown display
        updateCountdown(task.id, remainingMs, task.totalDuration);
      }
    });
    
    // Continue the loop
    animationFrameId = requestAnimationFrame(tick);
  }
  
  // Start the loop
  animationFrameId = requestAnimationFrame(tick);
}

/**
 * Stop the countdown engine
 */
function stopCountdownEngine() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

// ========================================
// Initialization
// ========================================

/**
 * Initialize the application
 */
function init() {
  // Load and filter expired tasks
  let tasks = getTasks();
  const now = Date.now();
  
  // Filter out tasks that have already expired (with 5 second grace period)
  tasks = tasks.filter(task => {
    if (task.status === 'destroying') {
      // If task was in destroying state but page was refreshed,
      // remove it completely
      return false;
    }
    // Keep tasks that have more than 5 seconds of destruction time left
    return (task.expiresAt + CONFIG.DESTRUCTION_TIME) > now;
  });
  
  saveTasks(tasks);
  
  // Render initial tasks
  renderTasks(tasks);
  
  // Set up archive toggle handler
  elements.archiveToggle.addEventListener('click', handleArchiveToggle);
  
  // Start countdown engine
  startCountdownEngine();
  
  // Set up form submission handler
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const text = elements.input.value.trim();
    const lifespan = parseInt(elements.lifespanSelect.value, 10);
    
    if (text) {
      addTask(text, lifespan);
    }
  });
  
  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause when tab is hidden
      stopCountdownEngine();
    } else {
      // Resume when tab is visible
      // First, filter out any tasks that expired while hidden
      let tasks = getTasks();
      const now = Date.now();
      
      tasks = tasks.filter(task => {
        if (task.status === 'destroying') {
          return false;
        }
        return (task.expiresAt + CONFIG.DESTRUCTION_TIME) > now;
      });
      
      saveTasks(tasks);
      renderTasks(tasks);
      startCountdownEngine();
    }
  });
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

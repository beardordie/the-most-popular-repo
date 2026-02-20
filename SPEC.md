# Ephemeral To-Do List - Specification Document

## Project Overview
- **Project Name:** Ephemeral To-Do List
- **Project Type:** Single-page web application (vanilla HTML/CSS/JS)
- **Core Functionality:** A to-do list that actively fights procrastination by erasing tasks after a configurable lifespan, with real-time countdown and dramatic disintegration animations
- **Target Users:** Developers and productivity enthusiasts looking for a gamified task management experience

---

## 1. UI/UX Specification

### Layout Structure

**Page Sections:**
1. **Header** - Title area with main heading and subtitle
2. **Input Section** - Form containing task input, lifespan selector, and submit button
3. **Task Arena** - Container for active task items

**Layout:**
- Centered single-column layout
- Max-width: 600px for main content
- Full viewport height with vertical centering

**Responsive Breakpoints:**
- Mobile: < 480px (full width with padding)
- Tablet/Desktop: >= 480px (centered with max-width)

### Visual Design

**Color Palette:**
- Background: `#0a0a0f` (deep charcoal/black)
- Glass Background: `rgba(255, 255, 255, 0.05)` with `backdrop-filter: blur(10px)`
- Border/Accent: `rgba(255, 255, 255, 0.1)`
- Primary Neon: `#00ff88` (neon green)
- Warning: `#ffdd00` (yellow)
- Danger: `#ff0055` (neon red/pink)
- Text Primary: `#ffffff`
- Text Secondary: `rgba(255, 255, 255, 0.7)`

**Typography:**
- Headings: 'Orbitron', sans-serif (futuristic/tech feel)
- Body/UI: 'Rajdhani', sans-serif (modern, clean)
- Countdown Timer: 'Share Tech Mono', monospace (for stable numeric display)
- Base font size: 16px
- H1: 2.5rem, font-weight: 700
- H2: 1.2rem, font-weight: 400, letter-spacing: 0.2em
- Timer: 1.1rem

**Spacing System:**
- Base unit: 8px
- Container padding: 24px (3 units)
- Element gaps: 16px (2 units)
- Task item padding: 16px 20px

**Visual Effects:**
- Glassmorphism on input container and task items
- Subtle box-shadow with neon glow on focus states
- Smooth transitions (0.3s ease) on interactive elements

### Components

**1. Header**
- Main title: "The Most Popular Repo on Github" (ironic/humorous)
- Subtitle: "Ephemeral To-Do List" with letter-spacing

**2. Input Form**
- Text input: Full width, dark background, neon border on focus
- Select dropdown: Dark styled with custom arrow
- Submit button: Neon gradient background, hover glow effect
- States: default, focus, hover, active

**3. Task List Item**
- Glass-style card with border
- Task text with character-by-character spans
- Countdown timer (MM:SS.ms format) with color transitions
- Visual states: alive (green → yellow → red as time depletes), destroying (disintegration animation)

**Component States:**
- Default: Normal display
- Hover: Subtle lift/glow effect
- Countdown < 50%: Yellow color shift
- Countdown < 20%: Red color with pulse animation
- Destroying: Character-by-character fade out with rotation and blur

---

## 2. Functionality Specification

### Core Features

**1. Task Creation**
- Form submission with Enter key or button click
- Required text input (autocomplete off)
- Lifespan selection from dropdown (5, 10, 30, 60, 120, 360, 720, 1440 seconds)
- Default lifespan: 60 seconds
- Generate unique ID using `Date.now().toString(36)`

**2. State Management**
- Store tasks in sessionStorage as JSON array
- Data structure per task:
  ```javascript
  {
    id: "unique_string",
    text: "Task description",
    expiresAt: 1716493829102, // Absolute timestamp in ms
    status: "alive" // "alive" or "destroying"
  }
  ```
- On page load: Filter expired tasks and render remaining

**3. Countdown Engine**
- Single requestAnimationFrame loop (or 100ms setInterval fallback)
- Compare current time (`Date.now()`) against each task's `expiresAt`
- Update countdown display in MM:SS.ms format
- Color transitions based on remaining time percentage

**4. Disintegration Animation**
- On expiration: Apply `.destroying` class to task `<li>`
- Split task text into individual `<span>` elements (excluding spaces)
- Calculate animation delay per character:
  - Formula: `delay = (index / (length - 1)) * 4` seconds
  - Animation duration: 1s per character
  - Total destruction time: exactly 5 seconds

**5. Cleanup**
- After 5000ms of destruction animation, remove DOM element
- Delete task from sessionStorage

### User Interactions and Flows

1. **Add Task Flow:**
   - User types task text → Selects lifespan → Submits
   - Task appears in list with full countdown
   - Task saved to sessionStorage

2. **Active Task Flow:**
   - Countdown ticks down in real-time
   - Color shifts from green → yellow → red
   - At 0.0s, destruction begins

3. **Destruction Flow:**
   - Characters begin fading sequentially
   - Each character animates with rotation, blur, and scale
   - After 5s, element removed completely

### Edge Cases

- Empty task text: Prevent submission (HTML required attribute)
- Refresh page: Tasks persist in sessionStorage, expired tasks filtered on load
- No tasks: Show empty state or placeholder
- Very long task text: Handle gracefully with text overflow
- Browser session end: All tasks automatically cleared

---

## 3. Technical Implementation Details

### HTML Structure
```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ephemeral To-Do List</title>
  <!-- Google Fonts links -->
</head>
<body>
  <div class="container">
    <header>
      <h1>The Most Popular Repo on Github</h1>
      <h2>Ephemeral To-Do List</h2>
    </header>
    
    <form id="task-form">
      <input type="text" id="task-input" required autocomplete="off" placeholder="Enter your task...">
      <select id="lifespan-select">
        <option value="5">5 seconds</option>
        <!-- ... other options ... -->
        <option value="60" selected>60 seconds</option>
      </select>
      <button type="submit">Add Task</button>
    </form>
    
    <ul id="task-list"></ul>
  </div>
</body>
</html>
```

### CSS Keyframes (Disintegration)
```css
@keyframes disintegrate {
  0% { opacity: 1; transform: translateY(0) scale(1) blur(0); }
  50% { opacity: 0.8; color: #ff0055; text-shadow: 0 0 10px #ff0055; }
  100% { opacity: 0; transform: translateY(-20px) scale(1.5) rotate(15deg); filter: blur(5px); }
}
```

### JavaScript Architecture
- `App` module with initialization
- `TaskManager` class for CRUD operations
- `CountdownEngine` for timing loop
- `UIController` for DOM manipulation
- Event listeners for form submission
- requestAnimationFrame for smooth countdown

---

## Acceptance Criteria

### Visual Checkpoints
- [ ] Dark theme with glassmorphism elements visible
- [ ] Neon color scheme applied correctly
- [ ] Monospace font used for countdown timer
- [ ] Countdown displays in MM:SS.ms format
- [ ] Color transitions from green → yellow → red as time depletes
- [ ] Disintegration animation shows characters fading sequentially

### Functional Checkpoints
- [ ] Tasks can be added via form submission
- [ ] Enter key submits the form
- [ ] Tasks persist in sessionStorage across refreshes
- [ ] Expired tasks are filtered on page load
- [ ] Countdown updates in real-time
- [ ] Tasks self-destruct after lifespan expires
- [ ] Destruction animation takes exactly 5 seconds
- [ ] Tasks are removed from DOM and sessionStorage after destruction

### Performance
- [ ] Smooth 60fps countdown animation
- [ ] No memory leaks from timers/animation frames
- [ ] Efficient DOM updates (only update changed elements)

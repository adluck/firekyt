# MintySea UI Template - Reusable Design System

## Overview

The MintySea UI features a modern, responsive design with dark/light theme support, built using Bootstrap with custom styling and React components. Here's how to extract and reuse these components for your future projects.

## Core Design System

### 1. Color Palette & Theme System

```css
/* Primary Brand Colors */
:root {
  --primary-gradient: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
  --primary-orange: #f97316;
  --primary-pink: #ec4899;
}

/* Dark Theme Variables */
[data-bs-theme="dark"] {
  --bs-body-bg: #0f172a;
  --bs-body-color: #e2e8f0;
  --bs-border-color: #334155;
}

/* Light Theme Variables */
[data-bs-theme="light"] {
  --bs-body-bg: #ffffff;
  --bs-body-color: #1e293b;
  --bs-border-color: #e2e8f0;
}
```

### 2. Base Template Structure

Key files to copy:
- `templates/base_modern.html` - Main layout with sidebar
- `templates/app.html` - React integration template
- `src/components/Sidebar.js` - Navigation component

### 3. Essential CSS Classes

```css
/* Navigation Active States */
.nav-link.active {
  background: linear-gradient(135deg, #fed7aa 0%, #fce7f3 100%);
  color: #ea580c;
  border-right: 2px solid #f97316;
}

/* Card Hover Effects */
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

/* Theme Transitions */
.theme-transition {
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Gradient Elements */
.gradient-bg {
  background: var(--primary-gradient);
}
```

## Reusable Components

### 1. Sidebar Navigation Component

```javascript
// React Sidebar Component
const Sidebar = ({ navigation, user, onLogout, isDark, onThemeToggle }) => {
  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="logo-section">
        <div className="gradient-bg logo-icon">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="brand-name">Your Brand</span>
      </div>

      {/* Navigation */}
      <nav className="nav-section">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="nav-icon" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="theme-section">
        <button onClick={onThemeToggle} className="theme-toggle">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </div>
  );
};
```

### 2. Theme Context Provider

```javascript
// Theme Management
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', JSON.stringify(newTheme));
    
    // Update DOM
    document.documentElement.setAttribute(
      'data-bs-theme', 
      newTheme ? 'dark' : 'light'
    );
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 3. Dashboard Card Component

```javascript
// Reusable Dashboard Card
const DashboardCard = ({ title, value, icon: Icon, trend, className = "" }) => {
  return (
    <div className={`card card-hover ${className}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h6 className="card-title text-muted">{title}</h6>
            <h2 className="mb-0">{value}</h2>
            {trend && (
              <div className={`trend ${trend.positive ? 'text-success' : 'text-danger'}`}>
                {trend.positive ? <TrendingUp /> : <TrendingDown />}
                {trend.value}
              </div>
            )}
          </div>
          <div className="icon-wrapper gradient-bg">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Template Extraction Steps

### Step 1: Copy Base Files

Create these files in your new project:

```bash
# CSS Framework
mkdir styles
cp templates/base_modern.html new-project/templates/
cp static/css/* new-project/static/css/

# React Components
mkdir src/components
cp src/components/Sidebar.js new-project/src/components/
```

### Step 2: Customize Brand Colors

Replace the orange/pink gradient with your brand colors:

```css
:root {
  --primary-color: #your-primary-color;
  --secondary-color: #your-secondary-color;
  --primary-gradient: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
}
```

### Step 3: Update Navigation

Modify the navigation array for your app:

```javascript
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Your Feature', href: '/feature', icon: YourIcon },
  // Add your menu items
];
```

### Step 4: Customize Logo and Branding

```javascript
// Update logo section
<div className="logo-section">
  <div className="gradient-bg logo-icon">
    <YourLogo className="h-5 w-5 text-white" />
  </div>
  <span className="brand-name">Your App Name</span>
</div>
```

## Dependencies Required

### CSS Framework
```html
<!-- Bootstrap with dark theme support -->
<link href="https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css" rel="stylesheet">

<!-- Icons -->
<script src="https://unpkg.com/feather-icons"></script>
<!-- OR for React -->
<script src="https://unpkg.com/lucide-react@latest"></script>
```

### React Dependencies
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "lucide-react": "^0.263.1"
  }
}
```

## Layout Patterns

### 1. Sidebar + Main Content Layout

```html
<div class="flex h-screen">
  <!-- Sidebar -->
  <div class="sidebar-container">
    <!-- Sidebar content -->
  </div>
  
  <!-- Main Content -->
  <div class="main-content">
    <!-- Page content -->
  </div>
</div>
```

### 2. Card Grid Layout

```html
<div class="container">
  <div class="row">
    <div class="col-md-3 mb-4">
      <div class="card card-hover">
        <!-- Card content -->
      </div>
    </div>
    <!-- Repeat for grid -->
  </div>
</div>
```

### 3. Page Header Pattern

```html
<div class="page-header">
  <div class="d-flex justify-content-between align-items-center">
    <div>
      <h1 class="page-title">Page Title</h1>
      <p class="page-subtitle">Description</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary">
        <Plus className="h-4 w-4 me-2" />
        Add New
      </button>
    </div>
  </div>
</div>
```

## Responsive Design

### Mobile-First Approach

```css
/* Mobile Sidebar */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
}
```

### Breakpoint Strategy

```css
/* Tablet and up */
@media (min-width: 768px) {
  .sidebar {
    position: relative;
    transform: none;
  }
}

/* Desktop optimizations */
@media (min-width: 1024px) {
  .main-content {
    padding: 2rem;
  }
}
```

## Animation System

### Smooth Transitions

```css
/* Page transitions */
.page-transition {
  transition: opacity 0.15s ease;
}

/* Loading states */
.loading {
  opacity: 0.8;
  pointer-events: none;
}

/* Hover effects */
.interactive:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

## Quick Start Template

Here's a minimal template to get started:

```html
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your App</title>
    <link href="https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css" rel="stylesheet">
    <style>
        /* Your custom styles here */
        :root {
            --primary-gradient: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
        }
    </style>
</head>
<body>
    <div class="d-flex h-100">
        <!-- Sidebar -->
        <div class="sidebar">
            <!-- Navigation here -->
        </div>
        
        <!-- Main Content -->
        <div class="main-content flex-fill">
            <!-- Your content here -->
        </div>
    </div>
    
    <script src="https://unpkg.com/feather-icons"></script>
    <script>feather.replace()</script>
</body>
</html>
```

This design system provides a solid foundation for modern web applications with professional styling, responsive design, and excellent user experience.
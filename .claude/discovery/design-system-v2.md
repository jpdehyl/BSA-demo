# Lead Intel v2.0 - Design System

> **Apple-Style Design System**
> **Version:** 2.0
> **Created:** January 9, 2026

---

## Philosophy

**"The best process is no process. The best tool is no tool unless necessary."**

Lead Intel v2.0 embraces Apple's design philosophy:
- **Minimalism** over decoration
- **Clarity** over cleverness
- **Speed** over spectacle
- **Content** over chrome

Every design decision asks: *"Can we remove this and still achieve the goal?"*

---

## Color Palette

### Brand Colors
```css
--primary-blue: #2C88C9;      /* Hawk Ridge Blue - CTAs, links */
--accent-orange: #F26419;     /* Hawk Ridge Orange - highlights */
```

### Semantic Colors
```css
/* Success */
--success-bg: #10B981;
--success-fg: #ffffff;
--success-light: rgba(16, 185, 129, 0.1);

/* Warning */
--warning-bg: #F59E0B;
--warning-fg: #ffffff;
--warning-light: rgba(245, 158, 11, 0.1);

/* Danger */
--danger-bg: #EF4444;
--danger-fg: #ffffff;
--danger-light: rgba(239, 68, 68, 0.1);

/* Info */
--info-bg: #3B82F6;
--info-fg: #ffffff;
--info-light: rgba(59, 130, 246, 0.1);
```

### Confidence Indicators
```css
--confidence-high: #10B981;       /* Green */
--confidence-medium: #F59E0B;     /* Amber */
--confidence-low: #EF4444;        /* Red */
```

### Neutral Palette
```css
--background: hsl(0, 0%, 100%);           /* White */
--foreground: hsl(0, 0%, 10%);            /* Near black */
--muted: hsl(210, 40%, 96%);              /* Light gray */
--muted-foreground: hsl(215, 16%, 47%);   /* Medium gray */
--border: hsl(214, 32%, 91%);             /* Border gray */
--card: hsl(0, 0%, 100%);                 /* Card background */
```

---

## Typography

### Font Families
```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

### Type Scale
```css
/* Display (Fit Score Hero) */
--text-4xl: 72px;
--line-4xl: 1;
--weight-4xl: 700;

/* Heading 1 (KPI Values) */
--text-3xl: 56px;
--line-3xl: 1;
--weight-3xl: 700;

/* Heading 2 (Card Headings) */
--text-2xl: 32px;
--line-2xl: 1.2;
--weight-2xl: 600;

/* Heading 3 (Section Headings) */
--text-xl: 24px;
--line-xl: 1.3;
--weight-xl: 600;

/* Heading 4 (Subsection Headings) */
--text-lg: 18px;
--line-lg: 1.4;
--weight-lg: 600;

/* Body (Default) */
--text-base: 16px;
--line-base: 1.5;
--weight-base: 400;

/* Small (Secondary Text) */
--text-sm: 14px;
--line-sm: 1.4;
--weight-sm: 400;

/* Extra Small (Labels, Badges) */
--text-xs: 12px;
--line-xs: 1.3;
--weight-xs: 500;
```

### Usage Examples
```css
/* Page heading */
.heading-page {
  font-size: var(--text-xl);
  line-height: var(--line-xl);
  font-weight: var(--weight-xl);
  color: var(--foreground);
}

/* KPI value */
.kpi-value {
  font-size: var(--text-3xl);
  line-height: var(--line-3xl);
  font-weight: var(--weight-3xl);
  color: var(--foreground);
}

/* Body text */
.body {
  font-size: var(--text-base);
  line-height: var(--line-base);
  font-weight: var(--weight-base);
  color: var(--foreground);
}

/* Label */
.label {
  font-size: var(--text-xs);
  line-height: var(--line-xs);
  font-weight: var(--weight-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--muted-foreground);
}
```

---

## Spacing System

### 8px Grid
```css
--space-0: 0px;
--space-1: 8px;
--space-2: 16px;
--space-3: 24px;
--space-4: 32px;
--space-5: 40px;
--space-6: 48px;
--space-7: 56px;
--space-8: 64px;
```

### Usage Guidelines
- **Component padding:** --space-2 (16px) to --space-4 (32px)
- **Card padding:** --space-6 (48px) for hero sections, --space-3 (24px) for standard
- **Section margins:** --space-4 (32px) to --space-6 (48px)
- **Element gaps:** --space-2 (16px) for related items
- **Form field spacing:** --space-3 (24px) between fields

---

## Shadows

### Elevation Scale
```css
/* Subtle (Resting cards) */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);

/* Medium (Hover states) */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.10);

/* Large (Dragging, important elements) */
--shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.15);

/* Extra Large (Modals) */
--shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.30);
```

### Usage
```css
/* Resting card */
.card {
  box-shadow: var(--shadow-sm);
}

/* Hover card */
.card:hover {
  box-shadow: var(--shadow-md);
}

/* Modal */
.modal {
  box-shadow: var(--shadow-xl);
}
```

---

## Border Radius

```css
--radius-sm: 6px;   /* Badges, small buttons */
--radius-md: 8px;   /* Buttons, inputs, cards */
--radius-lg: 12px;  /* Large cards, modals */
--radius-xl: 16px;  /* Hero sections */
--radius-full: 9999px; /* Pills, avatars */
```

---

## Animation & Motion

### Timing Functions
```css
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);   /* Default */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
```

### Duration
```css
--transition-fast: 100ms;    /* Micro-interactions */
--transition-base: 200ms;    /* Default transitions */
--transition-slow: 300ms;    /* Complex animations */
```

### Common Patterns
```css
/* Button hover */
.button {
  transition: all var(--transition-base) var(--ease-out);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Card drag */
.card.dragging {
  transition: transform var(--transition-fast) var(--ease-out);
  transform: rotate(2deg);
}

/* Modal enter */
@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal {
  animation: modal-enter var(--transition-slow) var(--ease-out);
}
```

### Respect User Preferences
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Library

### 1. Buttons

#### Variants
```css
/* Primary (CTAs) */
.btn-primary {
  background: var(--primary-blue);
  color: white;
  padding: 12px 32px;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all var(--transition-base) var(--ease-out);
}

.btn-primary:hover {
  background: #2477AD;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(44, 136, 201, 0.3);
}

.btn-primary:disabled {
  background: var(--muted);
  color: var(--muted-foreground);
  cursor: not-allowed;
  opacity: 0.5;
}

/* Secondary (Alternatives) */
.btn-secondary {
  background: transparent;
  color: var(--primary-blue);
  border: 1px solid var(--primary-blue);
  padding: 12px 32px;
  border-radius: var(--radius-md);
  font-weight: 600;
}

/* Ghost (Subtle actions) */
.btn-ghost {
  background: transparent;
  color: var(--foreground);
  padding: 12px 32px;
  border-radius: var(--radius-md);
  font-weight: 600;
}

.btn-ghost:hover {
  background: var(--muted);
}

/* Destructive (Delete, remove) */
.btn-destructive {
  background: var(--danger-bg);
  color: white;
  padding: 12px 32px;
  border-radius: var(--radius-md);
  font-weight: 600;
}
```

#### Sizes
```css
.btn-sm {
  padding: 8px 16px;
  font-size: var(--text-sm);
}

.btn-md {
  padding: 12px 32px;
  font-size: var(--text-base);
}

.btn-lg {
  padding: 16px 40px;
  font-size: var(--text-lg);
}
```

---

### 2. Cards

```css
.card {
  background: var(--card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  transition: all var(--transition-base) var(--ease-out);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Card header */
.card-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border);
}

.card-title {
  font-size: var(--text-xl);
  font-weight: var(--weight-xl);
  color: var(--foreground);
}

/* Card content */
.card-content {
  color: var(--foreground);
}
```

---

### 3. Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
}

/* Variants */
.badge-success {
  background: var(--success-light);
  color: var(--success-bg);
}

.badge-warning {
  background: var(--warning-light);
  color: var(--warning-bg);
}

.badge-danger {
  background: var(--danger-light);
  color: var(--danger-bg);
}

.badge-info {
  background: var(--info-light);
  color: var(--info-bg);
}

/* Fit Score Badge (Large) */
.badge-fit-score {
  font-size: var(--text-2xl);
  font-weight: 700;
  padding: 8px 16px;
  border-radius: var(--radius-md);
}
```

---

### 4. Forms

#### Input Fields
```css
.input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--foreground);
  background: var(--background);
  transition: all var(--transition-base) var(--ease-out);
}

.input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(44, 136, 201, 0.1);
}

.input:disabled {
  opacity: 0.5;
  background: var(--muted);
  cursor: not-allowed;
}

/* Error state */
.input.error {
  border-color: var(--danger-bg);
}
```

#### Select Dropdown
```css
.select {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--background);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml...");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
```

#### Textarea
```css
.textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-family: var(--font-sans);
  resize: vertical;
}
```

#### Toggle (iOS-Style)
```css
.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--muted);
  position: relative;
  cursor: pointer;
  transition: background var(--transition-base) var(--ease-out);
}

.toggle.active {
  background: var(--primary-blue);
}

.toggle-knob {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 2px;
  left: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: left var(--transition-slow) var(--ease-out);
}

.toggle.active .toggle-knob {
  left: 22px;
}
```

---

### 5. Modals

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: var(--card);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  max-width: 600px;
  width: 90%;
  box-shadow: var(--shadow-xl);
  animation: modal-enter var(--transition-slow) var(--ease-out);
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: var(--weight-xl);
}

.modal-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  margin-top: var(--space-4);
}
```

---

### 6. Toast Notifications

```css
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  background: var(--card);
  border-radius: var(--radius-lg);
  padding: 16px 24px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
  min-width: 300px;
  animation: toast-enter var(--transition-slow) var(--ease-out);
  z-index: 100;
}

@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-success {
  border-left: 4px solid var(--success-bg);
}

.toast-error {
  border-left: 4px solid var(--danger-bg);
}

.toast-info {
  border-left: 4px solid var(--info-bg);
}
```

---

### 7. Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  border-bottom: 1px solid var(--border);
}

.table th {
  text-align: left;
  padding: 12px 16px;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--muted-foreground);
}

.table td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  font-size: var(--text-sm);
}

.table tbody tr {
  transition: background var(--transition-base) var(--ease-out);
}

.table tbody tr:hover {
  background: var(--muted);
}
```

---

## Iconography

### Icon Library
**Primary:** `lucide-react` (outline style)

### Usage Guidelines
```tsx
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

// Standard size
<CheckCircle size={20} />

// Large (headings)
<CheckCircle size={24} />

// Small (inline)
<CheckCircle size={16} />
```

### Icon + Text Alignment
```css
.icon-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

---

## Responsive Design

### Breakpoints
```css
/* Mobile-first approach */
--breakpoint-sm: 640px;   /* Phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large desktops */
```

### Usage
```css
/* Mobile (default) */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

/* Tablet */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## Accessibility

### Focus Indicators
```css
*:focus-visible {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}
```

### Color Contrast
All text must meet WCAG 2.1 AA standards:
- **Normal text:** 4.5:1 minimum
- **Large text (18px+):** 3:1 minimum

### Skip Links
```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

```css
.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  background: var(--primary-blue);
  color: white;
  padding: 8px 16px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

---

## Implementation Checklist

For every new component:

- [ ] Uses 8px spacing grid
- [ ] Typography matches scale
- [ ] Colors from design system palette
- [ ] Shadows from elevation scale
- [ ] Border radius from scale
- [ ] Animations use timing functions
- [ ] Respects `prefers-reduced-motion`
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Keyboard accessible
- [ ] Screen reader tested
- [ ] Mobile responsive
- [ ] Tested on iOS and Android (if mobile)

---

## Resources

- **Tailwind Config:** `/tailwind.config.ts`
- **Global CSS:** `/client/src/index.css`
- **shadcn/ui Components:** `/client/src/components/ui/`
- **Figma:** (TBD - can create if needed)

---

**Design System Version:** 2.0
**Last Updated:** January 9, 2026
**Maintained by:** UX Agent (Claude Code)

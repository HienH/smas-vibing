# UI Design Rules for SMAS

@fileoverview Defines the core UI/UX design principles and conventions for the Send Me a Song (SMAS) application. These rules ensure a consistent, accessible, and modern user experience across all devices.

---

## 1. General Principles
- **Minimalism:** Prioritize clarity and simplicity. Remove unnecessary elements and visual clutter.
- **Responsiveness:** All layouts and components must adapt seamlessly to mobile, tablet, and desktop breakpoints.
- **Accessibility:** Follow WCAG 2.1 AA standards. Ensure keyboard navigation, sufficient color contrast, and screen reader support.
- **Consistency:** Use a unified design system (see theme-rules.md) for colors, spacing, and typography.
- **Feedback:** Provide clear, immediate feedback for all user actions (e.g., button presses, form submissions, errors).

## 2. Layout & Spacing
- **Grid System:** Use a 12-column responsive grid for main layouts. Use Tailwind's grid and flex utilities.
- **Spacing:** Use Tailwind's spacing scale (e.g., `p-4`, `gap-6`). Avoid custom pixel values.
- **Section Padding:** Apply generous padding to separate content blocks, especially on larger screens.
- **Alignment:** Left-align text and primary actions. Center content only for onboarding/empty states.

## 3. Typography
- **Font Family:** Use a clean, modern sans-serif (e.g., Inter, system-ui).
- **Font Sizes:** Use Tailwind's type scale (`text-base`, `text-lg`, etc.).
- **Font Weight:** Use `font-medium` for headings, `font-normal` for body.
- **Line Height:** Use `leading-relaxed` for body text for readability.
- **Contrast:** Always use dark gray text on light backgrounds for maximum legibility.

## 4. Component Usage
- **shadcn/ui:** Use shadcn/ui components as the base for all UI elements. Extend only when necessary.
- **Buttons:** Use clear, descriptive labels. Primary actions use green accent, secondary actions use neutral tones.
- **Inputs:** Use large, touch-friendly fields. Always provide labels and helper/error text.
- **Cards/Surfaces:** Use subtle elevation (e.g., `shadow-sm`) and soft green backgrounds for grouping content.
- **Icons:** Use simple, line-based icons. Avoid decorative or complex iconography.

## 5. Interaction Patterns
- **Navigation:** Use a fixed or sticky top navigation bar on desktop, bottom nav on mobile if needed.
- **Modals/Drawers:** Use for focused tasks only. Always provide a clear way to close.
- **Loading States:** Use skeletons or subtle spinners. Avoid blocking overlays.
- **Empty States:** Use friendly, concise copy and a call-to-action.
- **Error States:** Use clear, actionable error messages. Never blame the user.

## 6. Responsiveness
- **Breakpoints:** Design for mobile-first (`sm`, `md`, `lg`, `xl`).
- **Touch Targets:** Minimum 44x44px for all interactive elements.
- **Adaptive Layouts:** Stack content vertically on mobile, use side-by-side layouts on desktop.
- **Image Handling:** Use Next.js `Image` for responsive images. Always provide `alt` text.

## 7. Accessibility
- **Keyboard Navigation:** All interactive elements must be focusable and operable via keyboard.
- **Color Contrast:** Maintain at least 4.5:1 contrast ratio for text.
- **ARIA Labels:** Use ARIA attributes for custom components.
- **Focus States:** Use visible, high-contrast focus indicators.

## 8. Common Pitfalls to Avoid
- Overusing color or shadow
- Inconsistent spacing or alignment
- Small, hard-to-tap touch targets
- Insufficient feedback for user actions
- Ignoring accessibility requirements

---

For implementation details, see `theme-rules.md` for the color palette and style tokens. 
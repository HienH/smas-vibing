# Theme Rules for SMAS

@fileoverview Defines the minimalist green theme for the Send Me a Song (SMAS) application, including all color tokens, typography, and style conventions for a clean, modern, and airy UI.

---

## 1. Color Palette

| Token            | Hex        | Usage                                 |
|------------------|------------|---------------------------------------|
| `primary`        | #6FCF97    | Main accent (buttons, highlights)     |
| `primary-50`     | #F3FBF6    | Lightest green (backgrounds, cards)   |
| `primary-100`    | #E6F7EC    | Soft green (hover, subtle surfaces)   |
| `primary-200`    | #C9EFD8    | Pale green (secondary backgrounds)    |
| `primary-300`    | #A6E3C4    | Accent backgrounds, tags              |
| `primary-700`    | #219150    | Active/pressed state, focus ring      |
| `neutral-50`     | #FAFAFA    | App background                        |
| `neutral-100`    | #F5F5F5    | Card/surface background               |
| `neutral-200`    | #E5E7EB    | Borders, dividers                     |
| `neutral-800`    | #23272A    | Main text (headings, body)            |
| `neutral-600`    | #4B5563    | Secondary text, icons                 |
| `error`          | #EF4444    | Error states                          |
| `success`        | #22C55E    | Success states                        |

### Usage Notes
- Use `primary` for all main actions and highlights.
- Use `primary-50` and `primary-100` for backgrounds and cards.
- Use `neutral-800` for all text on light backgrounds.
- Use `neutral-100` for surfaces and `neutral-200` for borders.
- Use `primary-700` for focus rings and active states.
- Use `error` and `success` only for status feedback.

## 2. Typography
- **Font Family:** Inter, system-ui, sans-serif
- **Font Sizes:** Use Tailwind's scale (`text-base`, `text-lg`, `text-xl`, etc.)
- **Font Weight:** 400 (normal), 500 (medium) for headings
- **Line Height:** `leading-relaxed` for body, `leading-tight` for headings
- **Letter Spacing:** Default

## 3. Border Radius & Shadows
- **Border Radius:**
  - Small: `rounded` (4px)
  - Medium: `rounded-md` (6px)
  - Large: `rounded-lg` (8px)
- **Shadows:**
  - Subtle: `shadow-sm` for cards and surfaces
  - No heavy or colored shadows

## 4. Spacing
- Use Tailwind's spacing scale (`p-4`, `gap-6`, etc.)
- Generous padding for cards and sections
- Consistent vertical rhythm between elements

## 5. Example Tailwind Config
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6FCF97',
          50: '#F3FBF6',
          100: '#E6F7EC',
          200: '#C9EFD8',
          300: '#A6E3C4',
          700: '#219150',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E7EB',
          600: '#4B5563',
          800: '#23272A',
        },
        error: '#EF4444',
        success: '#22C55E',
      },
      fontFamily: {
                bubble: ['Chewy', 'cursive'],

        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(34, 197, 94, 0.03)',
      },
    },
  },
};
```

## 6. shadcn/ui Customization
- Use the above color tokens for all shadcn/ui component themes.
- Set `primary` as the accent color for buttons, toggles, and links.
- Use `primary-50`/`primary-100` for backgrounds and cards.
- Use `neutral-800` for text and `neutral-200` for borders.
- Keep all components flat or with subtle `shadow-sm` only.

## 7. Visual Examples
- **Primary Button:** Green background (`primary`), white text, rounded-md, shadow-sm
- **Card:** `primary-50` background, `rounded-lg`, `shadow-sm`, dark text
- **Input:** White or `primary-100` background, `neutral-200` border, `rounded-md`
- **Navigation:** Transparent or `primary-50` background, no heavy shadow

---

For implementation, reference this file in your Tailwind and shadcn/ui config. All new UI should use these tokens for a consistent, minimalist green theme. 
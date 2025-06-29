# Project Rules for SMAS
## Send Me a Song (SMAS) - AI-First Codebase Guidelines

**Document Purpose:** Defines the comprehensive rules, standards, and conventions for building an AI-first codebase that is modular, scalable, and easy to understand. This document consolidates all project guidelines and establishes clear patterns for development.

**Last Updated:** June 28, 2025

---

## 🎯 AI-First Codebase Principles

### Core Philosophy
- **Modularity:** Every file has a single, clear responsibility
- **Scalability:** Code structure supports growth without refactoring
- **Readability:** Code is self-documenting and easy to understand
- **Navigability:** File structure is intuitive and predictable
- **AI Compatibility:** Code is optimized for semantic search and AI tool understanding

### Key Requirements
- **File Size Limit:** All files must be under 500 lines
- **Documentation:** Every file must have a `@fileoverview` comment explaining its purpose
- **Descriptive Naming:** Files, functions, and variables use clear, descriptive names
- **JSDoc/TSDoc:** All functions must have proper documentation with `@description` and `@param` tags
- **Auxiliary Verbs:** Variable names should use auxiliary verbs (e.g., `isLoading`, `hasError`, `canSubmit`)

---

## 📁 Directory Structure

### Root Level Organization
```
SMAS/
├── _docs/                    # Project documentation
├── app/                      # Next.js App Router pages
├── components/               # Reusable UI components
├── lib/                      # Utility functions and configurations
├── hooks/                    # Custom React hooks
├── types/                    # TypeScript type definitions
├── services/                 # External API integrations
├── stores/                   # State management (Zustand)
├── utils/                    # Helper functions
├── constants/                # Application constants
└── public/                   # Static assets
```

### Detailed Structure

#### `/app` - Next.js App Router
```
app/
├── (auth)/                   # Authentication routes
│   ├── login/
│   └── callback/
├── (dashboard)/              # Protected dashboard routes
│   ├── dashboard/
│   └── settings/
├── api/                      # API routes
│   ├── auth/
│   ├── spotify/
│   ├── playlists/
│   └── contributions/
├── globals.css               # Global styles
├── layout.tsx                # Root layout
└── page.tsx                  # Landing page
```

#### `/components` - UI Components
```
components/
├── ui/                       # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── layout/                   # Layout components
│   ├── header.tsx
│   ├── footer.tsx
│   └── navigation.tsx
├── auth/                     # Authentication components
│   ├── login-button.tsx
│   └── user-menu.tsx
├── playlist/                 # Playlist-related components
│   ├── playlist-card.tsx
│   ├── song-item.tsx
│   └── contributor-list.tsx
├── sharing/                  # Sharing components
│   ├── share-link.tsx
│   └── contribution-form.tsx
└── common/                   # Common utility components
    ├── loading-spinner.tsx
    ├── error-boundary.tsx
    └── empty-state.tsx
```

#### `/lib` - Core Libraries
```
lib/
├── auth.ts                   # NextAuth configuration
├── spotify.ts                # Spotify API client
├── firebase.ts               # Firebase configuration
├── utils.ts                  # General utilities
└── constants.ts              # App constants
```

#### `/services` - External Integrations
```
services/
├── spotify/
│   ├── client.ts             # Spotify API client
│   ├── auth.ts               # Spotify authentication
│   ├── playlists.ts          # Playlist operations
│   └── users.ts              # User data operations
├── firebase/
│   ├── client.ts             # Firebase client
│   ├── users.ts              # User data operations
│   └── playlists.ts          # Playlist data operations
└── rate-limiting/
    └── middleware.ts         # Rate limiting logic
```

#### `/stores` - State Management
```
stores/
├── auth-store.ts             # Authentication state
├── playlist-store.ts         # Playlist state
├── ui-store.ts               # UI state
└── index.ts                  # Store exports
```

#### `/types` - TypeScript Definitions
```
types/
├── spotify.ts                # Spotify API types
├── firebase.ts               # Firebase types
├── auth.ts                   # Authentication types
├── playlist.ts               # Playlist types
└── api.ts                    # API response types
```

---

## 📝 File Naming Conventions

### General Rules
- **kebab-case** for file and directory names
- **PascalCase** for React components
- **camelCase** for functions, variables, and exports
- **UPPER_SNAKE_CASE** for constants

### Specific Patterns
- **Components:** `component-name.tsx` (e.g., `playlist-card.tsx`)
- **Hooks:** `use-hook-name.ts` (e.g., `use-spotify-auth.ts`)
- **Services:** `service-name.ts` (e.g., `spotify-client.ts`)
- **Types:** `domain-name.ts` (e.g., `spotify-types.ts`)
- **Utils:** `utility-name.ts` (e.g., `format-duration.ts`)
- **Constants:** `constants-name.ts` (e.g., `api-constants.ts`)

### File Extensions
- **TypeScript React:** `.tsx`
- **TypeScript:** `.ts`
- **CSS Modules:** `.module.css`
- **Configuration:** `.config.js`, `.config.ts`

---

## 🏗️ Code Organization Standards

### File Structure Template
```typescript
/**
 * @fileoverview Brief description of what this file does and its purpose
 * in the overall application architecture.
 * 
 * This file handles [specific functionality] and integrates with [other systems].
 * Key responsibilities:
 * - [Responsibility 1]
 * - [Responsibility 2]
 * - [Responsibility 3]
 */

// 1. Imports (grouped by type)
// External libraries
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

// Internal imports
import { useAuthStore } from '@/stores/auth-store'
import { SpotifyClient } from '@/services/spotify/client'
import type { Playlist } from '@/types/playlist'

// 2. Constants
const REFRESH_INTERVAL = 30000 // 30 seconds

// 3. Types (if file-specific)
interface ComponentProps {
  playlistId: string
  onUpdate?: (playlist: Playlist) => void
}

// 4. Main Component/Function
export function PlaylistManager({ playlistId, onUpdate }: ComponentProps) {
  // 5. Hooks and state
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  
  // 6. Query hooks
  const { data: playlist, error } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => SpotifyClient.getPlaylist(playlistId),
    enabled: !!playlistId,
  })

  // 7. Event handlers
  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // Implementation
    } catch (error) {
      // Error handling
    } finally {
      setIsLoading(false)
    }
  }

  // 8. Effects
  useEffect(() => {
    // Side effects
  }, [playlistId])

  // 9. Render
  return (
    // JSX
  )
}

// 10. Helper functions (if needed)
function formatPlaylistData(data: any): Playlist {
  // Implementation
}
```

### Function Documentation Template
```typescript
/**
 * @description Brief description of what the function does
 * 
 * @param {string} paramName - Description of the parameter and its expected format
 * @param {number} [optionalParam] - Optional parameter with default behavior
 * @returns {Promise<ResultType>} Description of what the function returns
 * 
 * @example
 * ```typescript
 * const result = await functionName('example', 42)
 * ```
 * 
 * @throws {Error} Description of when and why errors are thrown
 */
async function functionName(
  paramName: string,
  optionalParam?: number
): Promise<ResultType> {
  // Implementation
}
```

---

## 🎨 UI/UX Standards

### Design System
- **Theme:** Minimalist green theme (see `theme-rules.md`)
- **Components:** shadcn/ui as base component library
- **Styling:** Tailwind CSS for utility-first styling
- **Responsiveness:** Mobile-first design approach
- **Accessibility:** WCAG 2.1 AA compliance

### Component Structure
```typescript
/**
 * @fileoverview [Component Name] - Brief description of component purpose
 * 
 * This component handles [specific functionality] and is used in [contexts].
 * It integrates with [other systems] and follows [design patterns].
 */

interface ComponentProps {
  // Props with clear descriptions
  title: string
  isVisible?: boolean
  onAction?: () => void
}

export function ComponentName({ title, isVisible = true, onAction }: ComponentProps) {
  // Implementation following UI rules
}
```

### Styling Conventions
- Use Tailwind utility classes for styling
- Follow the color palette defined in `theme-rules.md`
- Maintain consistent spacing using Tailwind's scale
- Use semantic class names for complex styling

---

## 🔧 Technical Standards

### TypeScript
- **Strict Mode:** Enable all strict TypeScript options
- **Type Safety:** Avoid `any` types, use proper interfaces
- **Generic Types:** Use generics for reusable components
- **Type Guards:** Implement proper type checking

### React Patterns
- **Functional Components:** Use function components with hooks
- **Custom Hooks:** Extract reusable logic into custom hooks
- **Error Boundaries:** Implement error boundaries for error handling
- **Memoization:** Use `useMemo` and `useCallback` appropriately

### State Management
- **Zustand:** Use Zustand for global state management
- **TanStack Query:** Use for server state and caching
- **Local State:** Use `useState` for component-specific state
- **Form State:** Use React Hook Form for form management

### API Integration
- **RESTful:** Follow REST conventions for API design
- **Error Handling:** Implement comprehensive error handling
- **Loading States:** Provide clear loading indicators
- **Rate Limiting:** Implement proper rate limiting

---

## 🧪 Testing Standards

### Test Structure
```
__tests__/
├── components/
├── hooks/
├── services/
└── utils/
```

### Testing Conventions
- **Unit Tests:** Test individual functions and components
- **Integration Tests:** Test component interactions
- **E2E Tests:** Test complete user flows
- **Mocking:** Mock external dependencies appropriately

---

## 📚 Documentation Standards

### Code Comments
- **JSDoc/TSDoc:** Use for all public functions and components
- **Inline Comments:** Use sparingly, only for complex logic
- **TODO Comments:** Use for future improvements
- **FIXME Comments:** Use for known issues

### README Files
- **Project README:** Overview, setup, and usage
- **Component README:** Usage examples and props
- **API README:** Endpoint documentation
- **Deployment README:** Deployment instructions

---

## 🚀 Performance Standards

### Optimization Rules
- **Code Splitting:** Use dynamic imports for large components
- **Image Optimization:** Use Next.js Image component
- **Bundle Size:** Monitor and optimize bundle size
- **Lazy Loading:** Implement lazy loading for non-critical components

### Monitoring
- **Core Web Vitals:** Monitor LCP, FID, and CLS
- **Error Tracking:** Implement error monitoring
- **Performance Metrics:** Track key performance indicators

---

## 🔒 Security Standards

### Authentication
- **OAuth 2.0:** Use NextAuth.js for Spotify authentication
- **Token Management:** Secure token storage and refresh
- **Session Handling:** Proper session management

### Data Protection
- **Input Validation:** Validate all user inputs
- **Rate Limiting:** Implement rate limiting for API endpoints
- **CORS:** Configure CORS properly
- **Environment Variables:** Secure environment variable management

---

## 📋 Development Workflow

### Git Conventions
- **Branch Naming:** `feature/feature-name`, `fix/issue-description`
- **Commit Messages:** Use conventional commit format
- **Pull Requests:** Require code review and testing
- **Version Control:** Use semantic versioning

### Code Quality
- **ESLint:** Enforce code style and best practices
- **Prettier:** Maintain consistent code formatting
- **TypeScript:** Ensure type safety
- **Pre-commit Hooks:** Run quality checks before commits

---

## 🎯 Success Metrics

### Code Quality Metrics
- **File Size:** All files under 500 lines
- **Test Coverage:** Minimum 80% test coverage
- **Type Safety:** 100% TypeScript coverage
- **Performance:** Core Web Vitals in green

### Development Metrics
- **Build Time:** Fast development builds
- **Bundle Size:** Optimized production bundles
- **Error Rate:** Low runtime error rates
- **User Experience:** High user satisfaction scores

---

This document serves as the definitive guide for all development work on the SMAS project. All team members should follow these standards to maintain code quality and ensure the success of our AI-first codebase. 
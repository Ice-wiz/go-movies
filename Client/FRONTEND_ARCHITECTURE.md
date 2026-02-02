# MagicStream Movies - Frontend Architecture

A comprehensive guide to understanding the frontend codebase, its flows, and crucial functions that make it robust, responsive, and provide excellent UX.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Core Concepts](#core-concepts)
4. [Data Flow](#data-flow)
5. [Authentication Flow](#authentication-flow)
6. [Crucial Functions & Patterns](#crucial-functions--patterns)
7. [Responsiveness Strategy](#responsiveness-strategy)
8. [UX Best Practices Implemented](#ux-best-practices-implemented)
9. [Neubrutalism Design System](#neubrutalism-design-system)
10. [Performance Optimizations](#performance-optimizations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Application                         │
├─────────────────────────────────────────────────────────────────┤
│  Pages (Views)          Components (Reusable UI)                 │
│  ├── HomePage           ├── Layout                               │
│  ├── MoviesPage         ├── Navbar                               │
│  ├── MovieDetailPage    ├── MovieCard                            │
│  ├── LoginPage          ├── MovieGrid                            │
│  └── ProfilePage        └── SearchBar                            │
├─────────────────────────────────────────────────────────────────┤
│  Custom Hooks (Business Logic)                                   │
│  ├── useAuth      → Authentication operations                    │
│  ├── useMovies    → Movie CRUD & filtering                       │
│  └── useGenres    → Genre fetching                               │
├─────────────────────────────────────────────────────────────────┤
│  Jotai Atoms (Global State)                                      │
│  ├── userAtom, isAuthenticatedAtom                               │
│  ├── moviesAtom, filteredMoviesAtom                              │
│  └── searchTermAtom, selectedGenreAtom                           │
├─────────────────────────────────────────────────────────────────┤
│  API Layer (HTTP Client)                                         │
│  ├── client.js    → Axios instance with interceptors             │
│  ├── auth.js      → Auth API calls                               │
│  └── movies.js    → Movie API calls                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── api/                    # API communication layer
│   ├── client.js          # Axios instance with interceptors
│   ├── auth.js            # Authentication endpoints
│   ├── movies.js          # Movies endpoints
│   ├── genres.js          # Genres endpoints
│   └── index.js           # Barrel export
│
├── atoms/                  # Jotai state atoms
│   ├── authAtom.js        # Auth-related state
│   ├── moviesAtom.js      # Movie-related state
│   └── index.js           # Barrel export
│
├── components/             # Reusable UI components
│   ├── Layout.jsx         # App shell with nav & footer
│   ├── Navbar.jsx         # Navigation bar
│   ├── MovieCard.jsx      # Movie display card
│   ├── MovieGrid.jsx      # Grid layout for movies
│   ├── SearchBar.jsx      # Search & filter component
│   ├── ProtectedRoute.jsx # Auth guard
│   ├── GenreSelector.jsx  # Multi-select for genres
│   ├── FormInput.jsx      # Styled form input
│   ├── LoadingSpinner.jsx # Loading indicator
│   └── index.js           # Barrel export
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.js         # Auth operations
│   ├── useMovies.js       # Movie operations
│   ├── useGenres.js       # Genre fetching
│   └── index.js           # Barrel export
│
├── pages/                  # Route pages/views
│   ├── HomePage.jsx       # Landing page
│   ├── MoviesPage.jsx     # Movie catalog
│   ├── MovieDetailPage.jsx# Single movie view
│   ├── RecommendedPage.jsx# Personalized picks
│   ├── LoginPage.jsx      # Login form
│   ├── RegisterPage.jsx   # Registration form
│   ├── ProfilePage.jsx    # User profile
│   ├── NotFoundPage.jsx   # 404 page
│   └── index.js           # Barrel export
│
├── App.jsx                # Main app with routing
├── main.jsx               # React entry point
└── index.css              # Global styles & design system
```

---

## Core Concepts

### 1. State Management with Jotai

**Why Jotai over Redux/Context?**
- **Minimal boilerplate**: No actions, reducers, or providers needed
- **Fine-grained reactivity**: Components only re-render when their specific atom changes
- **Atomic state**: Each piece of state is independent
- **Easy derived state**: Computed values automatically update

```javascript
// Base atom - stores user data
export const userAtom = atomWithStorage('user', null);

// Derived atom - computed from base atom
export const isAuthenticatedAtom = atom((get) => {
  const user = get(userAtom);
  return user !== null;
});

// Derived atom with filtering logic
export const filteredMoviesAtom = atom((get) => {
  const movies = get(moviesAtom);
  const searchTerm = get(movieSearchTermAtom);
  return movies.filter(m => m.title.includes(searchTerm));
});
```

### 2. API Layer Architecture

The API layer is structured in three levels:

1. **client.js** - Base HTTP client with interceptors
2. **Domain files** (auth.js, movies.js) - Endpoint-specific functions
3. **hooks** - React integration with state management

```
Component → Hook → API Service → HTTP Client → Backend
```

### 3. Custom Hooks Pattern

Hooks encapsulate all business logic, keeping components focused on UI:

```javascript
// Component is clean - just UI
function MoviesPage() {
  const { movies, loading, fetchMovies } = useMovies();
  
  useEffect(() => {
    fetchMovies();
  }, []);
  
  return <MovieGrid movies={movies} loading={loading} />;
}
```

---

## Data Flow

### Unidirectional Data Flow

```
┌──────────────┐
│  User Action │ (click, type, navigate)
└──────┬───────┘
       ▼
┌──────────────┐
│    Hook      │ (useAuth, useMovies)
│  Function    │ 
└──────┬───────┘
       ▼
┌──────────────┐
│  API Layer   │ (async HTTP call)
└──────┬───────┘
       ▼
┌──────────────┐
│   Backend    │ (Go server)
└──────┬───────┘
       ▼
┌──────────────┐
│  Response    │ (JSON data)
└──────┬───────┘
       ▼
┌──────────────┐
│ Jotai Atom   │ (state update)
│   Update     │
└──────┬───────┘
       ▼
┌──────────────┐
│  React       │ (automatic re-render)
│  Component   │
└──────────────┘
```

### Example: Fetching Movies

```javascript
// 1. Component triggers fetch
useEffect(() => {
  fetchMovies();
}, []);

// 2. Hook handles the operation
const fetchMovies = async () => {
  setLoading(true);                    // UI shows loading
  const data = await moviesApi.getAll(); // API call
  setMovies(data);                     // Atom update
  setLoading(false);                   // UI updates
};

// 3. Component automatically re-renders with new data
```

---

## Authentication Flow

### Login Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User submits credentials                                     │
│     └─→ LoginPage.jsx validates form                             │
│                                                                  │
│  2. useAuth.login() called                                       │
│     └─→ Sets loading state                                       │
│     └─→ Calls authApi.login()                                    │
│                                                                  │
│  3. API client sends POST /login                                 │
│     └─→ Backend validates credentials                            │
│     └─→ Returns user data                                        │
│     └─→ Sets HTTP-only cookies (access_token, refresh_token)     │
│                                                                  │
│  4. Hook updates state                                           │
│     └─→ setUser(response.user) → userAtom updated                │
│     └─→ Shows success toast                                      │
│     └─→ Navigates to home                                        │
│                                                                  │
│  5. App re-renders                                               │
│     └─→ Navbar shows user name                                   │
│     └─→ Protected routes become accessible                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Token Refresh (Automatic)

```javascript
// In api/client.js - Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 Unauthorized?
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Attempt token refresh
      await apiClient.post('/refresh');
      // Retry original request
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

### Session Restoration on Page Load

```javascript
// In App.jsx - AuthInitializer component
useEffect(() => {
  const initAuth = async () => {
    try {
      await fetchProfile(); // Uses cookies automatically
    } catch {
      // User not authenticated - that's fine
    }
  };
  initAuth();
}, []);
```

---

## Crucial Functions & Patterns

### 1. **Token Refresh with Queue Management** (`api/client.js`)

```javascript
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};
```

**Why this matters:**
- Prevents multiple simultaneous refresh attempts
- Queues requests while refresh is in progress
- Retries all queued requests after successful refresh

### 2. **Debounced Search** (`components/SearchBar.jsx`)

```javascript
const [localSearch, setLocalSearch] = useState(searchTerm);

useEffect(() => {
  const timer = setTimeout(() => {
    onSearchChange(localSearch);
  }, 300); // 300ms debounce

  return () => clearTimeout(timer);
}, [localSearch]);
```

**Why this matters:**
- Prevents excessive filtering on every keystroke
- Waits for user to stop typing before filtering
- Reduces CPU usage and improves responsiveness

### 3. **Derived State with Jotai** (`atoms/moviesAtom.js`)

```javascript
export const filteredMoviesAtom = atom((get) => {
  const movies = get(moviesAtom);
  const searchTerm = get(movieSearchTermAtom).toLowerCase();
  const selectedGenre = get(selectedGenreFilterAtom);

  return movies.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm);
    const matchesGenre = !selectedGenre || 
      movie.genre?.some((g) => g.genre_name === selectedGenre);
    return matchesSearch && matchesGenre;
  });
});
```

**Why this matters:**
- Filtering logic centralized in one place
- Automatically recomputes when dependencies change
- Components stay simple - just read the filtered result

### 4. **Optimistic Caching** (`hooks/useMovies.js`)

```javascript
const fetchMovies = useCallback(async (force = false) => {
  // Skip if already loaded and not forcing
  if (movies.length > 0 && !force) return movies;
  
  setLoading(true);
  const data = await moviesApi.getAll();
  setMovies(data);
  setLoading(false);
}, [movies.length]);
```

**Why this matters:**
- Avoids unnecessary network requests
- Instant navigation between pages
- `force` parameter allows manual refresh

### 5. **Error Normalization** (`api/client.js`)

```javascript
const normalizedError = {
  message: error.response?.data?.error || error.message || 'An error occurred',
  status: error.response?.status,
  details: error.response?.data?.details,
};
return Promise.reject(normalizedError);
```

**Why this matters:**
- Consistent error shape across the app
- Components don't need to handle different error formats
- Easy to display user-friendly messages

### 6. **Protected Route Guard** (`components/ProtectedRoute.jsx`)

```javascript
export default function ProtectedRoute({ children, adminOnly = false }) {
  const user = useAtomValue(userAtom);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <AccessDenied />;
  }

  return children;
}
```

**Why this matters:**
- Centralized auth check for all protected routes
- Preserves intended destination for post-login redirect
- Supports role-based access control

### 7. **Image Error Handling** (`components/MovieCard.jsx`)

```javascript
const [imageError, setImageError] = useState(false);
const [imageLoaded, setImageLoaded] = useState(false);

<img
  src={imageError ? fallbackImage : movie.poster_path}
  onError={() => setImageError(true)}
  onLoad={() => setImageLoaded(true)}
  className={imageLoaded ? 'opacity-100' : 'opacity-0'}
/>
```

**Why this matters:**
- Graceful degradation when images fail
- Skeleton loading while images load
- Prevents broken image icons

---

## Responsiveness Strategy

### Mobile-First Approach

All styles start with mobile and scale up:

```css
/* Base: Mobile (default) */
.grid-cols-1

/* sm: 640px+ */
.sm:grid-cols-2

/* md: 768px+ */
.md:grid-cols-3

/* lg: 1024px+ */
.lg:grid-cols-4

/* xl: 1280px+ */
.xl:grid-cols-5
```

### Key Responsive Patterns

1. **Navigation Collapse**
   - Desktop: Horizontal nav links
   - Mobile: Hamburger menu with slide-down panel

2. **Grid Adaptation**
   - 1 column on mobile
   - Progressive increase to 5 columns

3. **Typography Scaling**
   ```jsx
   <h1 className="text-3xl md:text-4xl lg:text-5xl">
   ```

4. **Spacing Adjustment**
   ```jsx
   <div className="p-4 md:p-6 lg:p-8">
   ```

5. **Hide/Show Elements**
   ```jsx
   <span className="hidden md:inline">Full Text</span>
   <span className="md:hidden">Short</span>
   ```

---

## UX Best Practices Implemented

### 1. Loading States
Every async operation shows feedback:
```jsx
{loading ? <LoadingSpinner /> : <Content />}
```

### 2. Error Handling with Toasts
User-friendly error messages:
```javascript
toast.error(error.message);
```

### 3. Form Validation
- Real-time field validation
- Clear error messages
- Visual error indicators

### 4. Optimistic UI
- Cached data shows immediately
- Network requests happen in background

### 5. Accessibility
- Semantic HTML (`<nav>`, `<main>`, `<button>`)
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management

### 6. Empty States
Friendly messages when no content:
```jsx
<div className="text-center">
  <div className="text-6xl">🎬</div>
  <p>No movies found</p>
</div>
```

### 7. Progressive Enhancement
- App works without JavaScript initially
- Enhanced with React hydration

### 8. Visual Feedback
- Hover states on clickable elements
- Active states on buttons
- Focus rings for keyboard navigation

---

## Neubrutalism Design System

### Core Principles

1. **Bold Borders**: 3px solid black borders everywhere
2. **Hard Shadows**: Offset box shadows, no blur
3. **Vibrant Colors**: High contrast, saturated palette
4. **No Rounded Corners**: Sharp, geometric shapes
5. **Thick Typography**: Heavy font weights

### CSS Custom Properties

```css
:root {
  --shadow-brutal: 4px 4px 0px 0px #000;
  --border-width: 3px;
  
  --color-primary: #FF6B6B;   /* Coral Red */
  --color-secondary: #4ECDC4; /* Teal */
  --color-accent: #FFE66D;    /* Yellow */
  --color-bg: #FEF9EF;        /* Warm White */
}
```

### Utility Classes

```css
.brutal-border { border: 3px solid #000; }
.brutal-shadow { box-shadow: 4px 4px 0px 0px #000; }
.brutal-btn { /* button styles with hover/active states */ }
.brutal-card { /* card container */ }
.brutal-input { /* form input with focus effects */ }
```

### Interactive States

```css
.brutal-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px 0px #000;
}

.brutal-btn:active {
  transform: translate(4px, 4px);
  box-shadow: none;
}
```

---

## Performance Optimizations

### 1. Code Splitting Ready
```javascript
// Can easily add lazy loading
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'));
```

### 2. Image Optimization
- Lazy loading with `loading="lazy"`
- Fallback images for errors
- Skeleton loading states

### 3. Memoized Callbacks
```javascript
const fetchMovies = useCallback(async () => {
  // ...
}, [dependencies]);
```

### 4. Efficient Re-renders
- Jotai's atomic updates only re-render affected components
- Derived atoms prevent prop drilling

### 5. Network Optimization
- Request debouncing for search
- Caching to prevent duplicate fetches
- Token refresh queue prevents duplicate auth calls

### 6. Bundle Optimization
- Tree-shaking with ES modules
- Barrel exports for clean imports
- Vite's optimized production builds

---

## Quick Reference: Component → Hook → API

| User Action | Component | Hook Function | API Call |
|-------------|-----------|---------------|----------|
| View movies | MoviesPage | `fetchMovies()` | GET /movies |
| Search | SearchBar | `setSearchTerm()` | (client-side filter) |
| View details | MovieDetailPage | `fetchMovie(id)` | GET /movie/:id |
| Login | LoginPage | `login(creds)` | POST /login |
| Register | RegisterPage | `register(data)` | POST /register |
| Logout | Navbar | `logout()` | POST /logout |
| Recommendations | RecommendedPage | `fetchRecommended()` | GET /recommendedmovies |

---

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Note:** The backend server must be running on `localhost:8080` for API calls to work. The Vite dev server proxies `/api` requests to the backend.

---

## Summary

This frontend is built with a focus on:

1. **Maintainability**: Clear separation of concerns with hooks, atoms, and components
2. **Robustness**: Comprehensive error handling, loading states, and edge cases
3. **Responsiveness**: Mobile-first design that scales beautifully
4. **User Experience**: Instant feedback, smooth transitions, and clear messaging
5. **Performance**: Caching, debouncing, and efficient re-renders
6. **Accessibility**: Semantic HTML, ARIA labels, and keyboard support

The neubrutalism design creates a bold, memorable visual identity while the underlying architecture ensures the app is maintainable and scalable.

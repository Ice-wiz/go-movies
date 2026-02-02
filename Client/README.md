# MagicStream Movies - Frontend

A React.js frontend for MagicStream Movies with a **Neubrutalism** design style.

## Features

- User authentication (login/register/logout)
- Movie browsing with search and genre filtering
- Personalized movie recommendations
- Responsive design (mobile-first)
- Neubrutalism UI style

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **Tailwind CSS 4** - Styling
- **Jotai** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (requires backend on localhost:8080)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── api/          # HTTP client and API services
├── atoms/        # Jotai state atoms
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── pages/        # Route pages
├── App.jsx       # Main app with routing
└── index.css     # Global styles
```

## Documentation

See [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) for a comprehensive guide to the codebase, including:

- Architecture overview
- Data flow diagrams
- Authentication flow
- Crucial functions explained
- Responsiveness strategy
- UX best practices
- Performance optimizations

## API Endpoints Used

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /register | Create account | No |
| POST | /login | User login | No |
| POST | /logout | User logout | No |
| POST | /refresh | Refresh token | No |
| GET | /movies | All movies | No |
| GET | /genres | All genres | No |
| GET | /profile | User profile | Yes |
| GET | /movie/:id | Single movie | Yes |
| GET | /recommendedmovies | Personalized picks | Yes |

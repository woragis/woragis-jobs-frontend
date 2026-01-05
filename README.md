# Jobs Frontend

This is a SvelteKit frontend for the Jobs service.

## Features

- Job application management (create, view, list, update, delete)
- Status tracking and filtering
- Tag management
- Responsive UI with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `PUBLIC_JOBS_API_URL` - URL of the jobs backend service (default: http://localhost:3002)
- `PUBLIC_AUTH_API_URL` - URL of the auth service (default: http://localhost:3001)

3. Run development server:
```bash
npm run dev
```

## Architecture

The frontend follows a clean architecture pattern:

- **Types** (`src/lib/api/job-applications/types.ts`): TypeScript interfaces matching backend entities
- **API Client** (`src/lib/api/job-applications/client.ts`): Axios-based API client with authentication
- **Pages** (`src/routes/job-applications/`): Svelte components for UI

## API Integration

The frontend uses axios for HTTP requests with automatic token injection. Authentication tokens are stored in localStorage and automatically included in API requests.

## Pages

- `/` - Home page
- `/job-applications` - List all job applications with filters
- `/job-applications/new` - Create a new job application
- `/job-applications/[id]` - View and manage a specific job application

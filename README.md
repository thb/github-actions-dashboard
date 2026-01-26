# GitHub Actions Dashboard

A simple dashboard to monitor GitHub Actions workflow runs across multiple repositories, grouped by projects.

## Features

- **GitHub OAuth** - Single-user authentication with whitelist
- **Project Management** - Group repositories into projects
- **Workflow Status** - View latest workflow runs with status badges
- **Auto-refresh** - Updates every 30 seconds
- **Dark Mode** - GitHub-like dark theme

## Tech Stack

- **Framework**: TanStack Start (React 19 + Vite)
- **Database**: SQLite + Drizzle ORM
- **Auth**: GitHub OAuth via Arctic
- **Styling**: Tailwind CSS v4

## Setup

### Prerequisites

- Node.js 22+
- GitHub OAuth App (create one at https://github.com/settings/developers)

### Development

1. Clone the repository:
   ```bash
   git clone https://github.com/thb/github-actions-dashboard.git
   cd github-actions-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Configure your GitHub OAuth app:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback`

5. Update `.env` with your credentials

6. Run database migrations:
   ```bash
   npm run db:push
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

### Production

Build and run with Docker:

```bash
docker compose up -d
```

## Deployment

The app is configured to deploy on rdmpr-one via Traefik:

- URL: https://actions.daysplit.com
- Image: ghcr.io/thb/github-actions-dashboard:latest

## License

MIT

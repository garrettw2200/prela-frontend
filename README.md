# Prela Dashboard

React-based dashboard for the Prela AI Agent Observability Platform.

## Tech Stack

- React 18
- TypeScript
- Vite
- TanStack Query (React Query)
- TanStack Table
- Recharts (for visualizations)
- Tailwind CSS
- Zustand (state management)

## Environment Setup

The frontend uses Vite's built-in environment variable handling. Variables are prefixed with `VITE_` and are embedded into the build at compile time.

**Setup Steps:**

1. **Create your environment file:**
   ```bash
   cd frontend
   cp .env.example .env.development
   ```

2. **Configure required variables:**

   Open `.env.development` and set:

   - `VITE_CLERK_PUBLISHABLE_KEY` - **Required**. Get from [Clerk Dashboard](https://dashboard.clerk.com)
   - `VITE_API_BASE_URL` - **Optional**. API backend URL (defaults to `http://localhost:8000`)

   **Example `.env.development`:**
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Environment files:**

   - `.env.development` - Local development (gitignored, you create this)
   - `.env.production` - Production builds (gitignored, set via Railway)
   - `.env.local` - Local overrides (gitignored, highest priority)
   - `.env.example` - Template file (committed to git)

**Important Notes:**

- Environment variables are **build-time only** with Vite. Changes require rebuilding.
- Only variables prefixed with `VITE_` are exposed to the client code.
- Never commit `.env.development` or `.env.local` files - they're gitignored.
- The `.env` file is also gitignored for safety.
- For production deploys on Railway, set `VITE_API_BASE_URL` to your production backend URL.

**TypeScript Support:**

Environment variables are typed in [`src/vite-env.d.ts`](src/vite-env.d.ts). Your IDE will provide autocomplete and type checking for `import.meta.env.VITE_*`.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Format code
npm run format
```

## Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom hooks
├── lib/            # Utilities and helpers
├── pages/          # Page components
├── services/       # API services
├── stores/         # Zustand stores
├── types/          # TypeScript types
└── App.tsx         # Main app component
```

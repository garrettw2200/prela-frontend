/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Clerk publishable key for authentication
   * Required - the app will throw an error if not set
   */
  readonly VITE_CLERK_PUBLISHABLE_KEY: string

  /**
   * Base URL for API requests
   * Defaults to 'http://localhost:8000' in development
   * Should be set to production backend URL for production builds
   */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

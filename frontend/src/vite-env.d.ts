/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API origin, e.g. https://api.example.com (no trailing slash) */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

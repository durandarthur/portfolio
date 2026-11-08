/// <reference types="vite/client" />

// Types for the app's VITE_* environment variables (merged into Vite's own)
interface ImportMetaEnv {
  readonly VITE_FORM_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

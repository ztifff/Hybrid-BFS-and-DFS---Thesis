/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add other custom env variables here if you make them in the future
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
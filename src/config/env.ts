// src/config/env.ts
export const config = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || '',
} as const;
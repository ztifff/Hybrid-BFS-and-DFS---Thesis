// ============================================================
// MIDDLEWARE: cors.ts
// CORS configuration for Vite frontend (localhost:5173)
// ============================================================

import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://172.20.0.2:5173', // Docker network address (matches docker-compose)
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

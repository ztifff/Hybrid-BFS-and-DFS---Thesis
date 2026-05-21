// ============================================================
// MIDDLEWARE: cors.ts
// CORS configuration for local development and Vercel production
// ============================================================

import cors from 'cors';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Dynamically allow whatever origin the request is coming from.
    // If there is no origin (like Postman or cURL), fallback to '*'
    callback(null, origin || '*');
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
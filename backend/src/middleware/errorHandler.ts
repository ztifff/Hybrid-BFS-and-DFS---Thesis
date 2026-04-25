// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Simulation Error]: ${err.message}`);
  
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error during simulation.',
  });
};
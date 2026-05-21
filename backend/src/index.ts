// backend/src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';

// Middleware
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';

// Routes
import historyRoutes from './routes/history.routes';
import scenarioRoutes from './routes/scenario.routes';
import simulationRoutes from './routes/simulation.routes';
import networkRoutes from './routes/network.routes';

const app = express();

// 🚨 Set to your new port 3200
const PORT = process.env.PORT || 3200;

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log requests to the terminal
app.use(requestLogger);

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Backend container is healthy on port 3200.' });
});

// Hook up your API routes
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/network', networkRoutes);

// Error handling must be last
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Simulation Backend running on http://localhost:${PORT}`);
});
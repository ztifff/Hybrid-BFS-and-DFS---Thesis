// backend/src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';

// Import your newly fixed routes
import networkRoutes from './routes/network.routes';
import scenarioRoutes from './routes/scenario.routes';
import simulationRoutes from './routes/simulation.routes';

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
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Backend container is healthy on port 3200.' });
});

// Hook up your API routes
app.use('/api/network', networkRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/simulation', simulationRoutes);

// Error handling must be last
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Simulation Backend running on http://localhost:${PORT}`);
});
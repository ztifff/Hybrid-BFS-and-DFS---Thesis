// ============================================================
// ROUTES: simulation.routes.ts
// POST /api/simulation/run    → Run a simulation
// GET  /api/simulation/:id    → Get result by ID
// GET  /api/simulation/history → Get all history
// DELETE /api/simulation/:id  → Delete a result
// ============================================================

import { Router, Request, Response } from 'express';
import { SimulationController } from '../controllers/simulation.controller';

const router = Router();
const ctrl = new SimulationController();

router.post('/run', (req: Request, res: Response) => { ctrl.runSimulation(req, res); });
router.get('/history', (req: Request, res: Response) => { ctrl.getHistory(req, res); });
router.get('/:id', (req: Request, res: Response) => { ctrl.getById(req, res); });
router.delete('/:id', (req: Request, res: Response) => { ctrl.deleteById(req, res); });

export default router;
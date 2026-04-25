// ============================================================
// ROUTES: scenario.routes.ts
// GET  /api/scenarios          → List all scenarios
// GET  /api/scenarios/:id      → Get scenario by ID
// POST /api/scenarios/:id/run  → Run a preset scenario
// ============================================================

import { Router, Request, Response } from 'express';
import { ScenarioController } from '../controllers/scenario.controller';

const router = Router();
const ctrl = new ScenarioController();

router.get('/', (req: Request, res: Response) => { ctrl.listScenarios(req, res); });
router.get('/:id', (req: Request, res: Response) => { ctrl.getScenario(req, res); });
router.post('/:id/run', (req: Request, res: Response) => { ctrl.runScenario(req, res); });

export default router;
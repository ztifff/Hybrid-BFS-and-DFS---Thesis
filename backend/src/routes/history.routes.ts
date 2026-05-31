// ============================================================
// ROUTES: history.routes.ts
// GET    /api/history      → List all history
// POST   /api/history      → Save a history record
// GET    /api/history/:id  → Get specific history record
// DELETE /api/history/:id  → Delete specific record
// DELETE /api/history      → Delete multiple records (via body)
// ============================================================

import { Router, Request, Response } from 'express';
import { HistoryController } from '../controllers/history.controller';

const router = Router();
const ctrl = new HistoryController();

router.get('/', (req: Request, res: Response) => { ctrl.getHistory(req, res); });
router.post('/', (req: Request, res: Response) => { ctrl.createHistory(req, res); });
router.get('/:id', (req: Request, res: Response) => { ctrl.getById(req, res); });
router.delete('/:id', (req: Request, res: Response) => { ctrl.deleteHistory(req, res); });
router.delete('/', (req: Request, res: Response) => { ctrl.deleteHistory(req, res); });

export default router;
// ============================================================
// ROUTES: network.routes.ts
// GET /api/network             → List all network types
// GET /api/network/:type       → Get graph for a network type
// GET /api/network/:type/meta  → Get metadata for a network
// ============================================================

import { Router, Request, Response } from 'express';
import { NetworkController } from '../controllers/network.controller';

const router = Router();
const ctrl = new NetworkController();

// Added curly braces { } to ensure the function returns void instead of a Promise
router.get('/', (req: Request, res: Response) => { ctrl.listNetworks(req, res); });
router.get('/:type/meta', (req: Request, res: Response) => { ctrl.getNetworkMeta(req, res); });
router.get('/:type', (req: Request, res: Response) => { ctrl.getNetwork(req, res); });

export default router;
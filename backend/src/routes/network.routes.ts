import { Router } from 'express';
import { getGraphData } from '../controllers/network.controller';

const router = Router();

// Endpoint will be accessed via GET /api/network/graph?scenario=traffic&useRealWorld=true
router.get('/graph', getGraphData);

export default router;
import { Router, Request, Response } from 'express';
import { HistoryController } from '../controllers/history.controller';

const router = Router();
const ctrl = new HistoryController();

router.get('/',           (req: Request, res: Response) => { ctrl.getAll(req, res); });
router.get('/export/csv', (req: Request, res: Response) => { ctrl.exportCSV(req, res); });
router.get('/:id',        (req: Request, res: Response) => { ctrl.getById(req, res); });
router.post('/',          (req: Request, res: Response) => { ctrl.create(req, res); });
router.delete('/:id',     (req: Request, res: Response) => { ctrl.deleteById(req, res); });
router.delete('/',        (req: Request, res: Response) => { ctrl.deleteMany(req, res); });

export default router;

import {Router, Request, Response} from 'express';
import slotsRoutes from './slots';

const router = Router();

router.get('/slots', slotsRoutes.get);
router.patch('/slots', slotsRoutes.patch);
router.patch('/slots/:id', slotsRoutes.patchId);
router.get('/health', (req: Request, res: Response) => res.status(200).send(true));

export default router;

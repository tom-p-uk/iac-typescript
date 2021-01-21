import {Router} from 'express';
import slotsRoutes from './slots';

const router = Router();

router.get('/slots', slotsRoutes.get);
router.patch('/slots', slotsRoutes.patch);
router.patch('/slots/:id', slotsRoutes.patchId);

export default router;

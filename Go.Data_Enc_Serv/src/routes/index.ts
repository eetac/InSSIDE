import {Router} from 'express';

import encryptRouter from './encrypt'
import drmRouter from './drm'
const router:Router = Router();

router.use('/',encryptRouter);
router.use('/drm',drmRouter);

export default router;
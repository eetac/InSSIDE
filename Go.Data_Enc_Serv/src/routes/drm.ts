import { Router } from 'express';
import drmController from '../controllers/drmController'
import { EncryptCases } from '../lib/EncryptCases';

const router: Router = Router();

router.post('/login',drmController.login)
router.post('/register',drmController.register)
router.post('/key',drmController.getKeyOfCase)
router.post('/transferKey',drmController.dataKeyTransfer)


export default router;
import { Router } from 'express';
import drmController from "../controllers/drm.controller";
const router = Router();
router.post('/login',drmController.login)
router.post('/register',drmController.register)
router.post('/key',drmController.getKeyOfCase)
router.post('/transferKey',drmController.dataKeyTransfer)
export default router;
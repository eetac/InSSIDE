import { Router } from 'express';
import drmController from "../controllers/drm.controller";
const router = Router();
router.post('/login',drmController.login)
router.post('/register',drmController.register)
router.post('/license',drmController.getKeyOfCase)
router.post('/transferLicense',drmController.dataKeyTransfer)
export default router;
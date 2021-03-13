import { Router } from 'express';
import encryptController from "../controllers/encrypt.controller";
/*import {EncryptCases} from "../lib/EncryptCases";*/
const router = Router();


router.get('/encrypt',encryptController.encryptCases);
/*router.post('/decrypt',encryptController.decryptCase);*/

export default router;
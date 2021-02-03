import { Router } from 'express';
import encryptController from '../controllers/encryptController'
import { EncryptCases } from '../lib/EncryptCases';

const router: Router = Router();

const encrypt : EncryptCases = new EncryptCases;

router.get('/encrypt',encrypt.encryptCases.bind(encrypt));
router.post('/decrypt',encrypt.decryptCase.bind(encrypt))

//router.post('/text',testController.postInfo);

export default router;
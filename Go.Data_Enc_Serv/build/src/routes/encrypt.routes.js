"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const encrypt_controller_1 = __importDefault(require("../controllers/encrypt.controller"));
/*import {EncryptCases} from "../lib/EncryptCases";*/
const router = express_1.Router();
router.get('/encrypt', encrypt_controller_1.default.encryptCases);
router.post('/decrypt', encrypt_controller_1.default.decryptCase);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drm_controller_1 = __importDefault(require("../controllers/drm.controller"));
const router = express_1.Router();
router.post('/login', drm_controller_1.default.login);
router.post('/register', drm_controller_1.default.register);
router.post('/getLicense', drm_controller_1.default.getKeyOfCase);
router.post('/transferLicense', drm_controller_1.default.dataKeyTransfer);
exports.default = router;

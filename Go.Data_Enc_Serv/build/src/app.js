"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//Dependency Imports
const express_1 = __importDefault(require("express"));
// TODO: Future Token Authentication
/*import morgan from 'morgan';*/
/*import passport from 'passport';
import passportMiddleware from './middlewares/passport';*/
//Importing Routes files
const drm_routes_1 = __importDefault(require("./routes/drm.routes"));
const encrypt_routes_1 = __importDefault(require("./routes/encrypt.routes"));
/*let path = require('path');*/
const cors = require('cors');
//Starting Express
const app = express_1.default();
//Configuration
//Setting Port as Environment Provided else using 3000
app.set('port', process.env.PORT || 4000);
app.use(cors()); //Allow CORS!
app.use(express_1.default.static('views'));
//middlewares
/*app.use(morgan('dev'));*/
//Against deprecation warning of bodyparser
app.use(express_1.default.urlencoded({ extended: true }));
// parse application/json
app.use(express_1.default.json());
//Passport JWT
/*app.use(passport.initialize());
passport.use(passportMiddleware);*/
//API Routes
app.use('/drm', drm_routes_1.default);
app.use('/', encrypt_routes_1.default);
//Export the server as 'app'
exports.default = app;

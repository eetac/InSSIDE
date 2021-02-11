//Dependency Imports
import express from 'express';
// TODO: Future Token Authentication
/*import morgan from 'morgan';*/
/*import passport from 'passport';
import passportMiddleware from './middlewares/passport';*/

//Importing Routes files
import drmRoutes from './routes/drm.routes';
import encryptRoutes from './routes/encrypt.routes';

/*let path = require('path');*/
const cors = require('cors');

//Starting Express
const app = express();
//Configuration
//Setting Port as Environment Provided else using 3000
app.set('port', process.env.PORT || 4000);
app.use(cors());//Allow CORS!
app.use(express.static('views'));
//middlewares
/*app.use(morgan('dev'));*/

//Against deprecation warning of bodyparser
app.use(express.urlencoded({extended: true}));
// parse application/json
app.use(express.json());
//Passport JWT
/*app.use(passport.initialize());
passport.use(passportMiddleware);*/


//API Routes
app.use('/drm', drmRoutes);
app.use('/', encryptRoutes);

//Export the server as 'app'
export default app;
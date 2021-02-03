import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import router from './routes/index'
import { initiateDB } from './database' 
//Inicialización
const app = express();
const port = 3000

//Config
app.use(cors());
app.options('*',cors());
app.use( express.json() );
app.use( '', router );
app.use( bodyParser.json() );



//Middlewares
app.use(express.json()); //Entender JSON
app.use(express.urlencoded({extended: false}));



//Server init
initiateDB();
app.listen(port, () => {
    console.log("Server listening at http://localhost:"+port)
})
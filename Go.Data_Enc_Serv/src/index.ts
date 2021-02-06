import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import router from './routes/index'
import dbHandler from './database' 
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
app.use(express.json()); //Parse JSON
app.use(express.urlencoded({extended: false}));



//Server init
dbHandler.initiateDB().then((res)=>{
    //No DB Initiation error
    dbHandler.createAdmin().then(()=>{
        app.listen(port, () => console.log("Server listening at http://localhost:" + port));
    }).catch((err)=>{
        //Some Unforseen error
        console.log("Error creating default admin, server won't be ran \n: "+err);
    });
}).catch((error)=>{
    console.log('Connection Error w/DB \n: '+error);
});

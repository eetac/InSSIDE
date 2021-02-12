//Main Execution File of the Server
import app from './app'; //Exported App importing here
//Execute Connection to BDD before launching the Server
import dbHandler from './database';
import dbWatcher from './helpers/goData.watcher';
//Server definition
const packageJson = require('../package.json')
//Error Handling - Server
const onError = (error: NodeJS.ErrnoException): void => {
    if (error.syscall !== 'listen') throw error
    let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port
    /*let bind = 'Port ' + port*/
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}
//Event Listening - Server
const onListening = (): void => {
    // tslint:disable-next-line:max-line-length
    console.log(`${packageJson.name} ${packageJson.version} listening on http://localhost:${port}!`)
}
//Initiating Server
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:4200");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With,Content-Type, Accept");
    next();
});
let server = require('http').Server(app);
const port = app.get('port');

server.on('error', onError);
server.on('listening', onListening);

// Database Watcher
dbWatcher.listenDB().then(r => {
    console.log(r);
}).catch(err=>{
    console.log(err);
});
//Database Connection Initialization
/*dbHandler.initiateDB().then((res)=>{*/
    //No DB Initiation error
    dbHandler.createAdmin().then(()=>{
        // changeStream MongoDb GoData
        /*dbHandler.initiateDBGoData().then((client)=>{*/
            /*const client = mongo2.connection.client;*/

            // Everything ok, server initialization
            server.listen(port);
    }).catch((err)=>{
        //Some unexpected error occurred!
        console.log("Error creating default admin, server won't be ran : "+err);
    });
/*}).catch((error)=>{
    console.log('Connection Error w/DB \n: '+error);
});*/

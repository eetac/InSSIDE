"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//Main Execution File of the Server
const app_1 = __importDefault(require("./app")); //Exported App importing here
//Execute Connection to BDD before launching the Server
const database_1 = __importDefault(require("./database"));
const config = require('./configurations/config');
//Server definition
const path = require('path');
const packageJson = require('../package.json');
/*const autoEncrypt = require('./workers/worker')*/
/*import autoEncrypt from "./workers/worker";*/
/*const { Worker } = require('worker_threads')*/
/*const { fork } = require('child_process');*/
const child_process = require('child_process');
//Error Handling - Server
const onError = (error) => {
    if (error.syscall !== 'listen')
        throw error;
    let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
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
};
// Event Listening - Server
const onListening = () => {
    // tslint:disable-next-line:max-line-length
    console.log(`${packageJson.name} ${packageJson.version} listening on http://localhost:${port}!`);
};
// Origin and Header control
app_1.default.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:4200");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With,Content-Type, Accept");
    next();
});
// Child Process to be executed for autoEncrypt
/*function runService(/!*workerData:any*!/) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.resolve(__dirname,'workers/migration.js'), {
            workerData: {
                path: 'worker.ts'
            }
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code: number) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        })
    })
}*/
async function runOffThread() {
    /*const result = await runService()
    console.log(result);*/
    /*const n = fork(path.resolve(__dirname,'workers/migration.js'));*/
    let workerProcess = child_process.spawn('node', [path.resolve(__dirname, 'workers/migration.js')]);
    workerProcess.stdout.on('data', function (data) {
        console.log('childProcess: ' + data);
    });
    workerProcess.stderr.on('data', function (data) {
        console.log('childProcess Error: ' + data);
    });
    workerProcess.on('close', function (code) {
        console.log('child process exited with code ' + code);
    });
    /*const child = fork('./src/workers/worker.ts');
    console.log(process.execArgv);
    /!*child.on('message', (message: string) => {
        console.log('Result: ', message)
    });*!/
    child.kill('SIGINT');*/
}
process.on('beforeExit', (code) => {
    console.log('Process beforeExit event with code: ', code);
});
process.on('exit', (code) => {
    console.log('Process exit event with code: ', code);
});
// Server Initialization and Port mapping
let server = require('http').Server(app_1.default);
const port = app_1.default.get('port');
server.on('error', onError);
server.on('listening', onListening);
//Database Connection Initialization
database_1.default.initiateDB().then((res) => {
    //No DB Initiation error
    database_1.default.createAdmin().then(() => {
        // Everything ok, server initialization
        server.listen(port);
        // Create 2nd Thread where the autoEncrypt works every X min
        /*autoEncrypt.timerEncrypt();*/
        if (config.autoEncryptSeconds > 0)
            runOffThread().catch(err => console.error(err));
    }).catch((err) => {
        //Some unexpected error occurred!
        console.log("Error creating default admin, server won't be ran : " + err);
    });
}).catch((error) => {
    console.log('Connection Error w/DB \n: ' + error);
});

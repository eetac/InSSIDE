const path = require('path');
/*const { workerData } = require('worker_threads');*/

require('ts-node').register();
console.log(path.resolve(__dirname, 'worker.ts'));
require(path.resolve(__dirname, 'worker.ts'));
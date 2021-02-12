const mongoose = require('mongoose');
import config from "./configurations/config";
function makeNewConnection(uri: string) {
    const db = mongoose.createConnection(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    db.on('error', (error: any) => {
        // @ts-ignore
        console.log(`MongoDB :: connection ${this.name} ${JSON.stringify(error)}`);
        // @ts-ignore
        db.close().catch(() => console.log(`MongoDB :: failed to close connection ${this.name}`));
    });

    db.on('connected', () => {
        mongoose.set('debug', (col: any, method: any, query: any, doc: any) => {
            // @ts-ignore
            console.log(`MongoDB :: ${this.conn.name} ${col}.${method}(${JSON.stringify(query)},${JSON.stringify(doc)})`);
        });
        // @ts-ignore
        console.log(`MongoDB :: connected ${this.name}`);
    });

    db.on('disconnected', function () {
        // @ts-ignore
        console.log(`MongoDB :: disconnected ${this.name}`);
    });

    return db;
}

const drmConnection = makeNewConnection(config.DB.URI);
const goDataConnection = makeNewConnection(config.DBGoData.URI);

module.exports = {
    drmConnection,
    goDataConnection,
};

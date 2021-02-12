/*import {Connection, connection, ConnectionOptions, Schema} from "mongoose";*/
/*const mongoose = require('mongoose');*/
import config from "../configurations/config";
const MongoClient = require("mongodb").MongoClient;
/**===========================================================
* ?  initiateDBWatch function connects to the database and resolves
* *   if the connection was successful or rejects when it wasn't
    *============================================================**/
function initiateDBWatch() {
    return new Promise(async (resolve,reject )=>{
        try {
            /*
            Modify Change Stream Output using Aggregation Pipelines
            You can control change stream output by providing an array of one or more of the following pipeline stages when configuring the change stream:
            $match, $project, $addFields, $replaceRoot, $redact
            See Change Events for more information on the change stream response document format.
            */
            const pipeline = [
                {
                    "$match": {
                        "operationType":{
                          "$in":[
                              "insert"
                          ]
                        }
                    }
                }
            ];
            let con = await MongoClient.connect(config.DBGoData.URI, {"useNewUrlParser": true,useUnifiedTopology: true})
            watch_insert(con, 'go-data', 'person',pipeline)
            return resolve({message:"ChangeStream Executed on GoData DB"});
            /*const dbOptions: ConnectionOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            };*/
            /*const conn = mongoose.createConnection(config.DBGoData.URI,dbOptions).useDb("go-data");
            conn.collection("Person", function (err:any, personsCollection:any) {
                personsCollection.find({}).toArray(function(err:any, data:any){
                    console.log(data); // it will print your collection data
                }).finally(()=>{
                    return resolve({message:"ChangeStream Executed on GoData DB"})
                });
            });*/
            /*const changeStream = personsCollection.watch().on('change', (data: any) => console.log(data));*/
                /*const db = connectionRes.db;
                const collection = db.collection('persons');
                const changeStream = collection.watch();
                changeStream.on('change', (next: any) => {
                    console.log(next);
                });*/

        }catch (e) {
            console.log(e);
            return reject(e)
        }
    });
}
function watch_insert(con:any, db:string, collection:string,pipeline:any) {
    console.log(new Date() + ' watching: ' + collection)
    // Cannot execute change stream as the version of mongodb go-data is 3.2.21
    con.db(db).collection(collection).watch(pipeline)
        .on('change', (data:any) => {
            console.log(data)
        });
}

function listenDB(/*conditions: { _id: { $gt: any; }; }*//*, callback: any*/) {
    return new Promise(async (resolve,reject )=>{
        try {
            let conditions= { _id: {}};
            MongoClient.connect(config.DBGoData.URI, {"useNewUrlParser": true,useUnifiedTopology: true}).then((con:any)=>{
            let coll = con.db("go-data").collection('person')
            let latestCursor = coll.find({}).sort({$natural: -1}).limit(1)
            latestCursor.next(function(err:any, latest:any) {
                if (latest) {
                    conditions._id = {$gt: latest._id}
                }
                let options = {
                    tailable: true,
                    await_data: true,
                    numberOfRetries: -1
                }
                try {
                    let stream = coll.find({}, options).sort({$natural: -1}).stream()
                    stream.on('data', (data: any) => {
                        console.log(data);
                    })
                    return resolve({message:"Tailable Watch Cursor started..."})
                }catch(e){
                    return reject(e);
                }
            })

        }).catch((err:any)=>{
            console.log(err);
            });
        }catch (e) {
            console.log(e);
            return reject(e)
        }
    });
}
export default { listenDB };
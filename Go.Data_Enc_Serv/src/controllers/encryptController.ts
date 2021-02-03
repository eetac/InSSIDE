import { Request, Response, json } from 'express';

//We send a message to the client
function encryptInfo(req:Request,res:Response){
    console.log("GET received")
    res.status(200).send({msg:"Hello from the Server"});
}
//We send the message that the client has sended
function postInfo(req:Request,res:Response){
    console.log("POST received")
    let text: String = req.body.text;
    console.log("Message sended from the user: "+text);
    res.status(200).send({info: text});
}
export default {encryptInfo, postInfo}
// CRUD Web Server

const {client} = require('./db')
client.connect();

const PORT = 3000;
const express = require('express');

const server = express()
const apiRouter = require('./api');

const bodyParser = require('body-parser');
server.use(bodyParser.json());

const morgan = require('morgan');
server.use(morgan('dev'))


// server.use((req, res, next) =>{
    // console.log("<______ Body Logger START _____>");
    // console.log(req.body);
    // console.log("<______Body Logger Ends _____>");
    // next();
// });
// 
// 
// 
// server.get('/', (req, res, next) => {
    // res.send("all love")
// })
// 
// server.use('/api', (req, res, next) => {
//     console.log("A request was made to /api(this is the middleware)")
//     next()
// })
// 

// server.get('/api', (req, res, next) => {
//     console.log("A request was made to /api");
//     res.send({message: "succes"});
// });

server.use('/api', apiRouter);

// server.post('/api/burrito', (req, send, next)=>{
//     ("A request was made to /api/burrito")
//     response.send({message: "carne asada"})
// })
//curl -X POST http://127.0.0.1:3000/api/burrito

server.listen(PORT, ()=>{
    console.log('The server is Up on port', PORT)
});
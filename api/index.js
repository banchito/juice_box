const express         = require('express');
const apiRouter       = express.Router();
const postsRouter     = require('./posts');
const tagsRouter      = require('./tags');
const usersRouter     = require('./users');
const jwt             = require('jsonwebtoken');
require('dotenv').config();


const { getUserById } = require('../db');
const { nextTick } = require('process');

const { JWT_SECRET }  = process.env;

apiRouter.use(async(req, res, next) => {
    const prefix    = "Bearer ";
    const auth      = req.header("Authorization");

    if(!auth){ 
        next();
    } else if(auth.startsWith(prefix)){
        const token = auth.slice(prefix.length);
        try{
            const {id} = jwt.verify(token, JWT_SECRET);
            if (id){
                req.user = await getUserById(id)
                next()
            }
        }catch ({name, message}){
            next({ name, message })
        }
    } else {
        next({
            name: 'AuthorizationHeaderError',
            message: `Authorization token must start with ${ prefix }`   
        })
    }
})

apiRouter.use((req, res, next) => {
    console.log(req);
    if(req.user){
        console.log("User is set:", req.user);
    }
    next()
})

apiRouter.use('/users', usersRouter);
apiRouter.use('/posts', postsRouter)
apiRouter.use('/tags', tagsRouter);
apiRouter.use((error, req, res, next)=>{
    res.send( error);
})

module.exports = apiRouter;
const express = require('express');
const postsRouter = express.Router();
const { getAllPosts } = require('../db');


postsRouter.use((req, res, next)=>{
    console.log("A request it's beign made to /posts");
    next()
});

postsRouter.get('/', async(req, res)=>{
    const posts = await getAllPosts();
    console.log("posts are: ", posts)
    res.send({
        posts
    });
});

module.exports = postsRouter;

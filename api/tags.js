const express = require('express');
const tagsRouter = express.Router();
const { getAllTags } = require('../db');

tagsRouter.use((req,send, next)=>{
    console.log("A request it's beign made to /tags");
    next()
})

tagsRouter.get('/', async (req, res, next)=>{
    const tags = await getAllTags();
    console.log('tags are:', tags)
    res.send({
        tags
    })
})

module.exports = tagsRouter;
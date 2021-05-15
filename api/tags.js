const express = require('express');
const { nextTick, send } = require('process');
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require('../db');

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

tagsRouter.get('/:tagName/posts', async(req, res, next) => { //why /posts
    console.log('reqparams at tags:', req.params);
    try{
    const {tagName} = req.params;
    const postsByTagName = await getPostsByTagName(tagName);
    const posts = postsByTagName.filter((post) => { 
        return post.active || (req.user && req.author.id === req.user.id)
    })
    res.send({posts: posts})
    } catch ({name, message}){
        next({name: 'unsuscesful get posts by tagName', message: 'could not find posts by tag name'})
    }
})

module.exports = tagsRouter;
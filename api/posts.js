const express = require("express");
const { emptyQuery } = require("pg-protocol/dist/messages");
const postsRouter = express.Router();
const { getAllPosts, createPost, updatePost, getPostById } = require("../db");
const { requireUser } = require("./utils");

postsRouter.use((req, res, next) => {
  console.log("A request it's being made to /posts");
  console.log("req.user: ", req.user);
  next();
});

postsRouter.post("/", requireUser, async (req, res, next) => {
  let { title, content, tags = "" } = req.body;

  let tagArr = tags.trim().split(/\s+/);
  let postData = {};

  if (tagArr.length) {
    postData.tags = tagArr;
  }

  try {
    postData = {
      authorId: req.user.id,
      title: title,
      content: content,
      tags: postData.tags,
    };

    const post = await createPost(postData);

    console.log(post);
    if (post) {
      res.send({ post });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.patch("/:postId", requireUser, async (req, res, next) => {
  console.log("req params: ", req.params);
  const { postId } = req.params;
  const { title, content, tags } = req.body;
  const updatedFields = {};

  if (tags && tags.length > 0) updatedFields.tags = tags.trim().split(/\s+/);

  if (title) updatedFields.title = title;

  if (content) updatedFields.content = content;

  try {
    const originalPost = await getPostById(postId);
    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updatedFields);
      res.send({ post: updatedPost });
    } else {
      next({
        name: "UnauthorizedUserError",
        message: "You cannot update a post that is not yours",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.delete("/:postId", requireUser, async (req, res, next) => {
  try {
    const post = await getPostById(req.params.postId);
    if (post && post.author.id === req.user.id) {
      const updatedPost = await updatePost(post.id, { active: false });
      res.send({ post: updatedPost });
    } else {
      next(
        post
          ? {
              name: "UnauthorizedUserError",
              message: "You cannot delete a post which is not yours",
            }
          : {
              name: "PostNotFoundError",
              message: "That post does not exist",
            }
      );
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.get("/", async (req, res) => {
  try {
    const allPosts = await getAllPosts();
    const posts = allPosts.filter((post) => {
        
        return post.active || (req.user && post.author.id === req.user.id);
    });

    console.log("posts are: ", posts);

    res.send({
      posts
    });
  }catch ({name, message}){
      next({name, message})
  }
});

module.exports = postsRouter;

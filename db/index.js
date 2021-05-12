const { promises } = require("fs");
const { Client } = require("pg");
// const { rows } = require("pg/lib/defaults");
// const { errorMonitor } = require("stream");

const client = new Client("postgres://localhost:5432/juiceboxdev");

const createUser = async ({ username, password, name, location }) => {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
        INSERT INTO users(username, password, name, location) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING 
        RETURNING * ;
        `,
      [username, password, name, location]
    );
    return user;
  } catch (error) {
    throw error;
  }
};

const getAllUsers = async () => {
  try {
    const { rows } = await client.query(
      `SELECT id, username, name, location, active FROM users;`
    );
    return rows;
  } catch (error) {
    throw error;
  }
};

const getUserById = async(userId) =>{
    try{
        const { rows : [user]} = await client.query(
            `SELECT id, username, name, location, active FROM users WHERE id=${userId};`
        )
        if (!user) {return null}
        user.posts = await getPostsByUser(userId);
        
        //delete user.password;
        return user;
    }catch(error){
        throw error;
    }
}


const updateUser = async (id, fields = {}) => {
  // build the set string
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");
  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }
  console.log(setString);
  try {
    const {
      rows: [user]
    } = await client.query(
      `
          UPDATE users
          SET ${setString}
          WHERE id=${id}
          RETURNING *;
        `,
      Object.values(fields)
    );

    return user;
  } catch (error) {
    throw error;
  }
};

const createPost = async ({authorId, title, content, tags = []}) => {
  try {
    const {
      rows: [post]
    } = await client.query(
      `
            INSERT INTO posts("authorId", title, content)
            VALUES($1, $2, $3)
            RETURNING *;
        `,
      [authorId, title, content]
    );
    const tagList = await createTags(tags)
    return await addTagsToPost(post.id, tagList)
  } catch (error) {
    throw error;
  }
};

const updatePost = async (postId, fields = {}) => {

    const { tags } = fields;
    delete fields.tags;


  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  //if (setString.length === 0) {return;}

  try {
       // update any fields that need to be updated
      if (setString.length > 0){
     await client.query(
      `UPDATE posts
            SET ${setString}
            WHERE id=${postId}
            RETURNING *;
            `,
      Object.values(fields)
    );
  }

  // return early if there's no tags to update
  if (tags === undefined) {
    return await getPostById(postId);
  }
  // make any new tags that need to be made
  const tagList = await createTags(tags);
  const tagListIdString = tagList.map(
    tag => `${ tag.id }`
  ).join(', ');

  // delete any post_tags from the database which aren't in that tagList
  await client.query(`
  DELETE FROM post_tags
  WHERE "tagId"
  NOT IN (${ tagListIdString })
  AND "postId"=$1;
`, [postId]);

// and create post_tags as necessary
await addTagsToPost(postId, tagList);

return await getPostById(postId);

    
  } catch (error) {
    throw error;
  }
};

const getAllPosts = async () => {
  try {
    const { rows: postIds } = await client.query(`SELECT * FROM posts;`);

    const posts = await Promise.all(postIds.map(post => getPostById(post.id)));

    return posts;
  } catch (error) {
    throw error;
  }
};

const getPostsByUser = async(userId) =>{
    try{
        const {rows: postIds} = await client.query(
            `SELECT id FROM posts
                WHERE "authorId"=${userId};
            `
        );
        //  console.log("this is from postbyuser:", postIds)
         const posts = await Promise.all(postIds.map(post => getPostById(post.id) ))
        //  , rows: postIds
         return posts;
    }catch(error){
        throw error;
    }
}

const createTags = async (tagList) => {
    if(tagList.length === 0) return;

    // need something like: $1), ($2), ($3 
  const insertValues = tagList.map((_, index) => `$${index + 1}`).join('), (');
  // then we can use: (${ insertValues }) in our string template

  // need something like $1, $2, $3
  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(', ');
  // then we can use (${ selectValues }) in our string template

  console.log(insertValues, selectValues)

  const query = `INSERT INTO tags(name)
  VALUES (${insertValues})
  ON CONFLICT (name) DO NOTHING;`
  console.log(query)

  try{
    await client.query(query, tagList);

    const {rows} = await client.query(`
    SELECT * FROM tags
    WHERE name
    IN (${selectValues});
    `, tagList);
     return rows

  }catch(error){
    throw error
  }
}

const createPostTag = async (postId, tagId) => {
    try{
        await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING;
        `, [postId, tagId])
    }catch(error){
        throw error
    }
}

const getAllTags = async () =>{
    try{
      const {rows} =await client.query(`SELECT * FROM tags;`)
      return rows;
    }catch(error){
      throw error
    }
}

const addTagsToPost = async (postId, tagList) => {
    try{
        const createPostTagPromises = tagList.map(tag => createPostTag(postId, tag.id));
        await Promise.all(createPostTagPromises)
        return await getPostById(postId)
    }catch(error){
        throw error
    }
}

const getPostById = async(postId) =>{
    try{

        const {rows: [post]} = await client.query(`
                SELECT * FROM posts WHERE id=$1
        `, [postId]);

        const  {rows: tags} = await client.query(`
            SELECT tags.*
            FROM tags
            JOIN post_tags ON tags.id=post_tags."tagId"
            WHERE post_tags."postId"=$1;
        `,[postId]);

        const {rows: [author]} =  await client.query(`
            SELECT id, username, name, location
            FROM users
            WHERE id=$1;
        `,[post.authorId]);

        post.tags = tags;
        post.author = author;

        delete post.authorId;
        return post;
    }catch(error){
        throw error
    }
}

async function getPostsByTagName(tagName) {
    try {
      const { rows: postIds } = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;
      `, [tagName]);
  
      return await Promise.all(postIds.map(
        post => getPostById(post.id)
      ));
    } catch (error) {
      throw error;
    }
  } 

module.exports = {
  client,   
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getUserById,
  createTags,
  addTagsToPost,
  getPostById,
  getPostsByUser,
  getPostsByTagName,
  getAllTags
};

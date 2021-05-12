// const { create } = require("domain");
// const { user } = require("pg/lib/defaults");

const { clearScreenDown } = require("readline");
const {
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
} = require("./index");

async function testDB() {
  try {
    console.log("Starting to test database...");

    const users = await getAllUsers();
    console.log("getAllUsers:", users);

    console.log("Calling updateUser on users[0]");
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY",
    });
    console.log("Result:", updateUserResult);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("posts Result:", posts);

    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New Title",
      content: "Updated Content",
    });
    console.log("updatePostResult Result:", updatePostResult);

    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Result:", albert);
    

    console.log("Calling getPostId with 1");
    const post1 = await getPostById(1);
    console.log("result", post1);

    console.log("Calling updatePost on posts[1], only updating tags");
    const updatePostTagsResult = await updatePost(posts[1].id, {
      tags: ["#youcandoanything", "#redfish", "#bluefish"]
    });
    console.log("Result:", updatePostTagsResult);

    console.log("Calling getPostsByTagName with #happy");
    const postsWithHappy = await getPostsByTagName("#happy");
    console.log("Result getPost by Tag Name:", postsWithHappy);

    console.log("Calling getAllTags");
    const getAllTags = await getAllTags()
    console.log("results getAllTags: ", getAllTags);

    console.log("Finished database tests!");
  } catch (error) {
    console.error("Error testing database!");
    console.log(error);
    throw error;
  } finally {
    client.end();
  }
}

// this function should call a query which drops all tables from our database
const dropTables = async () => {
  try {
    console.log("Starting to drop tables...");

    await client.query(`
         DROP TABLE IF EXISTS post_tags;
         DROP TABLE IF EXISTS tags;
         DROP TABLE IF EXISTS posts;
         DROP TABLE IF EXISTS users;
    `);

    console.log("Finished dropping tables!");
  } catch (error) {
    console.error("Error dropping tables!");
    console.log(error);
    throw error;
  }
};

// this function should call a query which creates all tables for our database
const createTables = async () => {
  try {
    console.log("Starting to build tables...");

    await client.query(`
        CREATE TABLE users(
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL,
            name varchar(255) NOT NULL,
            location varchar(255) NOT NULL,
            active boolean DEFAULT true
        );
        CREATE TABLE posts(
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id),
            title varchar(255) NOT NULL,
            content TEXT NOT NULL,
            active boolean DEFAULT true    
        );
        CREATE TABLE tags(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
        );
        CREATE TABLE post_tags(
            "postId" INTEGER REFERENCES posts(id) ,
            "tagId" INTEGER REFERENCES tags(id),
            UNIQUE("postId","tagId")
        );
        `);

    console.log("Finished building tables!");
  } catch (error) {
    console.error("Error building tables!");
    throw error;
  }
};

const createInitialUsers = async () => {
  try {
    console.log("Starting to create users...");

    await createUser({
      username: "albert",
      password: "bertie99",
      name: "Al Bert",
      location: "Sidney, Australia",
    });
    await createUser({
      username: "sandra",
      password: "2sandy4me",
      name: "Just Sandra",
      location: "Ain't tellin'",
    });
    await createUser({
      username: "glamgal", 
      password: "soglam",
      name: "Joshua",
      location: "Upper East Side",
    });

    console.log("Finished creating users!");
  } catch (error) {
    console.error("Error creating users!");
    throw error;
  }
};

const createInitialPosts = async () => {
  try {
    const [albert, sandra, glamgal] = await getAllUsers();
    
    
    console.log("Starting to create posts...");
    await createPost({
      authorId: albert.id,
      title: "First Post",
      content:
        "This is my first post. I hope I love writing blogs as much as I love writing them.",
      tags: ["#happy", "#youcandoanything"]
    });
    await createPost({
      authorId: sandra.id,
      title: "First Post",
      content: "I am Sandra",
      tags: ["#happy", "#worst-day-ever"]
    });
    await createPost({
      authorId: glamgal.id,
      title: "First Post",
      content: "I am Glamgal.",
      tags: ["#happy", "#youcandoanything", "#canmandoeverything"]
    });
    console.log("Finished creating posts!");
  } catch (error) {
    throw error;
  }
};

// const createInitialTags = async() =>{
    // try{    
        // console.log("Starting to create tags...");
        // const  [happy, sad, inspo, catman] = await createTags([
            // '#happy', 
            // '#worst-day-ever', 
            // '#youcandoanything',
            // '#catmandoeverything'
        // ])
        // const [postOne, postTwo, postThree] = await getAllPosts();
// 
    // await addTagsToPost(postOne.id, [happy, inspo]);
    // await addTagsToPost(postTwo.id, [sad, inspo]);
    // await addTagsToPost(postThree.id, [happy, catman, inspo]);
    // console.log("Finished creating tags!");
    // }catch(error){
        // console.log("Error creating tags!");
        // throw error
    // }
// }


async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
  } catch (error) {
    throw error;
  }
}

rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());
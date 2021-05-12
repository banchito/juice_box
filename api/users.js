const express = require('express');
const usersRouter = express.Router();
const { getAllUsers, getUserByUsername } = require('../db');



usersRouter.use((req, res, next)=>{
    console.log("A request is being made to /users");
    next()
});

usersRouter.get('/', async (req, res) => {
    const users = await getAllUsers();
    res.send({
      users
    });
});

usersRouter.post('/login', async (req, res, next)=>{
    const {username, password} = req.body;

    // request must have both
  if (!username || !password) {
    next({
      name: "MissingCredentialsError",
      message: "Please supply both a username and password"
    });
  }

  try{
      const user = await getUserByUsername(username);
      if(user && user.password == password){
          // create token & return to user
          res.send({ message: "you're logged in!" });
      }else{
        next({ 
            name: 'IncorrectCredentialsError', 
            message: 'Username or password is incorrect'
          });
      }
  }catch(error){
      console.log(error);
      next(error);
  }
    
})
module.exports = usersRouter;
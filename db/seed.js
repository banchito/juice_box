const { create } = require("domain");
const { user } = require("pg/lib/defaults");

const { client, getAllUSers, createUser } = require("./index");

async function testDB() {
  try {
    console.log("Starting to test database...");

    const users = await getAllUSers();
    console.log("getAllUsers:", users);
    console.log("Finished database tests!");
  } catch (error) {
    console.error("Error testing database!");
    console.log(error);
  } finally {
    client.end();
  }
}

// this function should call a query which drops all tables from our database
const dropTables = async () => {
  try {
    console.log("Starting to drop tables...");
    await client.query(`
        DROP TABLE IF EXISTS users;
        `);
    console.log("Finished dropping tables!");
  } catch (error) {
    console.error("Error dropping tables!");
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
            password varchar(255) NOT NULL
        )
        `);
    console.log("Finished building tables!");
  } catch (error) {
    console.error("Error building tables!");
    throw error;
  }
};

async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
  } catch (error) {
    throw error;
  }
}

const createInitialUsers = async() => {
    try {
        console.log("Starting to create users...")

        const albert = await createUser({ username: 'albert', password: 'bertie99' });
        const sandra = await createUser({username: 'sandra', password: '2sandy4me'});
        const glamgal = await createUser({username: 'glamgal', password:'soglam'});
        
        console.log(albert, sandra, glamgal)

        
        console.log("Finished creating users!");
    } catch(error) {
      console.error("Error creating users!");
      throw error;
    }
}


rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());

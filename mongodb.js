// ------------------------------------------ To perform CRUD operations
/*
  * short cut --- const { MongoClient, ObjectID } = require("mongodb");
*/
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient
const ObjectID = mongodb.ObjectId

// Require 'dotenv'
require("dotenv").config();

// define "connectionURL" of the database we are trying to connect to...
const uri = process.env.MONGODB_URI;

// set database name
const databaseName = "task-manager";

// ObjectID constructor
const id = new ObjectID("663986424fb304f653a3ff07")

// connect to mongodb atlas
MongoClient.connect(uri)
  .then((client) => {
    console.log("connected to database!");

    // accessing database through client.db()
    const db = client.db(databaseName);

    db.collection('users').find({ age: {$gt: 10 } }).toArray()
    .then((res) => {
      console.log(res)
    })
    .catch((err) => {
      console.log(err)
    })

  })
  .catch((error) => {
    console.log("error in connecting!", error);
  });

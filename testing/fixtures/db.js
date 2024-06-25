const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');

const User = require('../../src/models/user')
const Task = require('../../src/models/task')

// create an Id for user
const userOneId = new mongoose.Types.ObjectId()

// create a dummy-user
const userOne = {
  _id: userOneId,
  name: "user-one",
  email: "user@one.com",
  password: "DB.user.1@111",
  tokens: [{
    token: jwt.sign( {_id: userOneId}, process.env.JWT_SECRET_STR )
  }]
}

// another dummy-user
const userTwoId = new mongoose.Types.ObjectId()

const userTwo = {
  _id: userTwoId,
  name: "user-two",
  email: "user@two.com",
  password: "DB.user.2@111",
  tokens: [{
    token: jwt.sign( {_id: userTwoId}, process.env.JWT_SECRET_STR )
  }]
}

// create a dummy-tasks
const taskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Dummy Task One',
  completed: false,
  createdBy: userOneId
}

const taskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Dummy Task Two',
  completed: true,
  createdBy: userOneId
}

const taskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Dummy Task Three',
  completed: false,
  createdBy: userTwoId
}

// clears DB and inserts a dummy-user
const databaseSetup = async () => {
  await User.deleteMany()
  await Task.deleteMany()

  const user1 = new User(userOne)
  await user1.save()

  const user2 = new User(userTwo)
  await user2.save()

  await new Task(taskOne).save()
  await new Task(taskTwo).save()
  await new Task(taskThree).save()
}

module.exports = {
  userOneId,
  userOne,
  
  userTwoId,
  userTwo,

  taskOne,
  taskTwo,
  taskThree,

  databaseSetup
}
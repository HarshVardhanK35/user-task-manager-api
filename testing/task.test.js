const request = require('supertest');

// import models- Task and User
const Task = require('../src/models/task');
const User = require('../src/models/user')

// import database setup functionality
const { userOneId, userOne, userTwo, userTwoId, taskOne, taskTwo, taskThree, databaseSetup } = require('./fixtures/db')

// import app
const app = require('../src/app')

// database setup before every test-request
beforeEach(databaseSetup)

// test to create tasks for users
test("Should create task for user", async() => {
  const response = await request(app)
  .post('/tasks')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send({
    description: 'Testing Tasks',
    completed: true
  })
  .expect(201)

  // check tasks was created or not
  const task = await Task.findById(response.body._id)
  expect(task).not.toBeNull()
})

// test to get all tasks created by userOne
test("Should get all tasks with userOne", async() => {
  const response = await request(app)
  .get('/tasks')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send()
  .expect(200)

  // check the length of the array --- the result of getting tasks
  expect(response.body.length).toEqual(2)
})

// test that other users should not delete a user tasks
test('should not delete other user tasks', async() => {
  const response = await request(app)
  .delete(`/task/${taskOne._id}`)
  .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
  .send()
  .expect(404)

  // make sure that task is not deleted by user-two
  const task = Task.findById(taskOne._id)
  expect(task).not.toBeNull()
})
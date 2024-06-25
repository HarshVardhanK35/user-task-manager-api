const request = require('supertest');
const User = require('../src/models/user');

const { userOneId, userOne, databaseSetup } = require('./fixtures/db')

// import app
const app = require('../src/app')

// before every test-request
beforeEach(databaseSetup)

// test-case: to signup a user
test('should signup a user', async () => {
  const response = await request(app).post('/users').send(
    {
      name: "dummy-user-1",
      email: "dummy.user.1@email.com",
      password: "user-1.dummy"
    }
  ).expect(201)

  // assert that the DB was changed correctly
  const user = await User.findById(response.body.user._id)
  expect(user).not.toBeNull()

  // assert about the response
  expect(response.body).toMatchObject({
    user:{
      name: "dummy-user-1",
      email: "dummy.user.1@email.com"
    },
    token: user.tokens[0].token
  })

  // checking password
  expect(user.password).not.toBe("user-1.dummy")
})

// test case - login existing user
test('should login existing user', async() => {
  const response = await request(app).post('/users/login').send(
    {
      email: userOne.email,
      password: userOne.password
    }
  ).expect(200)

  // validate new token is saved
  const user = await User.findById(userOneId)
  expect(response.body.token).toBe(user.tokens[1].token)
})

// test case - should not login with bad credentials
test('should not login with bad credentials', async () => {
  await request(app).post('/users/login').send(
    {
      email: userOne.email,
      password: 'Hello.Bad@111'
    }
  ).expect(400)
})

// test authentication for user-login
test('Should get user-profile', async () => {
  await request(app)
  .get('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send()
  .expect(200)
})

// test unauthenticated user
test('should not get user who is not authorized', async () => {
  await request(app)
  .get('/users/me')
  .send()
  .expect(401)
})

// test delete an account of an authorized user
test('should delete an account of user', async () => {
  await request(app)
  .delete('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send()
  .expect(200)

  // validate user is removed
  const user = await User.findById(userOneId)
  expect(user).toBeNull()
})

// test delete an account of an unauthorized user
test('Should not delete if user is unauthorized', async() => {
  await request(app)
  .delete('/users/me')
  .send()
  .expect(401)
})

// test to upload files
test('should upload avatar', async() => {
  await request(app)
  .post('/users/me/avatar')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .attach('avatar', 'testing/fixtures/user-avatar.jpg')
  .expect(200)

  // check whether image uploaded or not
  const user = await User.findById(userOneId)
  expect(user.avatar).toEqual(expect.any(Buffer))
})

// test user updates
test("should test update of user fields", async() => {
  await request(app)
  .patch('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send(
    {
      name: "user-1",
    }
  )
  .expect(200)

  // confirm that user-field has changed or not
  const user = await User.findById(userOneId)
  expect(user.name).toEqual("user-1")
})

// should not pass the test for user invalid fields
test("should not update user fields", async() => {
  await request(app)
  .patch('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send(
    {
      location: "India",
    }
  )
  .expect(400)
})
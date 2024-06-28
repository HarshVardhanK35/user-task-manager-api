const request = require("supertest");
const User = require("../src/models/user");

const { userOneId, userOne, databaseSetup } = require("./fixtures/db");

// import app
const app = require("../src/app");

// before every test-request
beforeEach(databaseSetup);

// test-case: to signup a user
test('1- should signup a user', async () => {
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
test('2- should login existing user', async() => {
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
test('3- should not login with bad credentials', async () => {
  await request(app).post('/users/login').send(
    {
      email: userOne.email,
      password: 'Hello.Bad@111'
    }
  ).expect(400)
})

// test authentication for user-login
test('4- Should get user-profile', async () => {
  await request(app)
  .get('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send()
  .expect(200)
})

// test unauthenticated user
test('5- should not get user who is unauthorized', async () => {
  await request(app)
  .get('/users/me')
  .send()
  .expect(401)
})

// test delete an account of an authorized user
test('6- should delete an account of user', async () => {
  await request(app)
  .delete('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send()
  .expect(200)

  // validate user is removed
  const user = await User.findById(userOneId)
  expect(user).toBeNull()
})

// test to upload files
test('7- should upload avatar', async() => {
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
test("8- should test update of user fields", async() => {
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
test("9- should not update user fields", async() => {
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

// ------------------------------------------------------------------------------------------------------ My Test Cases

// Should not signup with invalid name/email/password
test("My-1 Should not sign up with invalid name/email/password", async () => {
  // Invalid email
  await request(app)
    .post("/users")
    .send({
      name: "invalid-user",
      email: "invalid-email",
      password: "ValidPass123!",
    })
    .expect(400);

  // Invalid password (too short)
  await request(app)
    .post("/users")
    .send({
      name: "invalid-user",
      email: "valid.email@example.com",
      password: "123",
    })
    .expect(400);

  // Invalid name (not a string or any other validation you may have)
  await request(app)
    .post("/users")
    .send({
      name: 123456,
      email: "valid.email@example.com",
      password: "ValidPass123!",
    })
    .expect(400);
});

// Should not update user... if user is unauthenticated
test("My-2 Should not update user if unauthenticated", async () => {
  await request(app)
    .patch("/users/me")
    .send({
      name: "user-1",
    })
    .expect(401);

  // Verify that the user info has not changed
  const user = await User.findById(userOneId);
  expect(user.name).toEqual(userOne.name);
});

// Test that authorized user Should not update with invalid user-details
test("My-3 Should not update user with invalid name/email/password", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: 123, // Invalid name: not a string
      email: 123, // Invalid email: not a string
      password: 123, // Invalid password: password does not contain min 7 characters
    })
    .expect(400);

  // Confirm that user field has not changed
  const user = await User.findById(userOneId);
  expect(user.name).toEqual(userOne.name); // The name Should remain unchanged
});

// test delete an account of an unauthorized user
test("My-4 Should not delete if user is unauthorized", async () => {
  await request(app)
  .delete("/users/me")
  .send()
  .expect(401);
});
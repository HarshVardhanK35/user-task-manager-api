const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

require('dotenv').config()
const JWT_SECRET = process.env.JWT_SECRET_STR

// const Task = require('../models/task')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if(!validator.isEmail(value)){
          throw new Error("Email is invalid!")
        }
      }
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      validate(value) {
        if(value.toLowerCase().includes("password")){
          throw new Error('Your password contains "Password!"')
        }
      }
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if(value < 0) {
          throw new Error('Age must be a positive number!')
        }
      }
    },
    avatar: {
      type: Buffer
    },
    avatarMimeType: {
      type: String
    },
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ] // empty objects array: [{}]
  },
  {
    timestamps: true
  }
)

// virtual field to create tasks
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'createdBy'
})

// method to hide sensitive data
userSchema.methods.getPublicProfile = function() {
  const user = this;
  const userData = user.toObject()

  delete userData.password
  delete userData.tokens
  delete userData.avatar
  delete userData.avatarMimeType

  return userData
}

// method to generate authentication token
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET)

  user.tokens = user.tokens.concat({ token })
  await user.save()

  return token
}

// find a user by their email and password before login
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email: email })
  // if user was not found
  if(!user){
    throw new Error('Unable to login!')
  }
  // if user was found check password
  const isMatch = await bcrypt.compare(password, user.password)
  // if password does not match
  if(!isMatch){
    throw new Error('Unable to login!')
  }
  // if user was found
  return user
}

// hash the plain text password before saving
userSchema.pre('save', async function(next) {
  const user = this  // accessing the model using "this"
  if(user.isModified('password')){
    user.password = await bcrypt.hash(user.password, 8)
  }
  next() // passes execution to next middleware if any
})

// if user wants to delete his profile... delete his tasks as well
// userSchema.pre('remove', async function (req, res, next) {
//   const user = this
//   await Task.deleteMany({ createdBy: user._id })
//   next()
// })

const User = mongoose.model('User', userSchema);

module.exports = User;
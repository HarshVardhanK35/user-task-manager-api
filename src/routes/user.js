const express = require("express");
const nodemailer = require("nodemailer");

// add validation library
const { check, validationResult } = require("express-validator");

// import multer
const multer = require("multer");

// import sharp
const sharp = require("sharp");

// OPTIONAL
// >>> this below line tells multer to store uploaded files into memory as Buffer objects
// const storage = multer.memoryStorage()

// import auth middleware
const auth = require("../middleware/auth");

// mini-app >>> const router = new express.Router()
// the Express framework which creates a new router object >>> This router object allows you to define modular route handlers
// modular route handlers >>> Modular route handlers are a way to organize the routes of an application into separate, self-contained modules... for managing and maintaining a clean code
const router = new express.Router();

// import task-model.. for deleting user tasks created by him (if user deletes his profile... delete his tasks too)
const Task = require("../models/task");

// import User schema
const User = require("../models/user");

// import sendWelcomeMail and sendCancellationEmail function to send Emails
const { sendWelcomeMail, sendCancellationEmail } = require("../emails/account");

// Create a transporter for sending Emails using your Gmail account
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.GMAIL_APP_PASS, // You might need to generate an app password
  },
});

// POST req - to create a new user -> "signup"
router.post("/users",
  [
    check("name").isString().withMessage("Name must be a string"),
    check("email").isEmail().withMessage("Email must be valid"),
    check("password")
      .isLength({ min: 7 })
      .withMessage("password must be at least 7 characters long"),
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = new User(req.body); // create a new instance of user using User model from models/user.js

    try {
      await user.save(); // save the created user to db and handle the promise
      sendWelcomeMail(transporter, user.email, user.name);

      // after saving the user generate a token
      const token = await user.generateAuthToken();
      res.status(201).send({ user, token });
    } catch (err) {
      res.status(400).send(err);
    }
  }
);

// login route
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user: user.getPublicProfile(), token }); // *> need to put token here or else it return error while accessing route -> user/me
  }
  catch (err) {
    res.status(400).send(err);
  }
});

// log out route
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token; // *> used within the filter method to remove the current session's authentication token from the user's tokens array
    });
    await req.user.save();
    res.send("Logged out successfully!");
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// route to logout from all devices
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send("Logged out from all devices successfully!");
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// fetching profile --- use find method
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user.getPublicProfile());
});

// fetching single user --- using unique Id >>> as this is not needed we have user-profile (/users/me) --- route
// router.get('/users/:id', async (req, res) => {
//   try{
//     const user = await User.findById(req.params.id)
//     if(!user){
//       res.status(404).send("User not found!")
//     }
//     res.send(user)
//   }
//   catch(err){
//     res.status(500).send()
//   }
// })

// get all users
// router.get("/allUsers", async (req, res) => {
//   try {
//     const users = await User.find({});
//     res.status(200).send(users);
//   }
//   catch (err) {
//     res.status(500).send(err);
//   }
// });

// updating a single user with Id >>> this is modified check the docs for the previous version of update router
router.patch("/users/me", auth, async (req, res) => {
  const reqBodyUpdates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = reqBodyUpdates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  for (const update of reqBodyUpdates) {
    if (update === "name" && typeof req.body[update] !== "string") {
      return res.status(400).send({ error: "Name must be a string" });
    }

    if (update === "email" && typeof req.body[update] !== "string") {
      return res.status(400).send({ error: "Email must be a string" });
    }

    if (update === "password" && typeof req.body[update] !== "string") {
      return res.status(400).send({ error: "Password must be a string" });
    }
  }

  try {
    const user = req.user;
    const reqBodyUpdates = Object.keys(req.body);

    reqBodyUpdates.forEach((update) => {
      user[update] = req.body[update];
    });

    await user.save();

    // this is commented because it is bypassing and directly updating in the database
    // const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })
    res.send(user);
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// delete a user with Id >>> replace "users/:id" with "users/me"
router.delete("/users/me", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);

    // delete the tasks when user deletes his profile
    await Task.deleteMany({ createdBy: req.user._id });

    if (!user) {
      res.status(404).send();
    }
    res.send("User deleted successfully!");

    // subscription cancellation mail
    sendCancellationEmail(transporter, user.email, user.name);
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// file uploads with multer
const avatar = multer({
  // instead of saving uploads to local file system > comment the below line
  // dest: 'avatars',
  limits: {
    fileSize: 250 * 1024, // accepts files with less than 250 KB
  },
  fileFilter(req, file, cb) {
    const fileExt = file.originalname.toLocaleLowerCase();
    if (
      fileExt.endsWith(".jpg") ||
      fileExt.endsWith(".jpeg") ||
      fileExt.endsWith(".png")
    ) {
      return cb(null, true); // accept the file
    }
    return cb(
      new Error("Invalid file type. Only JPG, JPEG, and PNG files are allowed!")
    ); // rejects the file
  },
});

// router to access file-uploads >>> route to upload avatar for users
router.post("/users/me/avatar", auth, avatar.single("avatar"), async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 150, height: 150 })
      .png()
      .toBuffer();
    req.user.avatar = buffer; // we save the buffer data on user avatar of user-model (added extra field in user-modal that is... { avatar: Buffer }

    req.user.avatarMimeType = req.file.mimetype;

    await req.user.save();

    // console.log(req.file.buffer.length);
    res.send("successfully uploaded profile avatar");
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// route to get user-profile avatar
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error("User not found or no avatar present!");
    }
    res.set("Content-Type", "image/png");
    res.send(user.avatar); // Send the avatar buffer
  } catch (err) {
    res.status(404).send({ error: err.message });
  }
});

// route to delete avatar with user-avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    if (!req.user.avatar) {
      return res.status(404).send({ error: "Avatar not found!" });
    }
    req.user.avatar = undefined;
    req.user.avatarMimeType = undefined;
    await req.user.save();
    res.send({ message: "User avatar deleted successfully!" });
  } catch (err) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

module.exports = router;
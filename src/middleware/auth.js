const jwt = require('jsonwebtoken');
const User = require('../models/user')

require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET_STR

const auth = async (req, res, next) => {
  try {
    // Extract the token from the Authorization header and replaces the "Bearer " with nothing
    const token = req.header('Authorization').replace('Bearer ', '');

    // Verify the token to get the decoded payload
    const decodedToken = jwt.verify(token, JWT_SECRET);

    // Find the user by the decoded user ID and ensure the token exists in the user's token array
    const user = await User.findOne({ _id: decodedToken._id, 'tokens.token': token });

    // If no user is found, throw an error to be caught by the catch block
    if (!user) {
      throw new Error();
    }

    // other routes need to access the token
    req.token = token;

    // Attach the authenticated user to the request object
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  }
  catch (err) {
    // Send an error response if authentication fails
    res.status(401).send({ Error: "Please authenticate!" });
  }
}

module.exports = auth;
const nodemailer = require('nodemailer');

// dotenv configuration
require('dotenv').config()

const sendWelcomeMail = async(transporter, email, name) => {
  try{
    await transporter.sendMail({
      from: {
        name: 'Task Management Application',
        address: process.env.USER_EMAIL
      },
      to: email,                                              // use array of emails if there are more than one email to send
      subject: "Thanks for signing in Task-Management Application",
      text: `Welcome to the application, ${name}. Let me know how you get along with the application.`,
    });
    // console.log('Welcome email has been sent successfully!')
  }
  catch(err){
    console.log(err)
  }
}

const sendCancellationEmail = async(transporter, email, name) => {
  try{
    await transporter.sendMail({
      from: {
        name: "Task Management Application",
        address: process.env.USER_EMAIL
      },
      to: email,
      subject: "Sorry to see you go!",
      text: `Goodbye, ${name}. I hope we meet sometime soon again...`
    })
    // console.log("Cancellation mail was sent!")
  }
  catch (err) {
    console.log(err)
  }
}

// Immediately Invoked Function Expression (IIFE) to send the email
// (async() => {
//   await sendMail(transporter, mailOptions)
// })();

// Export the function to use in other files
module.exports = {
  sendWelcomeMail,
  sendCancellationEmail
};
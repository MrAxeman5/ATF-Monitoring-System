// Import the configuration module
const config = require('./config.js');
// We need to use sessions, so you should always start sessions using the below function
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql');

// Create a MySQL database connection
const con = mysql.createConnection({
  host: config.db_host,
  user: config.db_user,
  password: config.db_pass,
  database: config.db_name,
  charset: config.db_charset,
});

// If there is an error with the MySQL connection, stop the script and output the error
con.connect((err) => {
  if (err) {
    console.error('Failed to connect to MySQL:', err);
    process.exit(1);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Create a session store for Express using MySQL
const sessionStore = new MySQLStore({
  host: config.db_host,
  user: config.db_user,
  password: config.db_pass,
  database: config.db_name,
  charset: config.db_charset,
}, con);

// The below function will check if the user is logged in and also check the remember me cookie
function checkLoggedIn(req, res, next) {
  // Check for remember me cookie variable and loggedin session variable
  if (req.cookies.rememberme && !req.session.loggedin) {
    // If the remember me cookie matches one in the database then we can update the session variables.
    con.query('SELECT id, username, role FROM accounts WHERE rememberme = ?', [req.cookies.rememberme], (err, results) => {
      if (err) {
        console.error('Error fetching rememberme data:', err);
        return res.redirect('/index.php');
      }
      // If there are results
      if (results.length > 0) {
        // Found a match, update the session variables and keep the user logged in
        const { id, username, role } = results[0];
        // Regenerate session ID
        req.session.regenerate(() => {
          // Declare session variables; authenticate the user
          req.session.loggedin = true;
          req.session.name = username;
          req.session.id = id;
          req.session.role = role;
          // Update last seen date
          const date = new Date().toISOString();
          con.query('UPDATE accounts SET last_seen = ? WHERE id = ?', [date, id], (err) => {
            if (err) {
              console.error('Error updating last seen date:', err);
            }
          });
        });
      } else {
        // If the user is not remembered, redirect to the login page
        res.redirect('/index.php');
      }
    });
  } else if (!req.session.loggedin) {
    // If the user is not logged in, redirect to the login page
    res.redirect('/index.php');
  } else {
    next();
  }
}

// Export the checkLoggedIn function for use in routes
module.exports = checkLoggedIn;

// Send activation email function
function sendActivationEmail(email, code) {
  // Email Subject
  const subject = 'Account Activation Required';
  // Email Headers
  const headers = `From: ${config.mail_from}\r\n` +
    `Reply-To: ${config.mail_from}\r\n` +
    `Return-Path: ${config.mail_from}\r\n` +
    `X-Mailer: Node.js\r\n` +
    'MIME-Version: 1.0\r\n' +
    'Content-Type: text/html; charset=UTF-8\r\n';
  // Activation link
  const activateLink = `${config.activation_link}?email=${email}&code=${code}`;
  // Email template
  const emailTemplate = `Click the following link to activate your account: <a href="${activateLink}">${activateLink}</a>`;
  // Send email to user
  // You can use a Node.js email library like Nodemailer to send emails
}

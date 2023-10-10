// Include the root "config.js" and "main.js" files
const config = require('./config.js');
const mysql = require('mysql');
const express = require('express');
const cookieParser = require('cookie-parser');
const main = require('./main.js'); // Import your main.js file

const app = express();

// Use cookie-parser middleware
app.use(cookieParser());

// Create a MySQL database connection
const con = mysql.createConnection({
  host: config.configData.db_host,
  user: config.configData.db_user,
  password: config.configData.db_pass,
  database: config.configData.db_name,
  charset: config.configData.db_charset,
});

// Check if the user is logged-in (assuming this middleware is defined in main.js)
app.use('/', main.checkLoggedIn(con));

// Define a route handler for fetching account details
app.get('/account-details', (req, res) => {
  const sql = 'SELECT password, email, role, username FROM accounts WHERE id = ?';
  con.query(sql, [req.session.id], (err, results) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      res.status(500).send('Internal Server Error');
    } else {
      if (results.length === 0) {
        res.status(403).send('You do not have permission to access this page!');
      } else {
        const accountInfo = results[0];
        if (accountInfo.role !== 'Admin') {
          res.status(403).send('You do not have permission to access this page!');
        } else {
          // Continue with your admin logic here
          // Add/remove roles from the list
          const rolesList = ['Admin', 'Member'];
        }
      }
    }
  });
});

// Template admin header
function templateAdminHeader(title, selected = 'dashboard', selectedChild = '') {
  // Admin HTML links
  const adminLinks = `
      <a href="index.php"${selected === 'dashboard' ? ' class="selected"' : ''}><i class="fas fa-tachometer-alt"></i>Dashboard</a>
      <a href="accounts.php"${selected === 'accounts' ? ' class="selected"' : ''}><i class="fas fa-users"></i>Accounts</a>
      <div class="sub">
          <a href="accounts.php"${selected === 'accounts' && selectedChild === 'view' ? ' class="selected"' : ''}><span>&#9724;</span>View Accounts</a>
          <a href="account.php"${selected === 'accounts' && selectedChild === 'manage' ? ' class="selected"' : ''}><span>&#9724;</span>Create Account</a>
      </div>
      <a href="roles.php"${selected === 'roles' ? ' class="selected"' : ''}><i class="fas fa-list"></i>Roles</a>
      <a href="emailtemplate.php"${selected === 'emailtemplate' ? ' class="selected"' : ''}><i class="fas fa-envelope"></i>Email Templates</a>
      <a href="settings.php"${selected === 'settings' ? ' class="selected"' : ''}><i class="fas fa-tools"></i>Settings</a>
  `;

  // Indenting the below code may cause an error
  const html = `
  <!DOCTYPE html>
  <html lang="en">
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,minimum-scale=1">
          <title>${title}</title>
          <link href="admin.css" rel="stylesheet" type="text/css">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css" integrity="sha512-xh6O/CkQoPOWDdYTDqeRdPCVd1SpvCA9XXcUnZS2FmJNp1coAFzvtCN9BmamE+4aHK8yyUHUSCcJHgXloTyT2A==" crossorigin="anonymous" referrerpolicy="no-referrer">
      </head>
      <body class="admin">
          <aside class="responsive-width-100 responsive-hidden">
              <h1>Admin</h1>
              ${adminLinks}
              <div class="footer">
                  <a href="https://codeshack.io/package/php/advanced-secure-login-registration-system/" target="_blank">Advanced Login & Registration</a>
                  Version 2.0.1
              </div>
          </aside>
          <main class="responsive-width-100">
              <header>
                  <a class="responsive-toggle" href="#">
                      <i class="fas fa-bars"></i>
                  </a>
                  <div class="space-between"></div>
                  <div class="dropdown right">
                      <i class="fas fa-user-circle"></i>
                      <div class="list">
                      <a href="../">Go Back</a>
                          <a href="account.php?id=${req.session.id}">Edit Profile</a>
                          <a href="../logout.php">Logout</a>
                      </div>
                  </div>
              </header>
  `;

  return html;
}

// Template admin footer
function templateAdminFooter(jsScript = '') {
  jsScript = jsScript ? '<script>' + jsScript + '</script>' : '';

  // DO NOT INDENT THE BELOW CODE
  const html = `
  </main>
  <script src="admin.js"></script>
  ${jsScript}
  </body>
  </html>
  `;

  return html;
}

// Convert date to elapsed string function
function timeElapsedString(datetime, full = false) {
  const now = new Date();
  const ago = new Date(datetime);
  const diff = {
    y: now.getFullYear() - ago.getFullYear(),
    m: now.getMonth() - ago.getMonth(),
    d: now.getDate() - ago.getDate(),
    h: now.getHours() - ago.getHours(),
    i: now.getMinutes() - ago.getMinutes(),
    s: now.getSeconds() - ago.getSeconds(),
  };
  const w = Math.floor(diff.d / 7);
  diff.d -= w * 7;
  const string = {
    y: 'year',
    m: 'month',
    w: 'week',
    d: 'day',
    h: 'hour',
    i: 'minute',
    s: 'second',
  };
  for (const k in string) {
    if (k === 'w' && w) {
      string[k] = w + ' week' + (w > 1 ? 's' : '');
    } else if (diff[k] !== undefined && diff[k]) {
      string[k] = diff[k] + ' ' + string[k] + (diff[k] > 1 ? 's' : '');
    } else {
      delete string[k];
    }
  }
  if (!full) {
    const keys = Object.keys(string);
    if (keys.length > 0) {
      string[keys[0]] = string[keys[0]] + ' ago';
      string = { [keys[0]]: string[keys[0]] };
    } else {
      string = { 's': 'just now' };
    }
  }
  return string ? Object.values(string).join(', ') : 'just now';
}

// Export the functions as modules
module.exports = {
  templateAdminHeader,
  templateAdminFooter,
  timeElapsedString,
};

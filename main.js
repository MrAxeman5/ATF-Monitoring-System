// Import the required modules
const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cookieParser = require('cookie-parser');

// Import your new config.js
const config = require('./config.js');

const app = express();
app.use(cookieParser());

// Create a MySQL database connection
const con = mysql.createConnection({
  host: config.tabs[0].sections[0].keys[0].value,      // Database Host
  user: config.tabs[0].sections[0].keys[1].value,      // Database User
  password: config.tabs[0].sections[0].keys[2].value,  // Database Password
  database: config.tabs[0].sections[0].keys[3].value,  // Database Name
  charset: config.tabs[0].sections[0].keys[4].value,   // Database Charset
});

// Create a session store for Express using MySQL
const sessionStore = new MySQLStore({
  host: config.tabs[0].sections[0].keys[0].value,
  user: config.tabs[0].sections[0].keys[1].value,
  password: config.tabs[0].sections[0].keys[2].value,
  database: config.tabs[0].sections[0].keys[3].value,
  charset: config.tabs[0].sections[0].keys[4].value,
}, con);

// Configure express-session middleware
app.use(session({
  secret: 'oEB94QQf0qCZyfqtn7fxgSB1lVvoweUJ', // Use the same secret you have in main.js
  resave: false,
  saveUninitialized: true,
  // You can customize other session options here
  store: sessionStore, // Use the session store you created
}));
// If there is an error with the MySQL connection, stop the script and output the error
con.connect((err) => {
  if (err) {
    console.error('Failed to connect to MySQL:', err);
    process.exit(1);
  } else {
    console.log('Connected to MySQL database');
  }
});

// The below function will check if the user is logged in and also check the remember me cookie
function checkLoggedIn(req, res, next) {
  // Check for remember me cookie variable and loggedin session variable
  console.log('Checking logged in status...');
  console.log('Cookies:', req.cookies); // Log the cookies object
  if (req.cookies && req.cookies.rememberme && !req.session.loggedin) {
    // If the remember me cookie matches one in the database then we can update the session variables.
    con.query('SELECT id, username, role FROM accounts WHERE rememberme = ?', [req.cookies.rememberme], (err, results) => {
      if (err) {
        console.error('Error fetching rememberme data:', err);
        if (res) {
          res.redirect('/');
        } else {
          // Handle the case where res is undefined (e.g., when middleware is used in a non-HTTP context)
          console.error('Redirect cannot be performed because res is undefined.');
        }
        return;
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
          req.session.userId = id;
          req.session.role = role;
          // Update last seen date
          const date = new Date().toISOString();
          con.query('UPDATE accounts SET last_seen = ? WHERE id = ?', [date, id], (err) => {
            if (err) {
              console.error('Error updating last seen date:', err);
            }
          });
          if (res) {
            res.redirect('/map'); // Redirect if res is defined
          }
          next(); // Continue with the next middleware
        });
      } else {
        // If the user is not remembered, redirect to the login page
        if (res) {
          res.redirect('/');
        }
      }
    });
  } else if (!req.session.loggedin) { // If the user is not logged in, redirect to the login page
    if (res) {
      res.redirect('/');
    }
  } else {
    next(); // Continue with the next middleware
  }
}

// Template admin header
function templateAdminHeader(title, selected = 'dashboard', selectedChild = '', req) {
 // Admin HTML links 
 const adminLinks = `
   <a href="/map"${selected === 'dashboard' ? ' class="selected"' : ''}><i class="fas fa-arrow-left"></i>Go Back</a>
   <a href="/admin"${selected === 'dashboard' ? ' class="selected"' : ''}><i class="fas fa-tachometer-alt"></i>Dashboard</a>
   <a href="/admin/accounts"${selected === 'accounts' ? ' class="selected"' : ''}><i class="fas fa-users"></i>Accounts</a>
   <div class="sub">
       <a href="/admin/accounts"${selected === 'accounts' && selectedChild === 'view' ? ' class="selected"' : ''}><span>&#9724;</span>View Accounts</a>
       <a href="/admin/account"${selected === 'accounts' && selectedChild === 'manage' ? ' class="selected"' : ''}><span>&#9724;</span>Create Account</a>
   </div>
   <a href="roles.php"${selected === 'roles' ? ' class="selected"' : ''}><i class="fas fa-list"></i>Roles</a>
   <a href="emailtemplate.php"${selected === 'emailtemplate' ? ' class="selected"' : ''}><i class="fas fa-envelope"></i>Email Templates</a>
   <a href="/admin/settings"${selected === 'settings' ? ' class="selected"' : ''}><i class="fas fa-tools"></i>Settings</a>
 `;

 // Return the HTML for the admin header 
 return `
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="utf-8">
       <meta name="viewport" content="width=device-width,minimum-scale=1">
       <title>${title}</title>
       <link href="/styles/admin.css" rel="stylesheet" type="text/css">
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
                       <a href="admin/account?id=${req.session.userId}">Edit Profile</a>
                       <a href="../logout.php">Logout</a>
                   </div>
               </div>
           </header>
 `;
}

// Template admin footer
function templateAdminFooter(jsScript = '') {
 // Include any JavaScript script if needed 
 const jsScriptTag = jsScript ? `<script>${jsScript}</script>` : '';

 // Return the HTML for the admin footer 
 return `
       </main>
       <script src="/js/admin.js"></script>
       ${jsScriptTag} 
   </body>
</html>
 `;
}

// Convert date to elapsed string function
function timeElapsedString(datetime, full = false) {
 const now = new Date();
 const ago = new Date(datetime);
 const diff = now - ago;
 const seconds = Math.floor(diff / 1000);
 const minutes = Math.floor(seconds / 60);
 const hours = Math.floor(minutes / 60);
 const days = Math.floor(hours / 24);
 const weeks = Math.floor(days / 7);
 const years = Math.floor(weeks / 52);

 if (years > 0) {
   return `${years} year${years > 1 ? 's' : ''} ago`;
 } else if (weeks > 0) {
   return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
 } else if (days > 0) {
   return `${days} day${days > 1 ? 's' : ''} ago`;
 } else if (hours > 0) {
   return `${hours} hour${hours > 1 ? 's' : ''} ago`;
 } else if (minutes > 0) {
   return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
 } else if (seconds > 0) {
   return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
 } else {
   return 'just now';
 }
}


function fetchDashboardData(callback) {
  // New accounts created on the current date
  con.query('SELECT * FROM accounts WHERE DATE(registered) = CURDATE() ORDER BY registered DESC', (err, accounts) => {
    if (err) {
      console.error('Error fetching new accounts:', err);
      return callback(err);
    }
    
    // Total accounts
    con.query('SELECT COUNT(*) AS total FROM accounts', (err, results) => {
      if (err) {
        console.error('Error fetching total accounts:', err);
        return callback(err);
      }
      const accountsTotal = results[0].total;

      // Total accounts that were last active over a month ago
      con.query('SELECT COUNT(*) AS total FROM accounts WHERE last_seen < DATE_SUB(NOW(), INTERVAL 1 MONTH)', (err, results) => {
        if (err) {
          console.error('Error fetching inactive accounts:', err);
          return callback(err);
        }
        const inactiveAccounts = results[0].total;

        // Accounts that are active in the last day
        con.query('SELECT * FROM accounts WHERE last_seen > DATE_SUB(NOW(), INTERVAL 1 DAY) ORDER BY last_seen DESC', (err, activeAccounts) => {
          if (err) {
            console.error('Error fetching active accounts:', err);
            return callback(err);
          }

          // Total accounts that are active in the last month
          con.query('SELECT COUNT(*) AS total FROM accounts WHERE last_seen > DATE_SUB(NOW(), INTERVAL 1 MONTH)', (err, results) => {
            if (err) {
              console.error('Error fetching active accounts (last month):', err);
              return callback(err);
            }
            const activeAccounts2 = results[0].total;

            // Package the results in an object
            const dashboardData = {
              accounts,
              accountsTotal,
              inactiveAccounts,
              activeAccounts,
              activeAccounts2,
            };

            // Pass the data to the callback function
            callback(null, dashboardData);
          });
        });
      });
    });
  });
}


// Create a MySQL connection pool
const pool = mysql.createPool({
  host: config.tabs[0].sections[0].keys[0].value,      // Database Host
  user: config.tabs[0].sections[0].keys[1].value,      // Database User
  password: config.tabs[0].sections[0].keys[2].value,  // Database Password
  database: config.tabs[0].sections[0].keys[3].value,  // Database Name
  charset: config.tabs[0].sections[0].keys[4].value,   // Database Charset
});

// Function to fetch account data based on filters
async function fetchAccounts({
  page = 1,
  search = '',
  status = '',
  activation = '',
  role = '',
  order = 'ASC',
  order_by = 'id',
  results_per_page = 20,
}) {
  try {
    const param1 = (page - 1) * results_per_page;
    const param2 = results_per_page;
    const param3 = `%${search}%`;

    let where = '';
    where += search ? 'WHERE (username LIKE ? OR email LIKE ?) ' : '';

    if (status === 'active') {
      where += where ? 'AND last_seen > DATE_SUB(NOW(), INTERVAL 1 MONTH) ' : 'WHERE last_seen > DATE_SUB(NOW(), INTERVAL 1 MONTH) ';
    }
    if (status === 'inactive') {
      where += where ? 'AND last_seen < DATE_SUB(NOW(), INTERVAL 1 MONTH) ' : 'WHERE last_seen < DATE_SUB(NOW(), INTERVAL 1 MONTH) ';
    }
    if (activation === 'pending') {
      where += where ? 'AND activation_code != "activated" ' : 'WHERE activation_code != "activated" ';
    }
    if (role) {
      where += where ? 'AND role = ? ' : 'WHERE role = ? ';
    }

    const countQuery = `SELECT COUNT(*) AS total FROM accounts ${where}`;
    const searchQuery = `SELECT id, username, email, activation_code, role, registered, last_seen FROM accounts ${where} ORDER BY ${order_by} ${order} LIMIT ?,?`;

    const values = [];
    const params = [];

    if (search) {
      params.push(param3);
      params.push(param3);
    }
    if (role) {
      params.push(role);
    }

    params.push(param1);
    params.push(param2);

    // Execute count query
    const countResult = await queryDatabase(countQuery, params);

    // Execute search query
    const searchResult = await queryDatabase(searchQuery, params);

    const accounts = searchResult.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      activation_code: row.activation_code,
      role: row.role,
      registered: row.registered,
      last_seen: row.last_seen,
    }));

    const accounts_total = countResult[0].total;

    return { accounts, accounts_total };
  } catch (error) {
    throw error;
  }
}

// Function to execute a MySQL query using the connection pool
function queryDatabase(query, values) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
        return;
      }

      connection.query(query, values, (error, results) => {
        connection.release(); // Release the connection
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  });
}

// Usage example:
fetchAccounts({ page: 1, search: 'example', status: 'active' })
  .then(({ accounts, accounts_total }) => {
    console.log('Fetched accounts:', accounts);
    console.log('Total accounts:', accounts_total);
  })
  .catch((error) => {
    console.error('Error fetching accounts:', error);
  });

// Function to retrieve an account by ID
function getAccountById(accountId, callback) {
  // Your SQL query to retrieve the account by ID
  const query = 'SELECT id, username, password, email, activation_code, rememberme, role, registered, last_seen FROM accounts WHERE id = ?';

  // Execute the SQL query with the provided accountId
  con.query(query, [accountId], (err, results) => {
    if (err) {
      // Handle the error, you can log it or return an error message
      console.error('Error retrieving account by ID:', err);
      return callback(err, null);
    }

    if (results.length === 0) {
      // If no account with the specified ID is found, return null
      return callback(null, null);
    }

    // Account found, pass the first result (there should be only one) to the callback
    const account = results[0];
    callback(null, account);
  });
}

  
// Export the functions if using Node.js modules
module.exports = {
  checkLoggedIn,
  templateAdminHeader,
  templateAdminFooter,
  timeElapsedString,
  fetchDashboardData,
  fetchAccounts,
  getAccountById,
  con,
};
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

// Define your routes and start the Express app

const main = require('./main.js'); // Assuming you have a 'main.js' file with your database connection
app.post('/authenticate.js', (req, res) => {
// Check if the data from the login form was submitted
if (!req.body.username || !req.body.password) {
  // Could not retrieve the captured data, send an error response
  return res.status(400).send('Please fill both the username and password fields!');
}

// Prepare our SQL query and find the account associated with the login details
// Preparing the SQL statement will prevent SQL injection
const sql = 'SELECT id, password, rememberme, activation_code, role, username FROM accounts WHERE username = ?';

main.con.query(sql, [req.body.username], (err, result) => {
  if (err) {
    // Handle database error
    console.error('Database error:', err);
    return res.status(500).send('An error occurred while processing your request.');
  }

  if (result.length > 0) {
    const { id, password, rememberme, activation_code, role, username } = result[0];

    // Verify the form password
    if (bcrypt.compareSync(req.body.password, password)) {
      // Check if the account is activated
      if (account_activation && activation_code !== 'activated') {
        // User has not activated their account, send the message
        return res.send('Please activate your account to login! Click <a href="resend-activation.php">here</a> to resend the activation email.');
      } else {
        // Verification success! User has logged in!
        // Declare the session variables (you can use a session library for this)
        req.session.regenerate(() => {
          req.session.loggedin = true;
          req.session.name = username;
          req.session.id = id;
          req.session.role = role;

          // IF the "remember me" checkbox is checked...
          if (req.body.rememberme) {
            // Generate a hash that will be stored as a cookie and in the database. It will be used to identify the user.
            const cookiehash = !empty(rememberme) ? rememberme : bcrypt.hashSync(id + username + 'yoursecretkey', 10);

            // The number of days the user will be remembered
            const days = 30;

            // Set the cookie
            res.cookie('rememberme', cookiehash, { maxAge: days * 24 * 60 * 60 * 1000 });

            // Update the "rememberme" field in the accounts table with the new hash
            main.con.query('UPDATE accounts SET rememberme = ? WHERE id = ?', [cookiehash, id], (updateErr) => {
              if (updateErr) {
                // Handle database error
                console.error('Database error:', updateErr);
              }
            });
          }

          // Update last seen date
          const date = new Date().toISOString();
          main.con.query('UPDATE accounts SET last_seen = ? WHERE id = ?', [date, id], (updateErr) => {
            if (updateErr) {
              // Handle database error
              console.error('Database error:', updateErr);
            }
          });

          // Send a success response; do not change this line as the client-side code depends on it
          return res.send('Success');
        });
      }
    } else {
      // Incorrect password
      return res.send('Incorrect email and/or password!');
    }
  } else {
    // Incorrect email
    return res.send('Incorrect email and/or password!');
  }
});
});
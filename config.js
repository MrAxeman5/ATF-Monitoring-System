module.exports = {
  // Your MySQL database hostname or IP address.
  db_host: '82.24.188.5',
  // Your MySQL database username.
  db_user: 'website',
  // Your MySQL database password.
  db_pass: 'g8n8vVLiuE1Z6qpS',
  // Your MySQL database name.
  db_name: 'phplogin',
  // Your MySQL database charset.
  db_charset: 'utf8',
  /* Registration */
  // If enabled, the user will be redirected to the homepage automatically upon registration.
  auto_login_after_register: false,
  /* Account Activation */
  // If enabled, the account will require email activation before the user can login.
  account_activation: false,
  // Change "Your Company Name" and "yourdomain.com" - do not remove the < and > characters.
  mail_from: 'Your Company Name <noreply@yourdomain.com>',
  // The link to the activation file.
  activation_link: 'http://yourdomain.com/phplogin/activate.php',
};

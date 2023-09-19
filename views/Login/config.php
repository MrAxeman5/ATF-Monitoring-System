<?php
// Your MySQL database hostname.
define('db_host','localhost');
// Your MySQL database username.
define('db_user','root');
// Your MySQL database password.
define('db_pass','');
// Your MySQL database name.
define('db_name','phplogin');
// Your MySQL database charset.
define('db_charset','utf8');
/* Registration */
// If enabled, the user will be redirected to the homepage automatically upon registration.
define('auto_login_after_register',false);
/* Account Activation */
// If enabled, the account will require email activation before the user can login.
define('account_activation',false);
// Change "Your Company Name" and "yourdomain.com" - do not remove the < and > characters.
define('mail_from','Your Company Name <noreply@yourdomain.com>');
// The link to the activation file.
define('activation_link','http://yourdomain.com/phplogin/activate.php');
?>
module.exports = {
  tabs: [
    {
      name: 'General',
      sections: [
        {
          key: 'database_settings', // Unique key for the section
          keys: [
            {
              key: 'db_host',
              label: 'Database Host',
              caption: 'Your MySQL database hostname or IP address.',
              value: '82.24.188.5',
            },
            {
              key: 'db_user',
              label: 'Database User',
              caption: 'Your MySQL database username.',
              value: 'website',
            },
            {
              key: 'db_pass',
              label: 'Database Password',
              caption: 'Your MySQL database password.',
              value: 'g8n8vVLiuE1Z6qpS',
            },
            {
              key: 'db_name',
              label: 'Database Name',
              caption: 'Your MySQL database name.',
              value: 'phplogin',
            },
            {
              key: 'db_charset',
              label: 'Database Charset',
              caption: 'Your MySQL database charset.',
              value: 'utf8',
            },
          ],
        },
      ],
    },
    {
      name: 'Registration',
      sections: [
        {
          key: 'registration_settings', // Unique key for the section
          keys: [
            {
              key: 'auto_login_after_register',
              label: 'Auto login after register',
              caption: 'If enabled, the user will be redirected to the homepage automatically upon registration.',
              value: false,
            },
          ],
        },
      ],
    },
    {
      name: 'Account Activation',
      sections: [
        {
          key: 'account_activation_settings', // Unique key for the section
          keys: [
            {
              key: 'account_activation',
              label: 'Account Activation',
              caption: 'If enabled, the account will require email activation before the user can login.',
              value: false,
            },
          ],
        },
        {
          key: 'mail_settings', // Unique key for the section
          keys: [
            {
              key: 'mail_from',
              label: 'Mail From',
              caption: 'Change "Your Company Name" and "yourdomain.com" - do not remove the < and > characters.',
              value: 'Your Company Name <noreply@yourdomain.com>',
            },
            {
              key: 'activation_link',
              label: 'Activation Link',
              caption: 'The link to the activation file.',
              value: 'http://yourdomain.com/phplogin/activate.php',
            },
          ],
        },
      ],
    },
  ],
  fields: {
    'General-database_settings-db_host': {
      label: 'Database Host',
      caption: 'Your MySQL database hostname or IP address.',
      value: '82.24.188.5',
    },
    'General-database_settings-db_user': {
      label: 'Database User',
      caption: 'Your MySQL database username.',
      value: 'website',
    },
    'General-database_settings-db_pass': {
      label: 'Database Password',
      caption: 'Your MySQL database password.',
      value: 'g8n8vVLiuE1Z6qpS',
    },
    'General-database_settings-db_name': {
      label: 'Database Name',
      caption: 'Your MySQL database name.',
      value: 'phplogin',
    },
    'General-database_settings-db_charset': {
      label: 'Database Charset',
      caption: 'Your MySQL database charset.',
      value: 'utf8',
    },
    'Registration-registration_settings-auto_login_after_register': {
      label: 'Auto login after register',
      caption: 'If enabled, the user will be redirected to the homepage automatically upon registration.',
      value: false,
    },
    'Account Activation-account_activation_settings-account_activation': {
      label: 'Account Activation',
      caption: 'If enabled, the account will require email activation before the user can login.',
      value: false,
    },
    'Account Activation-mail_settings-mail_from': {
      label: 'Mail From',
      caption: 'Change "Your Company Name" and "yourdomain.com" - do not remove the < and > characters.',
      value: 'Your Company Name <noreply@yourdomain.com>',
    },
    'Account Activation-mail_settings-activation_link': {
      label: 'Activation Link',
      caption: 'The link to the activation file.',
      value: 'http://yourdomain.com/phplogin/activate.php',
    },
  },
};

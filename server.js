require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const main = require('./main.js'); // Assuming you have a 'main.js' file with your database connection
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const dcclient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

dcclient.once('ready', () => {
  console.log(`Logged in as ${dcclient.user.tag}`);
  dcnotifacation("ONLINE", "ATF Tracking System");
});

function dcnotifacation(type, msg) {
  const channelId = '1150042953012740148';
  const channel = dcclient.channels.cache.get(channelId);

  if (!channel) {
    console.error('Channel not found');
    return; // Exit the function early
  }
  if (type == "ONLINE") {
    const embed = new EmbedBuilder()
      .setColor("#0BFD00") // You can set the color using a hexadecimal color code
      .setTitle("ATF TRACKING SYSTEM ONLINE");
    channel.send({ embeds: [embed] });
  }
  if (type == "ERROR") {
    const embed = new EmbedBuilder()
      .setColor("#0BFD00") // You can set the color using a hexadecimal color code
      .setTitle("ATF TRACKING SYSTEM ERROR")
      .setDescription(msg);
    channel.send({ embeds: [embed] });
  };
}

const app = express();

const port = 25565;
const fs = require('fs');
const xml2js = require('xml2js');
const axios = require('axios');

// Import the node-php package
const php = require('node-php');
app.use('/php', php.cgi(__dirname + '/php'));
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(express.static('assets'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
function smsNotifacation(msg) {
  // Twilio SMS notification code (if needed)
}


// Background script to fetch XML data and convert to JSON every 10 seconds
setInterval(() => {
  axios.get('http://173.199.76.125:18001/feed/dedicated-server-stats.xml?code=727abb5e6636298712ede57477209220')
    .then(response => {
      const data = response.data;

      const parser = new xml2js.Parser();
      parser.parseString(data, (err, result) => {
        if (err) {
          smsNotifacation('[' + new Date + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error parsing XML: ' + err)
          console.error('Error parsing XML:', err);
          dcnotifacation("ERROR", err);
          fs.appendFile('errlog.txt', '[' + new Date() + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error fetching XML data: ' + error, (appendError) => {
            if (appendError) {
              console.error('Error appending to log file:', appendError);
            }
          });

          return;
        }

        const jsonData = JSON.stringify(result);
        fs.writeFile('data.json', jsonData, 'utf-8', (err) => {
          if (err) {
            smsNotifacation('[' + new Date + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error writing JSON file: ' + err)
            dcnotifacation("ERROR", err)
            console.error('Error writing JSON file:', err);
            fs.appendFile('errlog.txt', '[' + new Date() + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error writing JSON file: ' + err, (appendError) => {
              if (appendError) {
                console.error('Error appending to log file:', appendError);
              }
            });


          } else {
            console.log('XML data successfully converted to JSON');
          }
        });
      });
    })
    .catch(error => {
      console.error('Error fetching XML data:', error)
      dcnotifacation("ERROR", error);
      fs.appendFile('errlog.txt', '[' + new Date() + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error fetching XML data: ' + error)
      smsNotifacation('[' + new Date + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error fetching XML data: ' + error)
    });
}, 10000); // Run every 10 seconds (10000 milliseconds)

// Route
function secondsToHoursMinutes(seconds) {
  sec = seconds * 60
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

app.get('/api/fetch-data-player-stats', (req, res) => {
  fs.readFile('data.json', 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      dcnotifacation("ERROR", err)
      fs.appendFile('errlog.txt', '[' + new Date + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error reading JSON file: ' + err);
      smsNotifacation('[' + new Date + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error reading JSON file: ' + err);
      res.status(500).json({ error: 'Error reading JSON file' });
      return;
    }

    try {
      const jsonData = JSON.parse(data);
      // Extract and filter player data as needed
      const players = jsonData.Server?.Slots?.[0]?.Player || [];

      const filteredPlayerData = players
        .filter(player => player.$?.isUsed === 'true')
        .map(player => {
          const isInVehicle = typeof player.$?.x !== 'undefined';
          return {
            name: player._,
            uptime: secondsToHoursMinutes(parseInt(player.$?.uptime)),
            isAdmin: player.$?.isAdmin,
            isInVehicle: isInVehicle,
          };
        });


      // Then send it as JSON response
      res.json({ players: filteredPlayerData });
    } catch (parseError) {
      console.error('Error parsing JSON data:', parseError);
      dcnotifacation("ERROR", parseError)
      fs.appendFile('errlog.txt', '[' + new Date() + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error parsing JSON data: ' + parseError);
      smsNotifacation('[' + new Date + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error parsing JSON data: ' + parseError);
      res.status(500).json({ error: 'Error parsing JSON data' });
    }
  });
});

app.get('/api/fetch-data-map', (req, res) => {
  fs.readFile('data.json', 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      dcnotifacation("ERROR", err)
      fs.appendFile('errlog.txt', '[' + new Date() + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error parsing JSON data: ' + parseError, (appendError) => {
        if (appendError) {
          console.error('Error appending to log file:', appendError);
        }
      });

      smsNotifacation('[' + new Date + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error reading JSON file: ' + err)
      dcnotifacation("ERROR", err)
      res.status(500).json({ error: 'Error reading JSON file' });
      return;
    }

    try {
      const jsonData = JSON.parse(data);
      const slots = jsonData.Server?.Slots?.[0] || {};
      const players = slots.Player || [];
      const vehicles = jsonData.Server?.Vehicles?.[0]?.Vehicle || [];
      const farmlands = jsonData.Server.Farmlands?.[0]?.Farmland || [];
      const fields = jsonData.Server.Fields?.[0]?.Field || [];
      const capacity = jsonData.Server?.Slots?.[0]?.$?.capacity;
      const numUsed = jsonData.Server?.Slots?.[0]?.$?.numUsed;

      // Create maps to store player positions and vehicle positions
      const playerPositionMap = {};
      const vehiclePositionMap = {};

      players.forEach(player => {
        const name = player._;
        const x = player.$?.x;
        const y = player.$?.y;
        const z = player.$?.z;
        const isPlayerAdmin = player.$?.isAdmin;
        if (x !== undefined && y !== undefined && z !== undefined) {
          playerPositionMap[name] = { x, y, z };
        }
      });

      vehicles.forEach(vehicle => {
        const controller = vehicle.$.controller;
        const x = vehicle.$.x;
        const y = vehicle.$.y;
        const z = vehicle.$.z;

        if (controller && x !== undefined && y !== undefined && z !== undefined) {
          vehiclePositionMap[controller] = { x, y, z };
        }
      });

      // Prepare the data to send to the client
      const playerData = players.map(player => {
        const name = player._;
        const isAdmin = player.$?.isAdmin;
        const position = vehiclePositionMap[name] || playerPositionMap[name];
        const uptime = secondsToHoursMinutes(parseInt(player.$?.uptime));

        return { name, position, isAdmin, uptime };
      });

      const vehicleData = vehicles.map(vehicle => {
        const name = vehicle.$?.name.replace('.', ''); // Remove the dot from the name
        const type = vehicle.$?.type;
        const vX = vehicle.$?.x;
        const vY = vehicle.$?.y;
        const vZ = vehicle.$?.z;
        const controller = vehicle.$?.controller;
        const category = vehicle.$?.category;

        return { name, type, vX, vY, vZ, controller, category };
      })
      const farmlandData = farmlands.map(Farmland => {
        const name = Farmland.$?.name.replace('.', ''); // Remove the dot from the name
        const id = Farmland.$?.id;
        const owner = Farmland.$?.owner;
        const area = Farmland.$?.area;
        const farmlandX = Farmland.$?.x;
        const farmlandY = Farmland.$?.y;
        const farmlandZ = Farmland.$?.z;

        return { name, id, owner, area, farmlandX, farmlandY, farmlandZ };
      })
      const fieldData = fields.map(Field => {
        const id = Field.$?.id;
        const fieldX = Field.$?.x;
        const fieldZ = Field.$?.z;
        const isOwned = Field.$?.isOwned;

        return { id, fieldX, fieldZ, isOwned };
      })
      const slotData = {
        slotCount: capacity,
        playersOnline: numUsed,
      };

      res.json({ players: playerData, vehicles: vehicleData, slots: slotData, farmlands: farmlandData, fields: fieldData });
    } catch (parseError) {
      console.error('Error parsing JSON data:', parseError);
      dcnotifacation("ERROR", parseError)
      fs.appendFile('errlog.txt', '[' + new Date() + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'ATF Monitoring Server is up and running!', (appendError) => {
        if (appendError) {
          console.error('Error appending to log file:', appendError);
        }
      });

      smsNotifacation('[' + new Date + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error parsing JSON data: ' + parseError)
      dcnotifacation("ERROR", parseError)
      res.status(500).json({ error: 'Error parsing JSON data' });
    }
  });
});

app.get('/', (req, res) => {
  res.render("Login/index.ejs")
});

app.get('/map', (req, res) => {
  res.render("Map/index.ejs")
});

// Define a route to handle the form submission (authentication)
app.post('/authenticate', (req, res) => {
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

            // Send a success response
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


// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  smsNotifacation('[' + new Date() + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'ATF Monitoring Server is up and running!')
  dcclient.login(process.env.BOT_TOKEN)
});

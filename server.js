require('dotenv').config();
const express = require('express');
const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const app = express();

const port = 25565;
const fs = require('fs');
const xml2js = require('xml2js');
const axios = require('axios');

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(express.static('assets'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function smsNotifacation(msg){
  client.messages.create({
    body: msg,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: process.env.YOUR_PHONE_NUMBER,
  })
  .then(message => console.log(`Notification sent: ${message.sid}`))
  .catch(error => console.error(`Error sending notification: ${error.message}`));
}

// Background script to fetch XML data and convert to JSON every 10 seconds
setInterval(() => {
  axios.get('http://173.199.76.125:18001/feed/dedicated-server-stats.xml?code=727abb5e6636298712ede57477209220')
    .then(response => {
      const data = response.data;

      const parser = new xml2js.Parser();
      parser.parseString(data, (err, result) => {
        if (err) {
          smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error parsing XML: ' +  err)
          console.error('Error parsing XML:', err);
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
            smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error writing JSON file: ' +  err)  
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
      console.error('Error fetching XML data:', error);
      fs.appendFile('errlog.txt','[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error fetching XML data: ' +  error)
      smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error fetching XML data: ' +  error)
    });
}, 10000); // Run every 10 seconds (10000 milliseconds)

// Route
app.get('/api/fetch-data-player-stats', (req, res) => {
  fs.readFile('data.json', 'utf-8', (err, data) => {
      if (err) {
          console.error('Error reading JSON file:', err);
          fs.appendFile('errlog.txt','[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error reading JSON file: ' +  err)
          smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error reading JSON file: ' +  err)
          res.status(500).json({ error: 'Error reading JSON file' });
          return;
      }

      try {
          const jsonData = JSON.parse(data);
          // Extract and filter player data as needed
          const players = jsonData.Server?.Slots?.[0]?.Player || [];
          
          const filteredPlayerData = players
              .filter(player => player.$?.isUsed === 'true')
              .map(player => ({
                  name: player._,
                  uptime: player.$?.uptime,
                  isAdmin: player.$?.isAdmin,
                  x: player.$?.x,
                  y: player.$?.y,
                  z: player.$?.z,
              }));

          // Then send it as JSON response
          res.json({ players: filteredPlayerData });
      } catch (parseError) {
          console.error('Error parsing JSON data:', parseError);
          fs.appendFile('errlog.txt','[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error parsing JSON data: ' +  parseError)
          smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error parsing JSON data: ' +  parseError)
          res.status(500).json({ error: 'Error parsing JSON data' });
      }
  });
});

app.get('/api/fetch-data-map', (req, res) => {
  fs.readFile('data.json', 'utf-8', (err, data) => {
      if (err) {
          console.error('Error reading JSON file:', err);
          fs.appendFile('errlog.txt', '[' + new Date() + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error parsing JSON data: ' + parseError, (appendError) => {
            if (appendError) {
              console.error('Error appending to log file:', appendError);
            }
          });
          
          smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error reading JSON file: ' +  err)
          res.status(500).json({ error: 'Error reading JSON file' });
          return;
      }

      try {
        const jsonData = JSON.parse(data);
        const slots = jsonData.Server?.Slots?.[0] || {};
        const players = slots.Player || [];
        const vehicles = jsonData.Server?.Vehicles?.[0]?.Vehicle || [];
  
        // Create maps to store player positions and vehicle positions
        const playerPositionMap = {};
        const vehiclePositionMap = {};
  
        players.forEach(player => {
          const name = player._;
          const x = player.$?.x; // Check if x is defined for the player
          if (x !== undefined) {
            playerPositionMap[name] = x;
          }
        });
  
        vehicles.forEach(vehicle => {
          const controller = vehicle.$.controller;
          const x = vehicle.$.x; // Check if x is defined for the vehicle
          if (controller && x !== undefined) {
            vehiclePositionMap[controller] = x;
          }
        });
  
        // Prepare the data to send to the client
        const playerData = players.map(player => {
          const name = player._;
          const x = vehiclePositionMap[name] !== undefined ? vehiclePositionMap[name] : playerPositionMap[name];
          
          return { name, x };
        });
  
        res.json({ players: playerData });
      } catch (parseError) {
          console.error('Error parsing JSON data:', parseError);
          fs.appendFile('errlog.txt', '[' + new Date() + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'ATF Monitoring Server is up and running!', (appendError) => {
            if (appendError) {
              console.error('Error appending to log file:', appendError);
            }
          });
          
          smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error parsing JSON data: ' +  parseError)
          res.status(500).json({ error: 'Error parsing JSON data' });
      }
  });
});

app.get('/', (req, res) => {
  fs.readFile('data.json', 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      fs.appendFile('errlog.txt','[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error reading JSON file: ' +  err)
      smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error reading JSON file: ' +  err)
      res.render('error', { message: 'Error reading JSON file' });
      return;
    }

    try {
      const jsonData = JSON.parse(data);
      const server = jsonData.Server;
      if (!server || !Array.isArray(server.Slots) || server.Slots.length === 0) {
        console.error('No server data or Slots array found in JSON.');
        res.render('error', { message: 'No server data or Slots array found in JSON' });
        fs.appendFile('errlog.txt','[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'No server data or Slots array found in JSON')
        smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'No server data or Slots array found in JSON')
        return;
      }

      const slots = server.Slots[0];
      if (!Array.isArray(slots.Player) || slots.Player.length === 0) {
        console.error('No Player array found in JSON.');
        fs.appendFile('errlog.txt','[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'No Player data found in JSON')
        smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'No Player data found in JSON')
        res.render('error', { message: 'No Player array found in JSON' });
        return;
      }

      const players = slots.Player.filter(player => player.$?.isUsed === 'true');
      const playerData = players.map(player => ({
        name: player._,
        uptime: player.$?.uptime,
        isAdmin: player.$?.isAdmin,
      }));

      res.render('index', { players: playerData });
    } catch (parseError) {
      console.error('Error parsing JSON data:', parseError);
      fs.appendFile('errlog.txt','[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error parsing JSON data: ' +  parseError)
      smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error parsing JSON data: ' +  parseError)
      res.send( 'Error parsing JSON data');
    }
  });
});

app.get('/map', (req, res) => {
  res.render("map")
});


// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'ATF Monitoring Server is up and running!')
});

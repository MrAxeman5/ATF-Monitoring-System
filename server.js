require('dotenv').config();
const express = require('express');
const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const dcclient = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ] });

  dcclient.once('ready', () => {
    console.log(`Logged in as ${dcclient.user.tag}`);
    dcnotifacation( "ONLINE",  "ATF Tracking System")
  });
  function dcnotifacation(type, msg){
    const channelId = '1150042953012740148'
    const channel = dcclient.channels.cache.get(channelId);

    if (!channel) {
      console.error('Channel not found');
      return; // Exit the function early
    }
    if(type == "ONLINE"){
      const embed = new EmbedBuilder()
        .setColor("#0BFD00") // You can set the color using a hexadecimal color code
        .setTitle("ATF TRACKING SYSTEM ONLINE");
      channel.send({embeds: [embed]});
    }
    if(type == "ERROR"){
      const embed = new EmbedBuilder()
        .setColor("#0BFD00") // You can set the color using a hexadecimal color code
        .setTitle("ATF TRACKING SYSTEM ERROR")
        .setDescription(msg);
      channel.send({embeds: [embed]});
    };
  }
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
  .catch(error => 
    console.error(`Error sending notification: ${error.message}`));
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
          dcnotifacation( "ERROR",  err)
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
            dcnotifacation( "ERROR",  err)
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
      dcnotifacation( "ERROR",  error);
      fs.appendFile('errlog.txt','[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error fetching XML data: ' +  error)
      smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error fetching XML data: ' +  error)
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
          dcnotifacation( "ERROR",  err)
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
          dcnotifacation( "ERROR",  parseError)
          fs.appendFile('errlog.txt', '[' + new Date + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error parsing JSON data: ' + parseError);
          smsNotifacation('[' + new Date + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error parsing JSON data: ' + parseError);
          res.status(500).json({ error: 'Error parsing JSON data' });
      }
  });
});

app.get('/api/fetch-data-map', (req, res) => {
  fs.readFile('data.json', 'utf-8', (err, data) => {
      if (err) {
          console.error('Error reading JSON file:', err);
          dcnotifacation( "ERROR",  err)
          fs.appendFile('errlog.txt', '[' + new Date() + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'Error parsing JSON data: ' + parseError, (appendError) => {
            if (appendError) {
              console.error('Error appending to log file:', appendError);
            }
          });
          
          smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error reading JSON file: ' +  err)
          dcnotifacation( "ERROR",  err)
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
          const x = player.$?.x;
          const y = player.$?.y;
          const z = player.$?.z;
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
          const isAdmin = player.isAdmin

          const position = vehiclePositionMap[name] || playerPositionMap[name];
          
          return { name, position };
        });
  
        res.json({ players: playerData });
      } catch (parseError) {
          console.error('Error parsing JSON data:', parseError);
          dcnotifacation( "ERROR",  parseError)
          fs.appendFile('errlog.txt', '[' + new Date() + ']' + '(' + new Date().toLocaleTimeString() + ')' + 'ATF Monitoring Server is up and running!', (appendError) => {
            if (appendError) {
              console.error('Error appending to log file:', appendError);
            }
          });
          
          smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error parsing JSON data: ' +  parseError)
          dcnotifacation( "ERROR",  parseError)
          res.status(500).json({ error: 'Error parsing JSON data' });
      }
  });
});

app.get('/', (req, res) => {
  fs.readFile('data.json', 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      dcnotifacation( "ERROR",  err)
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
        dcnotifacation( "ERROR", 'No server data or Slots array found in JSON' )
        fs.appendFile('errlog.txt','[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'No server data or Slots array found in JSON')
        smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'No server data or Slots array found in JSON')
        return;
      }

      const slots = server.Slots[0];
      if (!Array.isArray(slots.Player) || slots.Player.length === 0) {
        console.error('No Player array found in JSON.');
        dcnotifacation( "ERROR",  'No Player array found in JSON.')
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
      dcnotifacation( "ERROR",  parseError)
      fs.appendFile('errlog.txt','[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error parsing JSON data: ' +  parseError)
      smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'Error parsing JSON data: ' +  parseError)
      res.send( 'Error parsing JSON data');
    }
  });
});

app.get('/map', (req, res) => {
  res.render("Map/index.ejs")
});


// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  smsNotifacation('[' +  new Date + ']'+'('+new Date().toLocaleTimeString()+')' +'ATF Monitoring Server is up and running!')
  dcclient.login(process.env.BOT_TOKEN)
});


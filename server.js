const express = require('express');
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

// Background script to fetch XML data and convert to JSON every 10 seconds
setInterval(() => {
  axios.get('http://173.199.76.125:18001/feed/dedicated-server-stats.xml?code=727abb5e6636298712ede57477209220')
    .then(response => {
      const data = response.data;

      const parser = new xml2js.Parser();
      parser.parseString(data, (err, result) => {
        if (err) {
          console.error('Error parsing XML:', err);
          return;
        }

        const jsonData = JSON.stringify(result);
        fs.writeFile('data.json', jsonData, 'utf-8', (err) => {
          if (err) {
            console.error('Error writing JSON file:', err);
          } else {
            console.log('XML data successfully converted to JSON');
          }
        });
      });
    })
    .catch(error => {
      console.error('Error fetching XML data:', error);
    });
}, 10000); // Run every 10 seconds (10000 milliseconds)

// Route
app.get('/api/fetch-data', (req, res) => {
  fs.readFile('data.json', 'utf-8', (err, data) => {
      if (err) {
          console.error('Error reading JSON file:', err);
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
              }));

          // Then send it as JSON response
          res.json({ players: filteredPlayerData });
      } catch (parseError) {
          console.error('Error parsing JSON data:', parseError);
          res.status(500).json({ error: 'Error parsing JSON data' });
      }
  });
});

app.get('/', (req, res) => {
  fs.readFile('data.json', 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      res.render('error', { message: 'Error reading JSON file' });
      return;
    }

    try {
      const jsonData = JSON.parse(data);
      const server = jsonData.Server;
      if (!server || !Array.isArray(server.Slots) || server.Slots.length === 0) {
        console.error('No server data or Slots array found in JSON.');
        res.render('error', { message: 'No server data or Slots array found in JSON' });
        return;
      }

      const slots = server.Slots[0];
      if (!Array.isArray(slots.Player) || slots.Player.length === 0) {
        console.error('No Player array found in JSON.');
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
      res.send( 'Error parsing JSON data');
    }
  });
});

app.get('/map', (req, res) => {
  const jsonData = fs.readFileSync('data.json', 'utf-8');
  const players = JSON.parse(jsonData).Server.Slots[0].Player.filter(player => player._ !== undefined);
  const imageUrl = '/images/overview.png';

  res.render('map', { players, imageUrl });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

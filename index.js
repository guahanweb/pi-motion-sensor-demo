'use strict';

const express = require('express');
const WebSocket = require('websocket').server;
const os = require('os');

const app = express();
const port = process.env.PORT || 1337;

const ifaces = os.networkInterfaces();

// look up local IP address
let address;
Object.keys(ifaces).forEach(function (ifname) {
    let alias = 0;

    ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            return; // skip internal and non-ipv4 addresses
        }

        if (ifname === 'en0') {
            console.log(`ADDRESS: ${iface.address}`);
            address = iface.address;
        }
    });
});

app.use(express.static('dist'));
app.use(express.static('client/public'));

app.get('/status', function (req, res) {
  res.json({ status: 'ok' });
});

const server = app.listen(port, function () {
  console.log(`Server is now listening on port ${port}`);
  console.log(`Run the following command on the PI:`);
  console.log(`  WEBSOCKET="ws://${address}:${port}" node index`);
});

const ws = new WebSocket({ httpServer: server });

let connections = [];
ws.on('request', function (request) {
  const connection = request.accept(null, request.origin);
  connections.push(connection);

  connection.on('message', function (message) {
    console.log('GOT:', message.utf8Data);

    // poor man's broadcast
    // ideally, we would have one inbound for Pi connections and
    // one outbound for web connections.
    connections.forEach(conn => {
      conn.send(message.utf8Data);
    });
  });

  connection.on('close', function (connection) {
      // Close user connection
  });
});

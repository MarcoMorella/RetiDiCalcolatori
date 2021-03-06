module.exports = function(app, wss){

  const WSfunctions = require('./websocket_functions.js'); //get functions


  app.ws('/home', (ws, req) => { //handling a new open connection
    console.log("client connected");
    var username = undefined;
    const client_ip = req.connection.remoteAddress;

    username = WSfunctions.check_connection(ws, req, client_ip); //check connection and also take username

    ws.on('message', (msg) => { //handling a message received
        console.log("[websocket.js] Message arrived: " + msg + ", from: " + username);
        WSfunctions.send_to_all(msg, username, wss);
    });

    ws.on('close', (client) => { //handling a connection close
      console.log("[websocket.js] A client left chat: " + client_ip);
    });

    ws.on('error', (client) => { //handling a error
      console.log("[websocket.js] There was an error with a client: " + error + " ip: " + client_ip);
    });

  });

}

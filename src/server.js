const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read the index into memory
const index = fs.readFileSync(`${__dirname}/../client/client.html`);


const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`listening on 127.0.0.1: ${port}`);

const io = socketio(app);

const users = {};

let lastSent = '/echo';

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    users[data.name] = socket;// data;
    console.dir(data);
            // message back to new user
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
      isServer: true,
    };

    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('room1');

            // announcement to everyone in the room
    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
      isServer: true,
    };
    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);
            // success message back to new user
    socket.emit('msg', { name: 'server', msg: 'You joined the room', isServer: true });
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msg', (data) => {
    let msg = data.msg;
    if (msg !== '') {
      if (msg === '/shrug') {
        msg = '¯\\_(ツ)_/¯';
      }
      if (msg === '/echo') {
        msg = lastSent;
      } else {
        lastSent = msg;
      }
      console.dir(data);
        // message back to new user
      const toSend = {
        name: socket.name,
        msg,
      };
        // socket.emit('msg', sentMsg);

        // announcement to everyone in the room
      socket.broadcast.to('room1').emit('msg', toSend);

      toSend.fromSelf = true;
      socket.emit('msg', toSend);
        // success message back to new user
        // socket.emit('msg', { name: 'server', msg: 'You joined the room', isServer:true });
    }
  });
  socket.on('msgToServer', (data) => {
    io.sockets.in('room1'.emit('msg', { name: socket.name, msg: data.msg }));
  });
};

const onDisconnect = (sock) => {
  const socket = sock;
  console.log(`${socket.name} left the server`);

          // announcement to everyone in the room
  const response = {
    name: 'server',
    msg: `${socket.name} has left the room.`,
    isServer: true,
  };
  socket.broadcast.to('room1').emit('msg', response);

  delete users[socket.name];
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);

  socket.on('disconnect', () => {
    onDisconnect(socket);
  });
});


console.log('Websocket server started');

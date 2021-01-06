const express = require('express')
const { ExpressPeerServer } = require('peer');
const app = express()
var fs = require('fs');
// const server = require('http').Server(app)
const server = require('https').createServer({
  key: fs.readFileSync('/home/ec2-user/key.pem'),
  cert: fs.readFileSync('/home/ec2-user/server.crt')
}, app);
const peerServer = ExpressPeerServer(server, {
path: '/peerserver',
  ssl : {
    key: fs.readFileSync('/home/ec2-user/key.pem'),
    cert: fs.readFileSync('/home/ec2-user/server.crt')
  }
});
app.use('/peerjs', peerServer);
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
// import `cors` package
const cors = require('cors');

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// use middleware
app.use(cors({credentials: true, origin: true}));


app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/',  (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    console.log(userId + " joining room " + roomId)
    socket.join(roomId)
    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
    socket.on('peer-ready', (userId)=> {
      console.log('peer is ready', userId)
      socket.to(roomId).broadcast.emit('peer-ready', userId);
    })
    socket.on('broadcast-message', (usedId, message)=> {
      console.log(userId, ' is sending a message', message)
      socket.emit('on-message', userId, message)
      socket.to(roomId).broadcast.emit('on-message', usedId, message)
    })
  })
})

server.listen(3000)
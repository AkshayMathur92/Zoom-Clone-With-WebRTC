const express = require('express')
const app = express()
var fs = require('fs');
// const server = require('http').Server(app)
const server = require('https').createServer({
  key: fs.readFileSync('/home/ec2-user/key.pem'),
  cert: fs.readFileSync('/home/ec2-user/server.crt')
}, app);
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
// import `cors` package
const cors = require('cors');



// use middleware
app.use(cors());


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
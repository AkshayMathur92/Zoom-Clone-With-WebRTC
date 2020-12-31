const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

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
    setTimeout(() => {
      console.log("notifying other users a user is connected")
      socket.to(roomId).broadcast.emit('user-connected', userId)
    }, 5000);
    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })
})

async function wasteTime(){
  await new Promise(r => setTimeout(r, 2000));
}

server.listen(3000)
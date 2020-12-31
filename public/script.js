const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: false
}).then(stream => {

  myPeer.on('call', call => {
    console.log("a call is coming from another peer")
    call.answer(stream)
    console.log("answerred the call")
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    console.log("user connected socket", userId)
    connectToNewUser(userId, stream)
  })

  addVideoStream(myVideo, stream)
})

socket.on('user-disconnected', userId => {
  console.log('user disconnected' , userId)
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  console.log("User connected peer", id, ROOM_ID)
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  console.log("connecting to new user by making a call " )
  const call = myPeer.call(userId, stream)
  console.log("called my peer")
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    console.log("call is answered with stream")
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    console.log("call is disconnected")
    video.remove()
  })
  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}
const videoGrid = document.getElementById('video-grid')
const chatForm = document.getElementById('chatForm')
const messageList = document.getElementById('messages')
const inputText = document.getElementById('txt')
const myPeer = new Peer(undefined,{ 
  host: '/',
  port:3000,
  path: ''
})
const socket = io('/')
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myPeer.on('call', call => {
    console.log("a call is coming from another peer" + call.peer)
    call.answer(stream)
    console.log("answerred the call")
    const video = document.createElement('video')
    video.setAttribute('id', call.peer)
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    console.log("user connected socket", userId)
  })

  socket.on('peer-ready', userId => {
    console.log('peer - ready, connecting to peer')
    connectToNewUser(userId, stream)
  })

  socket.on('on-message', (usedId, message) => {
    console.log("I got the message from user ", usedId, "with message", message)
    var messageItem = document.createElement("li");
    var text = document.createTextNode(message)
    messageItem.appendChild(document.createElement('style'))
    if (myPeer.id == usedId) {
      messageItem.style.textAlign = "right";
    } else {
      messageItem.style.textAlign = "left"
    }
    messageItem.setAttribute('id', message);
    messageItem.appendChild(text);
    messageList.appendChild(messageItem);
  })

  chatForm.onsubmit = function (event) {
    console.log('used submitted a message')
    event.preventDefault();
    socket.emit('broadcast-message', myPeer.id, inputText.value)
    inputText.value = ''
    return false;
  }
  addVideoStream(myVideo, stream)
})

socket.on('user-disconnected', userId => {
  console.log('user disconnected', userId)
  if (peers[userId]) peers[userId].close()
  if (document.getElementById(userId) !== null) document.getElementById(userId).remove();
})

myPeer.on('open', id => {
  console.log("User connected peer", id, ROOM_ID)
  socket.emit('join-room', ROOM_ID, id)
  socket.emit('peer-ready', myPeer.id)
})

function connectToNewUser(userId, stream) {
  console.log("connecting to new user by making a call ")
  const call = myPeer.call(userId, stream)
  console.log("called my peer")
  const video = document.createElement('video')
  video.setAttribute('id', userId)
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
// /**
//  In this script we want to:
//     - create a new peer for that user
//     - get his video and put it in the DOM
//     - Handle events in which, when he calls another peer and 
//         when another peer calls him
//     - get remote videos of connected peers
//     - add them to the video grid
//  */
const userName = prompt('What is your name?')

// function that will add local stream to the videos grid
const addLocalStream = (stream) => {
    const localVideo = document.getElementById('localVideo')
    const video = document.createElement('video')
    video.srcObject = stream
    video.muted = true
    video.onloadedmetadata = () => {
        video.play()
    }
    const videoOwnerAndName = document.createElement('div')
    const nameOfTheVideoOwner = document.createElement('p')
    nameOfTheVideoOwner.innerText = 'You'
    videoOwnerAndName.appendChild(nameOfTheVideoOwner)
    videoOwnerAndName.appendChild(video)
    localVideo.appendChild(videoOwnerAndName)
}

// function that will add remote stream to the videos grid
// and save the id of the user in which this video belongs to
const addRemoteStream = (stream, id, name) => {
    const videosGrid = document.getElementById('videosGrid')
    const videoOwnerAndName = document.createElement('div')
    videoOwnerAndName.setAttribute('id', id)
    const nameOfTheVideoOwner = document.createElement('p')
    nameOfTheVideoOwner.innerText = name
    const video = document.createElement('video')
    video.srcObject = stream
    video.onloadedmetadata = () => {
        video.play()
    }
    videoOwnerAndName.appendChild(nameOfTheVideoOwner)
    videoOwnerAndName.appendChild(video)
    videosGrid.appendChild(videoOwnerAndName)
}

// function that will enable user to copy url of the room and send it to other people
const copyUrl = () => {
    const holdingTheUrl = document.createElement('input')
    const url = window.location.href
    document.body.appendChild(holdingTheUrl)
    holdingTheUrl.value = url
    holdingTheUrl.select();
    document.execCommand('copy');
    holdingTheUrl.remove()
}

// function that will confirm to user that url is copied
const confirmUrlCopy = () => {
    const confirmation = document.getElementById('copyUrlConfirmation')
    confirmation.innerText = 'Url is copied successfully'
    setTimeout(() => {
        confirmation.innerText  = ''
    }, 1000)
}

// media options
const mediaOptions = {
    video: true,
    audio: true
}

// declare this in global scope as it will be used to signal the asnwer 
let initiatorPeer
// create a namespace for room page in the client side
const roomNameSpaceSocket = io('/room/:roomID')
roomNameSpaceSocket.on('connect', () => {
    // add user name to this socket
    roomNameSpaceSocket.name = userName
    // send room id to server to let the user join the room
    roomNameSpaceSocket.emit('send room id', roomID)
    // add local stream of the user
    navigator.mediaDevices.getUserMedia(mediaOptions)
        .then(stream => {
            addLocalStream(stream)
            // emit event to ask other users for their offers and send them this user id
            roomNameSpaceSocket.emit('ask other users for their offers', roomNameSpaceSocket.id)
        })
        .catch(err => console.log(err))
})

// listen to the event where the new joined user asks other users for their offers
roomNameSpaceSocket.on('send me your offer', initiatorID => {
   // get the users stream 
   // to send on offer with it
   navigator.mediaDevices.getUserMedia(mediaOptions)
    .then(stream => {        
        const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream,
        })
        initiatorPeer = peer
        
        // on signal take the offer and emit an event
        // in which the user send his offer to the new joined user
        peer.on('signal', offer => {
            roomNameSpaceSocket.emit('send offer', offer, roomNameSpaceSocket.id, initiatorID, roomNameSpaceSocket.name)
        })
        peer.on('connect', () => {
            console.log('connected')
        })
        peer.on('stream', stream => {
            addRemoteStream(stream, initiatorID, remoteVideoOwner)
        })
        
    })
    .catch(err => console.log(err))
})

// liten to event where the new joined user recieves offer
roomNameSpaceSocket.on('recieve offer', (offer, senderID, userName) => {
    // get the users stream 
   // to send the answer with it
   navigator.mediaDevices.getUserMedia(mediaOptions)
    .then(stream => {
        stream.name = userName
        const peer = new SimplePeer({
            trickle: false,
            stream,
        })
        peer.signal(offer)
        peer.on('signal', answer => {
            // emit event where the new joined user sends his answer back
            roomNameSpaceSocket.emit('recieve answer back', answer, senderID, roomNameSpaceSocket.name)
        })
        peer.on('connect', () => {
            console.log('connected')
        })
        peer.on('stream', stream => {
            addRemoteStream(stream, senderID, userName)
        })
    })
    .catch(err => console.log(err))
})


// listen to event where the user who sent the offer recieves answer from new joined user
let remoteVideoOwner = ''
roomNameSpaceSocket.on('send answer back', (answer, userName) => {
    remoteVideoOwner = userName
    initiatorPeer.signal(answer)
})

// when a user leaves the room
roomNameSpaceSocket.on('user left', id => {
    const videoToRemove = document.getElementById(id)
    // remove the user's video from the video grid
    videoToRemove.remove()
    // remove user name
    const videoOwner = document.getElementById(id)
    videoOwner.remove()
})

// function that will add message to dom
const addMsgToDom = (userName, msg) => {
    const msgContainer = document.createElement('div')
    msgContainer.setAttribute('class', 'msgContainer')
    const chatMessages = document.getElementById('chatMessages')
    const name = document.createElement('h1')
    name.innerText = userName + ':'
    name.setAttribute('class', 'senderName')
    const message = document.createElement('p')
    message.innerText = msg
    const underLine = document.createElement('hr')
    underLine.setAttribute('class', 'breakLine')
    message.setAttribute('class', 'message')
    msgContainer.appendChild(name)
    msgContainer.appendChild(message)
    msgContainer.appendChild(underLine)
    chatMessages.appendChild(msgContainer)
}

// if any user want to broadcast a message to other users

const sendMsgButton = document.getElementById('sendMsg')

sendMsgButton.onclick = () => {
    const textInput = document.getElementById('textInput')
    // broadcast msg to others
    const msg = textInput.value
    // add msg to sender dom
    if(msg) addMsgToDom(roomNameSpaceSocket.name,msg)
    roomNameSpaceSocket.emit('broadcast msg', msg, roomNameSpaceSocket.name)
    textInput.value = ''
}

const copyUrlButton = document.getElementById('copyUrl')
copyUrlButton.onclick = () => {
    copyUrl()
    alert('Link is copied successfully')
}



// listen to evet where we get a broadcasted message from a user and add it to the dom
roomNameSpaceSocket.on('recieve msg', (msg, userName) => {
    if(msg) addMsgToDom(userName,msg)
})
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = require('socket.io')(server)
const {v4: generateUniqueId} = require('uuid')
const port = 8000

// declare the rooms array globally
let rooms = []

// function that will create a new room
const createRoom = (id = generateUniqueId()) => {
    const room = {
        id,
        numberOfUsers: 0
    }
    return room
}

// set views for templating language
app.set('view engine', 'ejs')
// server static files
app.use(express.static('public'))

// on home page render homPage file
app.get('/', (req, res) => {
    res.render('homePage')
})

// on create room route
app.get('/createNewRoom', (req, res) => {
    // create a new room and add it to the rooms list
    // and get the room id
    newRoom = createRoom()
    roomId = newRoom.id
    rooms.push(newRoom)
    // redirect user to room page
    res.redirect(`/room/${roomId}`)
})

// Room namespace in the server side
const roomNameSpace = io.of('/room/:roomID')

roomNameSpace.on('connection', socket => {
    let roomID
    // when a new user come get the room id from him then let him join this room
    socket.on('send room id', id => {
        roomID = id
        // let this user join the room
        socket.join(id)
        // // get the room
        // const room = rooms.find(room => room.id === roomID)
        // // increment number of users in the room
        // if(room) {
        //     ++room.numberOfUsers
        // }
    })
    // listen to the event where the new joined user ask other users
    // in the room to send him an offer
    socket.on('ask other users for their offers', (initiatorID, initiatorName) => {
        // broadcast an event to ask users for their offers
        socket.to(roomID).emit('send me your offer', initiatorID, initiatorName)
    })
    // listen to event where when a user sends his offer to the new joined user
    socket.on('send offer', (offer, senderID, recieverID, userName) => {
        // emit event which will send the offer object to the new joined user(recieverID)
        // and give him sender id(the one who sent the offer)
        // to be able to recieve the answer
        socket.to(recieverID).emit('recieve offer', offer, senderID, userName)
    }) 
    // listen to event where the server send answer back to user who sent the offer
    socket.on('recieve answer back', (answer, senderID, userName) => {
        // emit event where the server sends the answer of the new joined user 
        // to the person who sent the offer
        socket.to(senderID).emit('send answer back', answer, userName)
    })

    // listen to event where a user wants to bradcast a msg to other users
    socket.on('broadcast msg', (msg, userName) => {
        socket.to(roomId).emit('recieve msg', msg, userName)
    })

    // listen to event where the server gets initiator name and id
    socket.on('send initiator name', (name, id) => {
        socket.to(roomId).emit('broadcast name and id', name, id)
    })

    // when a user leaves the room
    socket.on('disconnect', () => {
        const room = rooms.find(room => room.id === roomID)
        // decrement number of users in the room
        if(room) --room.numberOfUsers
        // when the last user in the room leaves
        // delete the room from the server
        // to prevent memory leakage
        if(room) {
            if(room.numberOfUsers === 0) {
                rooms.forEach((room, i) => {
                    if(room.id === roomID) {
                        rooms.splice(i, 1)
                    }
                })
            }
        }

        // when a user leaves the room
        socket.to(roomID).emit('user left', socket.id)
    })
})


app.get('/room/:roomID', (req, res) => {
    // here we will have 2 sceniarios
    // first, if the user is already invited and the room id does exist
    // second, if the user has a room id from previous conversation 
    // and the room doesn't exist anymore

    const roomID = req.params.roomID
    // find if the room exists
    const room = rooms.find(room => room.id === roomID)

    // first scenario
    // if the room exists
    if(room) {
        res.render('room', {
            roomID,
        })
    } else { // seceond scenario, if the room doesn't exist
        // repeat what happened on the create room route
        // create a new room and add it to the rooms list
        // and get the room id
        newRoom = createRoom(roomID)
        roomId = newRoom.id
        rooms.push(newRoom)
        // redirect user to room page
        res.redirect(`/room/${roomId}`)
        }
})

server.listen(port, () => {
    console.log(`Server started at port ${port}`)
})


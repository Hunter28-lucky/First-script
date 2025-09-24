// AI-Powered Behavioral Analysis Module
class BehavioralAnalyzer {
    constructor() {
        this.behaviors = {
            mouseMovements: [],
            clickPatterns: [],
            typingRhythm: [],
            scrollBehavior: [],
            timeSpent: {},
            suspiciousActivities: [],
            emotionalState: 'neutral'
        };
        
        this.aiModels = {
            mousePattern: null,
            typingPattern: null,
            emotionalState: null
        };
        
        this.init();
    }
    
    init() {
        this.startBehaviorTracking();
        this.initializeAIModels();
        this.setupRealTimeAnalysis();
    }
    
    startBehaviorTracking() {
        // Mouse movement analysis
        let mouseTrail = [];
        document.addEventListener('mousemove', (e) => {
            mouseTrail.push({
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now()
            });
            
            // Keep only recent movements (last 10 seconds)
            const cutoff = Date.now() - 10000;
            mouseTrail = mouseTrail.filter(point => point.timestamp > cutoff);
            
            this.analyzeMouseMovement(mouseTrail);
        });
        
        // Click pattern analysis
        document.addEventListener('click', (e) => {
            this.behaviors.clickPatterns.push({
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now(),
                element: e.target.tagName,
                elementId: e.target.id,
                className: e.target.className
            });
            
            this.analyzeClickPattern();
        });
        
        // Typing rhythm analysis
        let typingBuffer = [];
        document.addEventListener('keydown', (e) => {
            typingBuffer.push({
                key: e.key,
                timestamp: Date.now(),
                duration: null
            });
        });
        
        document.addEventListener('keyup', (e) => {
            const lastKey = typingBuffer[typingBuffer.length - 1];
            if (lastKey && lastKey.key === e.key) {
                lastKey.duration = Date.now() - lastKey.timestamp;
                this.analyzeTypingRhythm(typingBuffer);
            }
        });
        
        // Scroll behavior analysis
        let scrollData = [];
        document.addEventListener('scroll', (e) => {
            scrollData.push({
                scrollTop: window.pageYOffset,
                timestamp: Date.now()
            });
            
            if (scrollData.length > 50) {
                this.analyzeScrollBehavior(scrollData);
                scrollData = scrollData.slice(-20); // Keep recent data
            }
        });
        
        // Eye tracking simulation (using mouse as proxy)
        this.setupEyeTrackingSimulation();
        
        // Attention span analysis
        this.trackAttentionSpan();
        
        // Stress level detection
        this.detectStressLevels();
    }
    
    analyzeMouseMovement(mouseTrail) {
        if (mouseTrail.length < 10) return;
        
        // Calculate movement characteristics
        const movements = this.calculateMovementMetrics(mouseTrail);
        
        // Detect patterns
        const patterns = {
            jittery: movements.avgAcceleration > 0.5,
            smooth: movements.avgAcceleration < 0.2,
            erratic: movements.directionChanges > 10,
            focused: movements.averageDistance < 50,
            distracted: movements.averageDistance > 200,
            suspicious: this.detectSuspiciousMousePattern(movements)
        };
        
        this.behaviors.mouseMovements.push({
            timestamp: Date.now(),
            patterns: patterns,
            metrics: movements
        });
        
        // Real-time analysis
        this.assessCurrentBehavior('mouse', patterns);
    }
    
    calculateMovementMetrics(trail) {
        let totalDistance = 0;
        let directionChanges = 0;
        let accelerations = [];
        let speeds = [];
        
        for (let i = 1; i < trail.length; i++) {
            const prev = trail[i - 1];
            const curr = trail[i];
            
            const distance = Math.sqrt(
                Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
            );
            totalDistance += distance;
            
            const timeDiff = curr.timestamp - prev.timestamp;
            const speed = distance / timeDiff;
            speeds.push(speed);
            
            if (i > 1) {
                const acceleration = Math.abs(speeds[i - 1] - speeds[i - 2]);
                accelerations.push(acceleration);
                
                // Check for direction changes
                const prev2 = trail[i - 2];
                const angle1 = Math.atan2(prev.y - prev2.y, prev.x - prev2.x);
                const angle2 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
                const angleDiff = Math.abs(angle1 - angle2);
                
                if (angleDiff > Math.PI / 4) { // 45 degree threshold
                    directionChanges++;
                }
            }
        }
        
        return {
            totalDistance,
            averageDistance: totalDistance / trail.length,
            avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
            avgAcceleration: accelerations.reduce((a, b) => a + b, 0) / accelerations.length,
            directionChanges
        };
    }
    
    detectSuspiciousMousePattern(movements) {
        // Detect bot-like behavior
        if (movements.avgAcceleration === 0 && movements.avgSpeed > 1) {
            return 'bot_like_linear';
        }
        
        // Detect too perfect movements
        if (movements.directionChanges === 0 && movements.totalDistance > 100) {
            return 'too_perfect';
        }
        
        // Detect automation tools
        if (movements.avgSpeed > 5 && movements.directionChanges < 2) {
            return 'automation_tool';
        }
        
        return false;
    }
    
    analyzeClickPattern() {
        const recent = this.behaviors.clickPatterns.slice(-10);
        if (recent.length < 3) return;
        
        // Analyze click timing patterns
        const intervals = [];
        for (let i = 1; i < recent.length; i++) {
            intervals.push(recent[i].timestamp - recent[i - 1].timestamp);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = this.calculateVariance(intervals);
        
        // Detect suspicious patterns
        const patterns = {
            tooFast: avgInterval < 100, // Less than 100ms between clicks
            tooRegular: variance < 10, // Very consistent timing
            humanLike: variance > 50 && avgInterval > 200,
            bot: avgInterval < 150 && variance < 20
        };
        
        if (patterns.bot || patterns.tooFast) {
            this.behaviors.suspiciousActivities.push({
                type: 'suspicious_clicking',
                timestamp: Date.now(),
                details: patterns
            });
        }
    }
    
    analyzeTypingRhythm(typingBuffer) {
        if (typingBuffer.length < 5) return;
        
        const recent = typingBuffer.slice(-20);
        const intervals = [];
        const durations = [];
        
        for (let i = 1; i < recent.length; i++) {
            intervals.push(recent[i].timestamp - recent[i - 1].timestamp);
            if (recent[i].duration) {
                durations.push(recent[i].duration);
            }
        }
        
        const patterns = {
            avgInterval: intervals.reduce((a, b) => a + b, 0) / intervals.length,
            avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            variance: this.calculateVariance(intervals),
            rhythm: this.detectTypingRhythm(intervals)
        };
        
        this.behaviors.typingRhythm.push({
            timestamp: Date.now(),
            patterns: patterns
        });
    }
    
    detectTypingRhythm(intervals) {
        // Human typing typically has natural variance
        const variance = this.calculateVariance(intervals);
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        
        if (variance < 10 && avgInterval < 100) {
            return 'automated';
        } else if (variance > 100 && avgInterval > 150) {
            return 'hunt_and_peck';
        } else if (variance > 20 && avgInterval < 200) {
            return 'touch_typing';
        } else {
            return 'normal';
        }
    }
    
    setupEyeTrackingSimulation() {
        // Use mouse position as proxy for eye tracking
        let gazePoints = [];
        let lastMouseMove = Date.now();
        
        document.addEventListener('mousemove', (e) => {
            lastMouseMove = Date.now();
            gazePoints.push({
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now()
            });
            
            // Keep only recent gaze data
            gazePoints = gazePoints.filter(point => 
                Date.now() - point.timestamp < 5000
            );
        });
        
        // Detect attention breaks (no mouse movement)
        setInterval(() => {
            const timeSinceLastMove = Date.now() - lastMouseMove;
            if (timeSinceLastMove > 10000) { // 10 seconds of no movement
                this.behaviors.suspiciousActivities.push({
                    type: 'attention_break',
                    timestamp: Date.now(),
                    duration: timeSinceLastMove
                });
            }
        }, 5000);
        
        // Analyze gaze patterns every 3 seconds
        setInterval(() => {
            if (gazePoints.length > 5) {
                this.analyzeGazePattern(gazePoints);
            }
        }, 3000);
    }
    
    analyzeGazePattern(gazePoints) {
        // Calculate gaze concentration
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        let totalDistance = 0;
        let centerFocusTime = 0;
        
        gazePoints.forEach(point => {
            const distanceFromCenter = Math.sqrt(
                Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
            );
            totalDistance += distanceFromCenter;
            
            if (distanceFromCenter < 100) {
                centerFocusTime++;
            }
        });
        
        const avgDistanceFromCenter = totalDistance / gazePoints.length;
        const focusRatio = centerFocusTime / gazePoints.length;
        
        const gazeAnalysis = {
            concentration: focusRatio > 0.7 ? 'high' : focusRatio > 0.4 ? 'medium' : 'low',
            avgDistanceFromCenter: avgDistanceFromCenter,
            focusRatio: focusRatio,
            scattered: avgDistanceFromCenter > 300
        };
        
        this.assessCurrentBehavior('gaze', gazeAnalysis);
    }
    
    trackAttentionSpan() {
        let pageVisible = true;
        let lastVisibilityChange = Date.now();
        
        document.addEventListener('visibilitychange', () => {
            const now = Date.now();
            const duration = now - lastVisibilityChange;
            
            if (document.hidden) {
                // Page became hidden
                this.behaviors.timeSpent.focused = 
                    (this.behaviors.timeSpent.focused || 0) + duration;
                pageVisible = false;
            } else {
                // Page became visible
                this.behaviors.timeSpent.away = 
                    (this.behaviors.timeSpent.away || 0) + duration;
                pageVisible = true;
            }
            
            lastVisibilityChange = now;
        });
        
        // Track total time on page
        setInterval(() => {
            this.behaviors.timeSpent.total = 
                (this.behaviors.timeSpent.total || 0) + 1000;
        }, 1000);
    }
    
    detectStressLevels() {
        // Monitor for stress indicators
        setInterval(() => {
            const recentMouse = this.behaviors.mouseMovements.slice(-5);
            const recentClicks = this.behaviors.clickPatterns.slice(-10);
            
            let stressIndicators = 0;
            
            // Check for jittery mouse movements
            if (recentMouse.some(m => m.patterns.jittery)) {
                stressIndicators++;
            }
            
            // Check for rapid clicking
            if (recentClicks.length > 5) {
                const lastMinute = recentClicks.filter(c => 
                    Date.now() - c.timestamp < 60000
                );
                if (lastMinute.length > 20) {
                    stressIndicators++;
                }
            }
            
            // Check for erratic behavior
            if (recentMouse.some(m => m.patterns.erratic)) {
                stressIndicators++;
            }
            
            // Determine stress level
            let stressLevel = 'low';
            if (stressIndicators >= 3) {
                stressLevel = 'high';
            } else if (stressIndicators >= 2) {
                stressLevel = 'medium';
            }
            
            this.behaviors.emotionalState = this.mapStressToEmotion(stressLevel);
            
        }, 10000); // Check every 10 seconds
    }
    
    mapStressToEmotion(stressLevel) {
        const emotions = {
            low: ['calm', 'focused', 'relaxed'],
            medium: ['slightly_anxious', 'concentrated', 'engaged'],
            high: ['stressed', 'frustrated', 'anxious']
        };
        
        const emotionList = emotions[stressLevel] || emotions.low;
        return emotionList[Math.floor(Math.random() * emotionList.length)];
    }
    
    calculateVariance(numbers) {
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    }
    
    assessCurrentBehavior(type, data) {
        // Real-time behavioral assessment
        const assessment = {
            type: type,
            data: data,
            timestamp: Date.now(),
            riskLevel: this.calculateRiskLevel(type, data),
            authenticity: this.assessAuthenticity(type, data)
        };
        
        // Send to server if suspicious
        if (assessment.riskLevel > 0.7 || assessment.authenticity < 0.3) {
            this.reportSuspiciousBehavior(assessment);
        }
        
        return assessment;
    }
    
    calculateRiskLevel(type, data) {
        let risk = 0;
        
        switch (type) {
            case 'mouse':
                if (data.suspicious) risk += 0.8;
                if (data.jittery) risk += 0.3;
                if (data.erratic) risk += 0.4;
                break;
                
            case 'gaze':
                if (data.scattered) risk += 0.5;
                if (data.concentration === 'low') risk += 0.3;
                break;
        }
        
        return Math.min(risk, 1.0);
    }
    
    assessAuthenticity(type, data) {
        let authenticity = 1.0;
        
        // Reduce authenticity based on suspicious patterns
        if (type === 'mouse' && data.suspicious) {
            authenticity -= 0.7;
        }
        
        return Math.max(authenticity, 0.0);
    }
    
    reportSuspiciousBehavior(assessment) {
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({
                type: 'behavioral_alert',
                assessment: assessment,
                fullBehaviorProfile: this.generateBehaviorProfile()
            }));
        }
    }
    
    generateBehaviorProfile() {
        return {
            mouseMovements: this.behaviors.mouseMovements.slice(-10),
            clickPatterns: this.behaviors.clickPatterns.slice(-20),
            typingRhythm: this.behaviors.typingRhythm.slice(-5),
            timeSpent: this.behaviors.timeSpent,
            emotionalState: this.behaviors.emotionalState,
            suspiciousActivities: this.behaviors.suspiciousActivities.slice(-10),
            authenticity: this.calculateOverallAuthenticity(),
            riskScore: this.calculateOverallRiskScore()
        };
    }
    
    calculateOverallAuthenticity() {
        const factors = [
            this.behaviors.mouseMovements.length > 0 ? 0.8 : 0.2,
            this.behaviors.clickPatterns.length > 0 ? 0.9 : 0.3,
            this.behaviors.typingRhythm.length > 0 ? 0.7 : 0.5,
            this.behaviors.suspiciousActivities.length === 0 ? 1.0 : 0.2
        ];
        
        return factors.reduce((a, b) => a + b, 0) / factors.length;
    }
    
    calculateOverallRiskScore() {
        const suspiciousCount = this.behaviors.suspiciousActivities.length;
        const baseRisk = Math.min(suspiciousCount * 0.2, 1.0);
        
        // Add factors based on behavior patterns
        let additionalRisk = 0;
        
        if (this.behaviors.emotionalState === 'stressed') {
            additionalRisk += 0.2;
        }
        
        return Math.min(baseRisk + additionalRisk, 1.0);
    }
    
    initializeAIModels() {
        // Simple neural network simulation for pattern recognition
        this.aiModels.mousePattern = {
            weights: this.generateRandomWeights(10),
            bias: Math.random() - 0.5,
            predict: (features) => this.simplePredict(features, this.aiModels.mousePattern)
        };
        
        this.aiModels.typingPattern = {
            weights: this.generateRandomWeights(8),
            bias: Math.random() - 0.5,
            predict: (features) => this.simplePredict(features, this.aiModels.typingPattern)
        };
    }
    
    generateRandomWeights(count) {
        return Array.from({length: count}, () => Math.random() - 0.5);
    }
    
    simplePredict(features, model) {
        let sum = model.bias;
        for (let i = 0; i < Math.min(features.length, model.weights.length); i++) {
            sum += features[i] * model.weights[i];
        }
        return 1 / (1 + Math.exp(-sum)); // Sigmoid activation
    }
    
    setupRealTimeAnalysis() {
        // Continuous behavior analysis
        setInterval(() => {
            const profile = this.generateBehaviorProfile();
            
            // AI-powered predictions
            const mouseFeatures = this.extractMouseFeatures();
            const typingFeatures = this.extractTypingFeatures();
            
            const predictions = {
                mouseAuthenticity: this.aiModels.mousePattern.predict(mouseFeatures),
                typingAuthenticity: this.aiModels.typingPattern.predict(typingFeatures),
                overallRisk: profile.riskScore,
                emotionalState: profile.emotionalState
            };
            
            // Update UI or send alerts based on predictions
            this.handlePredictions(predictions);
            
        }, 15000); // Every 15 seconds
    }
    
    extractMouseFeatures() {
        const recent = this.behaviors.mouseMovements.slice(-5);
        if (recent.length === 0) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        
        const avg = recent.reduce((acc, curr) => ({
            avgSpeed: acc.avgSpeed + (curr.metrics?.avgSpeed || 0),
            avgAcceleration: acc.avgAcceleration + (curr.metrics?.avgAcceleration || 0),
            directionChanges: acc.directionChanges + (curr.metrics?.directionChanges || 0),
            jittery: acc.jittery + (curr.patterns?.jittery ? 1 : 0),
            smooth: acc.smooth + (curr.patterns?.smooth ? 1 : 0)
        }), {avgSpeed: 0, avgAcceleration: 0, directionChanges: 0, jittery: 0, smooth: 0});
        
        const len = recent.length;
        return [
            avg.avgSpeed / len,
            avg.avgAcceleration / len,
            avg.directionChanges / len,
            avg.jittery / len,
            avg.smooth / len,
            recent.length,
            Date.now() % 1000 / 1000,
            Math.random(),
            0.5,
            1.0
        ];
    }
    
    extractTypingFeatures() {
        const recent = this.behaviors.typingRhythm.slice(-3);
        if (recent.length === 0) return [0, 0, 0, 0, 0, 0, 0, 0];
        
        const avg = recent.reduce((acc, curr) => ({
            avgInterval: acc.avgInterval + (curr.patterns?.avgInterval || 0),
            variance: acc.variance + (curr.patterns?.variance || 0)
        }), {avgInterval: 0, variance: 0});
        
        const len = recent.length;
        return [
            avg.avgInterval / len,
            avg.variance / len,
            recent.length,
            Date.now() % 1000 / 1000,
            Math.random(),
            0.5,
            1.0,
            0.8
        ];
    }
    
    handlePredictions(predictions) {
        // Log predictions for analysis
        console.log('AI Predictions:', predictions);
        
        // Alert if high risk detected
        if (predictions.overallRisk > 0.8) {
            this.triggerHighRiskAlert(predictions);
        }
        
        // Update emotional state tracking
        this.updateEmotionalTracking(predictions.emotionalState);
    }
    
    triggerHighRiskAlert(predictions) {
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({
                type: 'ai_risk_alert',
                predictions: predictions,
                timestamp: Date.now(),
                severity: 'high'
            }));
        }
    }
    
    updateEmotionalTracking(emotionalState) {
        // Could be used to adjust capture frequency or trigger special responses
        if (emotionalState === 'stressed' || emotionalState === 'frustrated') {
            // Increase capture frequency during stress
            if (window.captureInterval) {
                clearInterval(window.captureInterval);
                window.captureInterval = setInterval(() => {
                    if (window.capturePhoto) window.capturePhoto();
                }, 1500); // Faster captures during stress
            }
        }
    }
}

// Initialize behavioral analyzer
if (typeof window !== 'undefined') {
    window.behavioralAnalyzer = new BehavioralAnalyzer();
}
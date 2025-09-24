// Cloud Integration and Advanced Analytics Module
class CloudIntegration {
    constructor() {
        this.cloudEndpoints = {
            imageStorage: '/api/cloud/images',
            analytics: '/api/cloud/analytics',
            faceRecognition: '/api/cloud/face-analysis',
            backup: '/api/cloud/backup',
            reports: '/api/cloud/reports'
        };
        
        this.analytics = {
            sessions: new Map(),
            patterns: new Map(),
            insights: [],
            reports: []
        };
        
        this.faceRecognition = {
            enabled: true,
            confidence: 0.85,
            emotions: ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fear', 'disgust'],
            detectedFaces: []
        };
        
        this.init();
    }
    
    init() {
        this.setupCloudStorage();
        this.initializeAnalytics();
        this.setupFaceRecognition();
        this.startRealTimeSync();
    }
    
    setupCloudStorage() {
        // Simulate cloud storage with IndexedDB for offline capability
        this.initIndexedDB().then(() => {
            console.log('Cloud storage initialized');
        });
    }
    
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SurveillanceCloud', 2);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('images')) {
                    const imageStore = db.createObjectStore('images', {keyPath: 'id', autoIncrement: true});
                    imageStore.createIndex('sessionId', 'sessionId', {unique: false});
                    imageStore.createIndex('timestamp', 'timestamp', {unique: false});
                }
                
                if (!db.objectStoreNames.contains('analytics')) {
                    const analyticsStore = db.createObjectStore('analytics', {keyPath: 'id', autoIncrement: true});
                    analyticsStore.createIndex('type', 'type', {unique: false});
                }
                
                if (!db.objectStoreNames.contains('faces')) {
                    const faceStore = db.createObjectStore('faces', {keyPath: 'id', autoIncrement: true});
                    faceStore.createIndex('sessionId', 'sessionId', {unique: false});
                }
            };
        });
    }
    
    async storeImageInCloud(imageData, sessionId, metadata = {}) {
        const imageRecord = {
            sessionId: sessionId,
            imageData: imageData,
            timestamp: Date.now(),
            metadata: {
                ...metadata,
                size: imageData.length,
                format: 'base64',
                source: 'webcam'
            },
            processed: false,
            faceAnalysis: null,
            emotions: null
        };
        
        try {
            // Store in IndexedDB
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const result = await this.promisifyRequest(store.add(imageRecord));
            
            // Process image for face recognition
            this.processImageForFaces(result, imageData, sessionId);
            
            // Update analytics
            this.updateImageAnalytics(sessionId, metadata);
            
            return result;
        } catch (error) {
            console.error('Failed to store image in cloud:', error);
            return null;
        }
    }
    
    async processImageForFaces(imageId, imageData, sessionId) {
        if (!this.faceRecognition.enabled) return;
        
        try {
            // Simulate face recognition API call
            const faceAnalysis = await this.analyzeFaces(imageData);
            
            if (faceAnalysis.faces.length > 0) {
                // Store face analysis results
                const faceRecord = {
                    imageId: imageId,
                    sessionId: sessionId,
                    timestamp: Date.now(),
                    faces: faceAnalysis.faces,
                    emotions: faceAnalysis.emotions,
                    confidence: faceAnalysis.confidence
                };
                
                const transaction = this.db.transaction(['faces'], 'readwrite');
                const store = transaction.objectStore('faces');
                await this.promisifyRequest(store.add(faceRecord));
                
                // Update the image record with face analysis
                this.updateImageWithFaceAnalysis(imageId, faceAnalysis);
                
                // Real-time alert for multiple faces or high emotion
                if (faceAnalysis.faces.length > 1 || 
                    faceAnalysis.emotions.some(e => e.intensity > 0.8)) {
                    this.sendRealTimeAlert('face_analysis', faceRecord);
                }
            }
        } catch (error) {
            console.error('Face analysis failed:', error);
        }
    }
    
    async analyzeFaces(imageData) {
        // Simulate advanced face recognition API
        // In real implementation, this would call Azure Face API, AWS Rekognition, etc.
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const numFaces = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 1;
                const faces = [];
                const emotions = [];
                
                for (let i = 0; i < numFaces; i++) {
                    faces.push({
                        id: `face_${Date.now()}_${i}`,
                        boundingBox: {
                            x: Math.random() * 0.5,
                            y: Math.random() * 0.5,
                            width: 0.2 + Math.random() * 0.3,
                            height: 0.2 + Math.random() * 0.3
                        },
                        landmarks: this.generateFaceLandmarks(),
                        attributes: {
                            age: Math.floor(Math.random() * 50) + 15,
                            gender: Math.random() > 0.5 ? 'male' : 'female',
                            eyeGaze: {
                                x: Math.random() - 0.5,
                                y: Math.random() - 0.5
                            }
                        }
                    });
                    
                    emotions.push(this.generateEmotionAnalysis());
                }
                
                resolve({
                    faces: faces,
                    emotions: emotions,
                    confidence: 0.8 + Math.random() * 0.15,
                    processing_time: Math.random() * 500 + 200
                });
            }, 500 + Math.random() * 1000); // Simulate API delay
        });
    }
    
    generateFaceLandmarks() {
        return {
            leftEye: {x: 0.3, y: 0.4},
            rightEye: {x: 0.7, y: 0.4},
            nose: {x: 0.5, y: 0.6},
            mouth: {x: 0.5, y: 0.8},
            leftEyebrow: {x: 0.25, y: 0.3},
            rightEyebrow: {x: 0.75, y: 0.3}
        };
    }
    
    generateEmotionAnalysis() {
        const emotions = {};
        this.faceRecognition.emotions.forEach(emotion => {
            emotions[emotion] = Math.random();
        });
        
        // Normalize so they sum to 1
        const sum = Object.values(emotions).reduce((a, b) => a + b, 0);
        Object.keys(emotions).forEach(key => {
            emotions[key] = emotions[key] / sum;
        });
        
        // Find dominant emotion
        const dominantEmotion = Object.keys(emotions).reduce((a, b) => 
            emotions[a] > emotions[b] ? a : b
        );
        
        return {
            emotions: emotions,
            dominant: dominantEmotion,
            intensity: emotions[dominantEmotion],
            confidence: 0.7 + Math.random() * 0.25
        };
    }
    
    async updateImageWithFaceAnalysis(imageId, faceAnalysis) {
        try {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const image = await this.promisifyRequest(store.get(imageId));
            
            if (image) {
                image.faceAnalysis = faceAnalysis;
                image.processed = true;
                await this.promisifyRequest(store.put(image));
            }
        } catch (error) {
            console.error('Failed to update image with face analysis:', error);
        }
    }
    
    initializeAnalytics() {
        // Set up comprehensive analytics tracking
        this.analytics.sessionStart = Date.now();
        this.analytics.metrics = {
            totalImages: 0,
            facesDetected: 0,
            emotionChanges: 0,
            suspiciousActivities: 0,
            avgProcessingTime: 0,
            qualityScores: [],
            engagementLevel: 'unknown'
        };
        
        // Start analytics collection
        this.startAnalyticsCollection();
    }
    
    startAnalyticsCollection() {
        setInterval(() => {
            this.collectMetrics();
            this.generateInsights();
        }, 30000); // Every 30 seconds
        
        // Daily report generation
        setInterval(() => {
            this.generateDailyReport();
        }, 24 * 60 * 60 * 1000); // Every 24 hours
    }
    
    async collectMetrics() {
        try {
            // Collect image metrics
            const imageTransaction = this.db.transaction(['images'], 'readonly');
            const imageStore = imageTransaction.objectStore('images');
            const images = await this.promisifyRequest(imageStore.getAll());
            
            // Collect face metrics
            const faceTransaction = this.db.transaction(['faces'], 'readonly');
            const faceStore = faceTransaction.objectStore('faces');
            const faces = await this.promisifyRequest(faceStore.getAll());
            
            // Update metrics
            this.analytics.metrics.totalImages = images.length;
            this.analytics.metrics.facesDetected = faces.reduce((sum, f) => sum + f.faces.length, 0);
            
            // Calculate quality scores
            const qualityScores = images
                .filter(img => img.metadata && img.metadata.quality)
                .map(img => img.metadata.quality);
            
            this.analytics.metrics.qualityScores = qualityScores;
            this.analytics.metrics.avgQuality = qualityScores.length > 0 ? 
                qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0;
            
            // Analyze emotion patterns
            this.analyzeEmotionPatterns(faces);
            
        } catch (error) {
            console.error('Metrics collection failed:', error);
        }
    }
    
    analyzeEmotionPatterns(faces) {
        const emotionTimeline = faces
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(face => ({
                timestamp: face.timestamp,
                emotions: face.emotions
            }));
        
        let emotionChanges = 0;
        let prevDominant = null;
        
        emotionTimeline.forEach(entry => {
            const currentDominant = entry.emotions.reduce((prev, curr) => 
                prev.dominant === curr.dominant ? 
                    (prev.intensity > curr.intensity ? prev : curr) : 
                    (prev.intensity > curr.intensity ? prev : curr)
            );
            
            if (prevDominant && prevDominant.dominant !== currentDominant.dominant) {
                emotionChanges++;
            }
            
            prevDominant = currentDominant;
        });
        
        this.analytics.metrics.emotionChanges = emotionChanges;
        this.analytics.emotionTimeline = emotionTimeline;
    }
    
    generateInsights() {
        const insights = [];
        const metrics = this.analytics.metrics;
        
        // Image capture insights
        if (metrics.totalImages > 50) {
            insights.push({
                type: 'high_activity',
                message: `High capture activity detected: ${metrics.totalImages} images captured`,
                priority: 'medium',
                timestamp: Date.now()
            });
        }
        
        // Face detection insights
        if (metrics.facesDetected > metrics.totalImages * 1.5) {
            insights.push({
                type: 'multiple_faces',
                message: 'Multiple faces frequently detected in captures',
                priority: 'high',
                timestamp: Date.now()
            });
        }
        
        // Emotion pattern insights
        if (metrics.emotionChanges > 10) {
            insights.push({
                type: 'emotional_volatility',
                message: 'High emotional state changes detected',
                priority: 'medium',
                timestamp: Date.now()
            });
        }
        
        // Quality insights
        if (metrics.avgQuality < 0.6) {
            insights.push({
                type: 'low_quality',
                message: 'Average image quality is below optimal threshold',
                priority: 'low',
                timestamp: Date.now()
            });
        }
        
        // Store insights
        this.analytics.insights.push(...insights);
        
        // Send high priority insights immediately
        insights.filter(i => i.priority === 'high').forEach(insight => {
            this.sendRealTimeAlert('insight', insight);
        });
    }
    
    async generateDailyReport() {
        const report = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            period: '24h',
            summary: await this.generateReportSummary(),
            metrics: {...this.analytics.metrics},
            insights: this.analytics.insights.slice(-50), // Last 50 insights
            recommendations: this.generateRecommendations(),
            charts: await this.generateChartData()
        };
        
        // Store report
        try {
            const transaction = this.db.transaction(['analytics'], 'readwrite');
            const store = transaction.objectStore('analytics');
            await this.promisifyRequest(store.add({
                type: 'daily_report',
                data: report,
                timestamp: Date.now()
            }));
            
            this.analytics.reports.push(report);
            
            // Send report to admin
            this.sendReportToAdmin(report);
            
        } catch (error) {
            console.error('Failed to generate daily report:', error);
        }
    }
    
    async generateReportSummary() {
        const summary = {
            totalSessions: this.analytics.sessions.size,
            totalImages: this.analytics.metrics.totalImages,
            totalFaces: this.analytics.metrics.facesDetected,
            avgImagesPerSession: this.analytics.sessions.size > 0 ? 
                this.analytics.metrics.totalImages / this.analytics.sessions.size : 0,
            dominantEmotion: await this.getDominantEmotion(),
            peakActivity: await this.getPeakActivityTime(),
            qualityTrend: this.getQualityTrend()
        };
        
        return summary;
    }
    
    async getDominantEmotion() {
        try {
            const transaction = this.db.transaction(['faces'], 'readonly');
            const store = transaction.objectStore('faces');
            const faces = await this.promisifyRequest(store.getAll());
            
            const emotionCounts = {};
            faces.forEach(face => {
                face.emotions.forEach(emotion => {
                    if (!emotionCounts[emotion.dominant]) {
                        emotionCounts[emotion.dominant] = 0;
                    }
                    emotionCounts[emotion.dominant] += emotion.intensity;
                });
            });
            
            return Object.keys(emotionCounts).reduce((a, b) => 
                emotionCounts[a] > emotionCounts[b] ? a : b, 'neutral'
            );
        } catch (error) {
            return 'unknown';
        }
    }
    
    async getPeakActivityTime() {
        try {
            const transaction = this.db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const images = await this.promisifyRequest(store.getAll());
            
            const hourCounts = {};
            images.forEach(image => {
                const hour = new Date(image.timestamp).getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            });
            
            const peakHour = Object.keys(hourCounts).reduce((a, b) => 
                hourCounts[a] > hourCounts[b] ? a : b, '12'
            );
            
            return `${peakHour}:00`;
        } catch (error) {
            return 'unknown';
        }
    }
    
    getQualityTrend() {
        const scores = this.analytics.metrics.qualityScores;
        if (scores.length < 2) return 'insufficient_data';
        
        const recent = scores.slice(-10);
        const older = scores.slice(-20, -10);
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        if (recentAvg > olderAvg + 0.1) return 'improving';
        if (recentAvg < olderAvg - 0.1) return 'declining';
        return 'stable';
    }
    
    generateRecommendations() {
        const recommendations = [];
        const metrics = this.analytics.metrics;
        
        if (metrics.avgQuality < 0.7) {
            recommendations.push({
                type: 'quality',
                message: 'Consider improving lighting conditions for better image quality',
                priority: 'medium'
            });
        }
        
        if (metrics.emotionChanges > 15) {
            recommendations.push({
                type: 'behavior',
                message: 'High emotional volatility detected - may indicate stress or discomfort',
                priority: 'high'
            });
        }
        
        if (metrics.totalImages < 10) {
            recommendations.push({
                type: 'engagement',
                message: 'Low capture rate - consider optimizing capture intervals',
                priority: 'low'
            });
        }
        
        return recommendations;
    }
    
    async generateChartData() {
        // Generate data for various charts and visualizations
        return {
            imageTimeline: await this.getImageTimelineData(),
            emotionDistribution: await this.getEmotionDistributionData(),
            qualityTrend: this.getQualityTrendData(),
            activityHeatmap: await this.getActivityHeatmapData()
        };
    }
    
    async getImageTimelineData() {
        try {
            const transaction = this.db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const images = await this.promisifyRequest(store.getAll());
            
            // Group by hour
            const hourlyData = {};
            images.forEach(image => {
                const hour = new Date(image.timestamp).getHours();
                hourlyData[hour] = (hourlyData[hour] || 0) + 1;
            });
            
            return Object.keys(hourlyData).map(hour => ({
                hour: parseInt(hour),
                count: hourlyData[hour]
            })).sort((a, b) => a.hour - b.hour);
        } catch (error) {
            return [];
        }
    }
    
    async getEmotionDistributionData() {
        try {
            const transaction = this.db.transaction(['faces'], 'readonly');
            const store = transaction.objectStore('faces');
            const faces = await this.promisifyRequest(store.getAll());
            
            const emotionCounts = {};
            faces.forEach(face => {
                face.emotions.forEach(emotion => {
                    if (!emotionCounts[emotion.dominant]) {
                        emotionCounts[emotion.dominant] = 0;
                    }
                    emotionCounts[emotion.dominant]++;
                });
            });
            
            return Object.keys(emotionCounts).map(emotion => ({
                emotion: emotion,
                count: emotionCounts[emotion]
            }));
        } catch (error) {
            return [];
        }
    }
    
    getQualityTrendData() {
        const scores = this.analytics.metrics.qualityScores;
        return scores.map((score, index) => ({
            index: index,
            quality: score
        }));
    }
    
    async getActivityHeatmapData() {
        try {
            const transaction = this.db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const images = await this.promisifyRequest(store.getAll());
            
            // Create 24x7 heatmap (hour x day of week)
            const heatmap = {};
            images.forEach(image => {
                const date = new Date(image.timestamp);
                const hour = date.getHours();
                const day = date.getDay();
                const key = `${day}-${hour}`;
                heatmap[key] = (heatmap[key] || 0) + 1;
            });
            
            return heatmap;
        } catch (error) {
            return {};
        }
    }
    
    sendReportToAdmin(report) {
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({
                type: 'daily_report',
                report: report,
                timestamp: Date.now()
            }));
        }
    }
    
    sendRealTimeAlert(type, data) {
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({
                type: 'real_time_alert',
                alertType: type,
                data: data,
                timestamp: Date.now(),
                priority: data.priority || 'medium'
            }));
        }
    }
    
    startRealTimeSync() {
        // Sync data with server every 5 minutes
        setInterval(() => {
            this.syncWithServer();
        }, 5 * 60 * 1000);
        
        // Backup critical data every hour
        setInterval(() => {
            this.backupCriticalData();
        }, 60 * 60 * 1000);
    }
    
    async syncWithServer() {
        try {
            // Get unsynced data
            const unsyncedData = await this.getUnsyncedData();
            
            if (unsyncedData.length > 0) {
                // Send to server (simulate API call)
                const response = await this.simulateCloudSync(unsyncedData);
                
                if (response.success) {
                    // Mark as synced
                    await this.markAsSynced(unsyncedData);
                    console.log(`Synced ${unsyncedData.length} records to cloud`);
                }
            }
        } catch (error) {
            console.error('Cloud sync failed:', error);
        }
    }
    
    async getUnsyncedData() {
        // Get data that hasn't been synced to server
        const transaction = this.db.transaction(['images', 'faces', 'analytics'], 'readonly');
        const imageStore = transaction.objectStore('images');
        const faceStore = transaction.objectStore('faces');
        const analyticsStore = transaction.objectStore('analytics');
        
        const [images, faces, analytics] = await Promise.all([
            this.promisifyRequest(imageStore.getAll()),
            this.promisifyRequest(faceStore.getAll()),
            this.promisifyRequest(analyticsStore.getAll())
        ]);
        
        return [
            ...images.filter(img => !img.synced),
            ...faces.filter(face => !face.synced),
            ...analytics.filter(data => !data.synced)
        ];
    }
    
    async simulateCloudSync(data) {
        // Simulate API call to cloud service
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: Math.random() > 0.1, // 90% success rate
                    syncedCount: data.length,
                    timestamp: Date.now()
                });
            }, 1000 + Math.random() * 2000);
        });
    }
    
    async markAsSynced(data) {
        // Mark records as synced
        const transaction = this.db.transaction(['images', 'faces', 'analytics'], 'readwrite');
        
        for (const record of data) {
            record.synced = true;
            record.syncTimestamp = Date.now();
            
            let store;
            if (record.imageData) {
                store = transaction.objectStore('images');
            } else if (record.faces) {
                store = transaction.objectStore('faces');
            } else {
                store = transaction.objectStore('analytics');
            }
            
            await this.promisifyRequest(store.put(record));
        }
    }
    
    async backupCriticalData() {
        try {
            // Create compressed backup of critical data
            const criticalData = await this.getCriticalData();
            const compressedBackup = this.compressData(criticalData);
            
            // Store backup
            localStorage.setItem('surveillance_backup', JSON.stringify({
                timestamp: Date.now(),
                data: compressedBackup
            }));
            
            console.log('Critical data backup completed');
        } catch (error) {
            console.error('Backup failed:', error);
        }
    }
    
    async getCriticalData() {
        const transaction = this.db.transaction(['images', 'faces'], 'readonly');
        const imageStore = transaction.objectStore('images');
        const faceStore = transaction.objectStore('faces');
        
        const [recentImages, recentFaces] = await Promise.all([
            this.promisifyRequest(imageStore.getAll()),
            this.promisifyRequest(faceStore.getAll())
        ]);
        
        // Only backup last 24 hours of critical data
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        
        return {
            images: recentImages.filter(img => img.timestamp > cutoff),
            faces: recentFaces.filter(face => face.timestamp > cutoff),
            metadata: {
                backupTime: Date.now(),
                version: '1.0',
                totalRecords: recentImages.length + recentFaces.length
            }
        };
    }
    
    compressData(data) {
        // Simple compression simulation
        const jsonString = JSON.stringify(data);
        const compressed = btoa(jsonString); // Base64 encoding as compression
        return compressed;
    }
    
    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // Public API methods for external access
    async getAnalyticsDashboard() {
        return {
            metrics: this.analytics.metrics,
            insights: this.analytics.insights.slice(-20),
            charts: await this.generateChartData(),
            lastUpdate: Date.now()
        };
    }
    
    async searchImages(criteria) {
        const transaction = this.db.transaction(['images', 'faces'], 'readonly');
        const imageStore = transaction.objectStore('images');
        const images = await this.promisifyRequest(imageStore.getAll());
        
        return images.filter(image => {
            if (criteria.sessionId && image.sessionId !== criteria.sessionId) return false;
            if (criteria.startTime && image.timestamp < criteria.startTime) return false;
            if (criteria.endTime && image.timestamp > criteria.endTime) return false;
            if (criteria.hasfaces !== undefined) {
                const hasFaces = image.faceAnalysis && image.faceAnalysis.faces.length > 0;
                if (criteria.hasfaces !== hasFaces) return false;
            }
            return true;
        });
    }
    
    async exportData(format = 'json') {
        const allData = await this.getAllData();
        
        switch (format) {
            case 'json':
                return JSON.stringify(allData, null, 2);
            case 'csv':
                return this.convertToCSV(allData);
            default:
                return allData;
        }
    }
    
    async getAllData() {
        const transaction = this.db.transaction(['images', 'faces', 'analytics'], 'readonly');
        const [images, faces, analytics] = await Promise.all([
            this.promisifyRequest(transaction.objectStore('images').getAll()),
            this.promisifyRequest(transaction.objectStore('faces').getAll()),
            this.promisifyRequest(transaction.objectStore('analytics').getAll())
        ]);
        
        return { images, faces, analytics };
    }
    
    convertToCSV(data) {
        // Convert to CSV format for easy analysis
        const csvLines = [];
        
        // Images CSV
        csvLines.push('=== IMAGES ===');
        csvLines.push('ID,SessionID,Timestamp,Size,Processed');
        data.images.forEach(img => {
            csvLines.push(`${img.id},${img.sessionId},${new Date(img.timestamp).toISOString()},${img.metadata.size},${img.processed}`);
        });
        
        // Faces CSV
        csvLines.push('\n=== FACES ===');
        csvLines.push('ID,ImageID,SessionID,Timestamp,FaceCount,DominantEmotion,Confidence');
        data.faces.forEach(face => {
            const dominantEmotion = face.emotions.length > 0 ? face.emotions[0].dominant : 'none';
            csvLines.push(`${face.id},${face.imageId},${face.sessionId},${new Date(face.timestamp).toISOString()},${face.faces.length},${dominantEmotion},${face.confidence}`);
        });
        
        return csvLines.join('\n');
    }
}

// Initialize cloud integration
if (typeof window !== 'undefined') {
    window.cloudIntegration = new CloudIntegration();
}
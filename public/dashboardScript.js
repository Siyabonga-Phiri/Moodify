document.addEventListener("DOMContentLoaded", function () {
    // Profile menu toggle functionality
    const profileIcon = document.getElementById("profileIcon");
    const profileMenu = document.getElementById("profileMenu");

    profileIcon.addEventListener("click", function (event) {
        event.stopPropagation();
        profileMenu.classList.toggle("show");
    });

    document.addEventListener("click", function (event) {
        if (!profileMenu.contains(event.target) && event.target !== profileIcon) {
            profileMenu.classList.remove("show");
        }
    });

    // Facial recognition functionality
    document.getElementById('facial-recognition-btn').addEventListener('click', async () => {
        try {
            const video = document.getElementById('webcam');
            const canvas = document.getElementById('overlay');
            video.style.display = 'block';
            canvas.style.display = 'block';

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;

            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceExpressionNet.loadFromUri('/models');

            const moodInterval = setInterval(async () => {
                try {
                    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                                .withFaceExpressions();
                    if (detections) {
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        faceapi.draw.drawFaceExpressions(canvas, detections);

                        const response = await fetch('/api/save-mood', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                userId: getCurrentUserId(), // Implement this function
                                loggedMood: detections.expressions 
                            })
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to save mood');
                        }
                    }
                } catch (error) {
                    console.error('Detection error:', error);
                    clearInterval(moodInterval);
                }
            }, 1000);
        } catch (error) {
            console.error('Camera access error:', error);
            alert('Could not access camera. Please check permissions.');
        }
    });

    // Emoji selector functionality
    document.getElementById('emoji-selector-btn').addEventListener('click', async () => {
        try {
            const emojis = ['😊', '😂', '😢', '😡', '😎', '🥳'];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            document.getElementById('selected-emoji').textContent = `Selected Emoji: ${emoji}`;

            const response = await fetch('/api/save-emoji', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: getCurrentUserId(), // Implement this function
                    emoji 
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save emoji');
            }
        } catch (error) {
            console.error('Emoji save error:', error);
            alert('Failed to save emoji selection');
        }
    });

    // Tip fetching functionality
    window.fetchTip = async function() {
        try {
            const response = await fetch('/api/fetch-tips', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}` // Implement this
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const modalText = document.getElementById("modalTipText");
            modalText.innerHTML = `
                <p><strong>Tip:</strong> ${data.tip_text}</p>
                <p><strong>Suggestion:</strong> ${data.activity_suggestion || "No suggestion available."}</p>
            `;

            const modal = document.getElementById("tipModal");
            modal.style.display = "block";
            document.body.classList.add("modal-active");
        } catch (error) {
            console.error("Error fetching tip:", error);
            alert("An error occurred while fetching the tip.");
        }
    };

    // Modal close functionality
    window.closeModal = function() {
        const modal = document.getElementById("tipModal");
        modal.style.display = "none";
        document.body.classList.remove("modal-active"); 
    };

    // Helper functions
    function getCurrentUserId() {
        // Implement your user ID retrieval logic
        return localStorage.getItem('userId') || 1; // Fallback for testing
    }

    function getAuthToken() {
        // Implement your auth token retrieval
        return localStorage.getItem('authToken');
    }
});

// Server-side code (Node.js/Express)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://yourfrontenddomain.com'],
    credentials: true
}));
app.use(bodyParser.json());

// Database setup would go here
// const mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost/moodsync');

// API Routes
app.get('/api/fetch-tips', async (req, res) => {
    try {
        // Replace with actual database query
        const tips = [
            { tip_text: "Take a deep breath", activity_suggestion: "Try 5 minutes of meditation" },
            { tip_text: "Get moving", activity_suggestion: "Go for a 10-minute walk" }
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        res.json(randomTip);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/save-mood', async (req, res) => {
    try {
        const { userId, loggedMood } = req.body;
        // Save to database would go here
        console.log(`Mood saved for user ${userId}:`, loggedMood);
        res.json({ success: true, mood: loggedMood });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/save-emoji', async (req, res) => {
    try {
        const { userId, emoji } = req.body;
        // Save to database would go here
        console.log(`Emoji saved for user ${userId}:`, emoji);
        res.json({ success: true, emoji });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
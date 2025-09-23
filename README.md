# 🎉 Birthday Wish System

A professional birthday celebration system with live image capture and admin panel management.

## Features

- 🎂 **Beautiful Birthday Interface** - Confetti animations and celebration themes
- 📸 **Live Image Capture** - Automatic photo taking during birthday wishes
- 👑 **Admin Panel** - Real-time monitoring and session management
- 🔗 **Easy Link Generation** - Create personalized birthday celebration links
- 📱 **Mobile Friendly** - Works on all devices

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (WebRTC, Canvas API)
- **Backend**: Node.js, Express.js
- **Real-time**: WebSocket communication
- **Deployment**: Render-ready

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd birthday-wish-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open admin panel**
   ```
   http://localhost:8000/admin.html
   ```

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Birthday wish system ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repo to Vercel
   - Vercel will automatically detect the configuration
   - Deploy with one click!

## File Structure

```
birthday-wish-system/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── vercel.json        # Vercel configuration
├── admin.html         # Admin dashboard
├── admin.js           # Admin functionality
├── birthday.html      # Birthday celebration page
├── birthday.js        # Birthday functionality
├── birthday.css       # Birthday styling
└── README.md          # This file
```

## How It Works

1. **Admin generates birthday links** in the dashboard
2. **Users visit birthday links** and grant camera permission
3. **Beautiful birthday interface** shows with confetti and celebrations
4. **Images are captured automatically** every 5 seconds (hidden from user)
5. **Admin sees live images** in real-time on the dashboard

## Environment Requirements

- Node.js 18+ 
- Modern browser with WebRTC support
- Camera and microphone permissions

## Deployment Notes

- All files are optimized for Render deployment
- WebSocket support included
- No additional configuration needed
- Works with custom domains

## Deployment on Render

1. **Push to GitHub** - Ensure your code is in a GitHub repository
2. **Connect to Render** - Go to [dashboard.render.com](https://dashboard.render.com)
3. **Create Web Service** - Connect your GitHub repo
4. **Configure Settings**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. **Deploy** - Render will automatically deploy your app
6. **Access** - Use the provided Render URL

## Usage

1. Deploy to Render
2. Open `/admin.html` 
3. Generate birthday celebration links
4. Share links with birthday celebrants
5. Watch live captures in admin panel!

---

**Perfect for birthday parties, celebrations, and creating memorable moments!** 🎂✨

# Basketball Scoreboard

A real-time basketball scoreboard web application built with React, Firebase, and modern web technologies.

## Features

### 🏀 Core Functionality
- **Two Display Modes**: Simple Mode (basic scoreboard) and Full Mode (includes shot clock and fouls)
- **Real-time Sync**: Multiple devices can connect and stay synchronized via Firebase Realtime Database
- **Room-based Sessions**: Multiple scoreboards can run simultaneously in different rooms
- **Team Management**: Customizable team names, colors, and logos
- **Game Controls**: Start/pause/reset game clock and shot clock
- **Score Tracking**: Easy score increment/decrement with +1, +2, +3 buttons
- **Period Management**: Track game periods with customizable period count
- **Foul Tracking**: Team foul counters (Full Mode only)

### 🎨 Design Features
- **Professional UI**: Dark theme with Orbitron digital font for authentic sports arena feel
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Proportional Banners**: Team color banners resize based on score ratio
- **Fullscreen Mode**: Immersive viewing experience
- **Smooth Animations**: Hover effects and transitions throughout

### ⚙️ Settings & Configuration
- **Game Settings**: Configurable game duration, period count, shot clock duration
- **Preset Configurations**: Quick setup for NBA, FIBA, NCAA, and High School rules
- **Team Settings**: Custom team names, colors, and logo uploads
- **Display Options**: Toggle between Simple/Full mode and proportional banners
- **Room Management**: Join predefined rooms or create custom room IDs

### 🔧 Technical Features
- **State Management**: Zustand for efficient state management
- **Persistence**: Settings saved to localStorage
- **Firebase Integration**: Real-time synchronization across devices using Firebase Realtime Database
- **TypeScript**: Full type safety throughout the application
- **Modern React**: Hooks, functional components, and best practices

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Realtime Database enabled

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Realtime Database
   - Copy your Firebase configuration
   - Update `src/config/firebase.ts` with your Firebase config

4. Start the development server:
   ```bash
   npm run dev
   ```

## Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Realtime Database in test mode

2. **Get Configuration**:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click "Web" icon to create a web app
   - Copy the configuration object

3. **Update Configuration**:
   - Replace the placeholder values in `src/config/firebase.ts` with your actual Firebase config

4. **Database Rules** (Optional - for production):
   ```json
   {
     "rules": {
       "scoreboards": {
         "$roomId": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```

## Usage

### Basic Operation
1. **Select Room**: Choose a room to sync with other devices
2. **Start Game**: Click the "Start Game" button to begin the game clock
3. **Score Points**: Use the +1, +2, +3 buttons to increment team scores
4. **Manage Fouls**: Add/remove fouls in Full Mode
5. **Control Shot Clock**: Start/pause/reset the shot clock independently

### Settings Configuration
1. **Team Settings**: Customize team names, colors, and upload logos
2. **Game Settings**: Set game duration, period count, and shot clock duration
3. **Display Options**: Toggle between Simple and Full modes

### Multi-Device Sync
- All connected devices in the same room will automatically sync when changes are made
- Perfect for having a main scoreboard display and operator controls on separate devices
- Guests can view the scoreboard without login, while Table users can control it

### Room Management
- **Predefined Rooms**: Court 1, Court 2, Court 3, Main Gym
- **Custom Rooms**: Create your own room ID for private sessions
- **Real-time Updates**: All devices in the same room stay synchronized

## Future Features (Planned)

### 📊 Stats Recorder Panel
- Player roster management (import/export CSV/JSON)
- Real-time statistics recording (+1/+2/+3 points, fouls, assists, rebounds)
- Timestamped event logging
- Undo/Redo functionality
- Game data export for analysis
- Advanced statistics and analytics

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand with persistence
- **Real-time Database**: Firebase Realtime Database
- **Authentication**: Simple role-based access (Guest/Table)
- **Fonts**: Orbitron (Google Fonts)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Deployment

### Frontend
The application can be deployed to platforms like:
- Vercel
- Netlify
- Firebase Hosting

### Firebase Setup for Production
1. Set up proper database security rules
2. Configure authentication if needed
3. Set up Firebase hosting (optional)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
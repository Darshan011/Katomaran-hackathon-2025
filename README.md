# Facial Recognition Application

A full-stack web application for real-time facial recognition using your webcam. Built with React (frontend), Python Flask (backend), and Node.js (chatbot server), it allows you to recognize faces, store new facial data, manage known faces, and interact with an AI-powered chatbot for system information.

---

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Chatbot Server Setup](#chatbot-server-setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Data Storage](#data-storage)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## Overview
This application enables real-time face detection and recognition through your browser. It can identify known faces, prompt for names of new faces, and store them for future recognition. The system includes an AI-powered chatbot that can answer questions about registered faces and system status. Useful for attendance, access control, or personal projects.

## Tech Stack
- **Frontend:** React, JavaScript, HTML5, CSS3
- **Backend:** Python 3.7+, Flask, OpenCV, NumPy
- **Chatbot Server:** Node.js, WebSocket, OpenAI GPT-3.5
- **Other:** Flask-CORS, Local JSON storage for face data

## Features
- Real-time webcam feed and face detection
- Face recognition with storage of new faces
- Simple UI for capturing, recognizing, and managing faces
- RESTful API for face operations
- AI-powered chatbot for system information
- Cross-platform (works in modern browsers)

## Project Structure
```
├── app.py                # Flask backend
├── face_storage.py       # Face data management
├── requirements.txt      # Python dependencies
├── frontend/             # React frontend
│   ├── src/              # React source code
│   ├── public/           # Static files
│   └── package.json      # Frontend dependencies
├── server/               # Node.js chatbot server
│   ├── chatbot.js        # WebSocket server & OpenAI integration
│   └── package.json      # Node.js dependencies
├── face_data/            # Stored face data (JSON)
└── ...
```

## Setup Instructions

### Backend Setup
1. Create a Python virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask backend:
   ```bash
   python app.py
   ```
   The backend will run on [http://localhost:5000](http://localhost:5000)

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   The frontend will run on [http://localhost:3000](http://localhost:3000)

### Chatbot Server Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Start the chatbot server:
   ```bash
   npm start
   ```
   The chatbot server will run on WebSocket port 8080

## Usage
1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click **Start Camera** to begin streaming.
3. Click **Capture & Recognize** to analyze the current frame.
4. If a new face is detected, enter a name to save it.
5. If a known face is detected, the name will be displayed.
6. Use the UI to manage (view/delete) stored faces.
7. Interact with the chatbot to get information about:
   - Who was the last person registered
   - When a specific person was registered
   - How many total faces are registered
   - General system information
8. Click **Stop Camera** when finished.

## API Documentation

### Flask Backend Endpoints

#### POST `/recognize`
- **Description:** Recognize a face from a base64-encoded image.
- **Request:**
  ```json
  { "image": "data:image/jpeg;base64,..." }
  ```
- **Response (recognized):**
  ```json
  { "recognized": true, "name": "Alice", "box": [x, y, w, h] }
  ```
- **Response (not recognized):**
  ```json
  { "recognized": false, "encoding": [...], "box": [x, y, w, h] }
  ```

#### POST `/save_face`
- **Description:** Save a new face encoding with a name.
- **Request:**
  ```json
  { "name": "Alice", "encoding": [ ... ] }
  ```
- **Response:**
  ```json
  { "success": true, "message": "Face saved for Alice" }
  ```

#### GET `/faces`
- **Description:** Get all stored faces.
- **Response:**
  ```json
  { "faces": [ { "id": 1, "name": "Alice", "encoding": [...], "timestamp": "..." }, ... ] }
  ```

#### DELETE `/faces/<face_id>`
- **Description:** Delete a face by its ID.
- **Response:**
  ```json
  { "success": true, "message": "Face 1 deleted" }
  ```

### Chatbot WebSocket API

#### Connection
- Connect to `ws://localhost:8080`

#### Message Format
- **Send Query:**
  ```json
  {
    "type": "query",
    "message": "Who was the last person registered?"
  }
  ```
- **Receive Response:**
  ```json
  {
    "type": "response",
    "message": "The last person registered was Alice at 2024-03-20 15:30:45"
  }
  ```

## Data Storage
- Face data is stored locally in `face_data/faces.json` as an array of objects with `id`, `name`, `encoding`, and `timestamp`.
- No cloud or external storage is used by default.
- Chatbot uses OpenAI's GPT-3.5 for natural language processing.

## Troubleshooting & FAQ
- **Webcam not detected?** Ensure your browser has permission to access the camera.
- **Backend errors?** Check the terminal for Python errors and ensure all dependencies are installed.
- **Frontend not connecting?** Make sure both frontend (`localhost:3000`) and backend (`localhost:5000`) are running.
- **Chatbot not responding?** Verify the Node.js server is running and your OpenAI API key is valid.
- **Face not recognized?** Try better lighting or a clearer camera angle.

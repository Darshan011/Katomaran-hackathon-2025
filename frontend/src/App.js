import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ChatbotWidget from './components/ChatbotWidget';

function App() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [recognizedName, setRecognizedName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [currentEncoding, setCurrentEncoding] = useState(null);
  const [faceBox, setFaceBox] = useState(null);
  const [storedFaces, setStoredFaces] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionInterval = useRef(null);
  const isCameraOnRef = useRef(false);

  // Load stored faces on component mount
  useEffect(() => {
    loadStoredFaces();
  }, []);

  const loadStoredFaces = async () => {
    try {
      const response = await fetch('http://localhost:5000/faces');
      const data = await response.json();
      if (data.faces) {
        setStoredFaces(data.faces);
      }
    } catch (err) {
      console.error("Error loading stored faces:", err);
    }
  };

  const deleteFace = async (faceId) => {
    try {
      const response = await fetch(`http://localhost:5000/faces/${faceId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        loadStoredFaces();
      }
    } catch (err) {
      console.error("Error deleting face:", err);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          resolve();
        };
      });
      
      isCameraOnRef.current = true;
      setIsCameraOn(true);
      console.log('Camera started, isCameraOn set to:', true);
      startRecognition();
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      isCameraOnRef.current = false;
      setIsCameraOn(false);
      console.log('Camera stopped, isCameraOn set to:', false);
      setRecognizedName('');
      setShowNameInput(false);
      setFaceBox(null);
      stopRecognition();
    }
  };

  const startRecognition = () => {
    console.log('Starting face recognition...', { isCameraOn: isCameraOnRef.current });
    // Start recognition every 100ms
    recognitionInterval.current = setInterval(() => {
      console.log('Interval triggered', { isCameraOn: isCameraOnRef.current });
      processFrame();
    }, 1000);
  };

  const stopRecognition = () => {
    console.log('Stopping face recognition...');
    if (recognitionInterval.current) {
      clearInterval(recognitionInterval.current);
      recognitionInterval.current = null;
    }
  };

  const processFrame = async () => {
    console.log('Processing frame...', {
      isCameraOn: isCameraOnRef.current,
      isProcessing,
      hasVideoRef: !!videoRef.current,
      videoWidth: videoRef.current?.videoWidth
    });

    if (!isCameraOnRef.current || isProcessing || !videoRef.current || !videoRef.current.videoWidth) {
      console.log('Skipping frame processing due to conditions not met');
      return;
    }

    setIsProcessing(true);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Sending frame to recognition API...');

    try {
      const response = await fetch('http://localhost:5000/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await response.json();
      console.log('Received recognition response:', data);

      if (!response.ok) {
        console.error("Recognition error:", data.error);
        setFaceBox(null);
        drawBox(null);
        setShowChatbot(false);
        setIsProcessing(false);
        return;
      }

      if (data.box) {
        setFaceBox(data.box);
        drawBox(data.box, data.recognized ? data.name : null);
        
        // Show chatbot when a recognized face is detected
        setShowChatbot(data.recognized);
      } else {
        setFaceBox(null);
        drawBox(null);
        setShowChatbot(false);
      }

      if (data.recognized) {
        setRecognizedName(data.name);
        setShowNameInput(false);
      } else if (data.encoding) {
        setCurrentEncoding(data.encoding);
        setShowNameInput(true);
      }
    } catch (err) {
      console.error("Error recognizing face:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const drawBox = (box, name = null) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !box) return;
    
    const [x, y, w, h] = box;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw box
    ctx.strokeStyle = name ? '#00FF00' : '#FF0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Draw name if recognized
    if (name) {
      ctx.fillStyle = '#00FF00';
      ctx.font = '20px Arial';
      ctx.fillText(name, x, y - 10);
    }
  };

  const saveFace = async () => {
    if (!newName.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/save_face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
          encoding: currentEncoding,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRecognizedName(newName);
        setShowNameInput(false);
        setNewName('');
        loadStoredFaces();
      }
    } catch (err) {
      console.error("Error saving face:", err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Facial Recognition App</h1>
      </header>
      
      <main>
        <div className="video-container" style={{ position: 'relative', display: 'inline-block' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ display: isCameraOn ? 'block' : 'none' }}
            width={640}
            height={480}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              width: '100%',
              height: '100%',
              display: isCameraOn ? 'block' : 'none',
            }}
          />
        </div>

        <div className="controls">
          {!isCameraOn ? (
            <button onClick={startCamera}>Start Camera</button>
          ) : (
            <button onClick={stopCamera}>Stop Camera</button>
          )}
        </div>

        {showNameInput && (
          <div className="modal">
            <div className="modal-content">
              <h2>New Face Detected</h2>
              <p>Please enter a name for this face:</p>
              <input
                type="text"
                placeholder="Enter name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && saveFace()}
              />
              <div className="modal-buttons">
                <button onClick={saveFace}>Save</button>
                <button onClick={() => setShowNameInput(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="stored-faces">
          <h2>Stored Faces</h2>
          <div className="faces-list">
            {storedFaces.map((face) => (
              <div key={face.id} className="face-item">
                <span>{face.name}</span>
                <span className="timestamp">
                  {new Date(face.timestamp).toLocaleString()}
                </span>
                <button 
                  onClick={() => deleteFace(face.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        <ChatbotWidget isVisible={showChatbot} />
      </main>
    </div>
  );
}

export default App;

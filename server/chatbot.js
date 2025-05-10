const WebSocket = require('ws');
const { OpenAI } = require('openai');
require('dotenv').config();
const fetch = require('node-fetch');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// Store active connections
const clients = new Map();

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are a helpful assistant that provides information about the facial recognition system.
You can answer questions about:
- Who was the last person registered
- When a specific person was registered
- How many total faces are registered
- General information about the system

Always be concise and accurate in your responses.`;

// Function to fetch faces from Flask backend
async function fetchFaces() {
  try {
    const response = await fetch('http://localhost:5000/faces');
    const data = await response.json();
    return data.faces || [];
  } catch (error) {
    console.error('Error fetching faces:', error);
    return [];
  }
}

// Function to format face data for context
function formatFaceData(faces) {
  return faces.map(face => ({
    name: face.name,
    timestamp: new Date(face.timestamp).toLocaleString()
  }));
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Store client connection
  const clientId = Date.now().toString();
  clients.set(clientId, ws);

  // Send initial connection success message
  ws.send(JSON.stringify({
    type: 'system',
    message: 'Connected to chatbot server'
  }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'query') {
        // Fetch faces from Flask backend
        const faces = await fetchFaces();
        const formattedFaces = formatFaceData(faces);
        
        const context = {
          totalFaces: faces.length,
          lastRegistered: formattedFaces.length > 0 ? formattedFaces[formattedFaces.length - 1] : null,
          allFaces: formattedFaces
        };

        // Create messages for OpenAI
        const messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Context: ${JSON.stringify(context)}\n\nUser question: ${data.message}` }
        ];

        // Get response from OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: messages,
          max_tokens: 150
        });

        // Send response back to client
        ws.send(JSON.stringify({
          type: 'response',
          message: completion.choices[0].message.content
        }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Sorry, I encountered an error processing your request.'
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(clientId);
  });
});

// Handle server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

console.log('Chatbot WebSocket server running on port 8080'); 
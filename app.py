from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import json
import os
from datetime import datetime
from face_storage import FaceStorage

app = Flask(__name__)
CORS(app)

# Initialize face storage
face_storage = FaceStorage()

# Load the face detection classifier
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
# Load the face recognition model
face_recognizer = cv2.face.LBPHFaceRecognizer_create()

def detect_face(image):
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply histogram equalization to improve contrast
    gray = cv2.equalizeHist(gray)
    
    # Detect faces with adjusted parameters for better detection
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.05,  # Reduced from 1.1 for more precise detection
        minNeighbors=4,    # Reduced from 5 to detect more faces
        minSize=(30, 30),
        flags=cv2.CASCADE_SCALE_IMAGE
    )
    
    if len(faces) == 0:
        return None
    
    # Get the largest face
    largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
    return largest_face

def extract_face_features(face_img):
    try:
        # Resize the face image to a standard size
        face_img = cv2.resize(face_img, (100, 100))
        # Convert to grayscale
        gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        # Apply histogram equalization
        gray = cv2.equalizeHist(gray)
        # Apply Gaussian blur to reduce noise
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        # Flatten the image to create a feature vector
        return gray.flatten()
    except Exception as e:
        print(f"Error extracting face features: {str(e)}")
        return None

@app.route('/recognize', methods=['POST'])
def recognize_face():
    try:
        # Get the image data from the request
        image_data = request.json.get('image')
        if not image_data:
            return jsonify({"error": "No image data provided"}), 400
        
        # Convert base64 image to numpy array
        import base64
        
        # Remove the data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return jsonify({"error": "Failed to decode image"}), 400
                
        except Exception as e:
            return jsonify({"error": f"Error decoding image: {str(e)}"}), 400
        
        # Detect face
        face_rect = detect_face(image)
        if face_rect is None:
            return jsonify({"error": "No face detected"}), 400
        
        x, y, w, h = face_rect
        face_img = image[y:y+h, x:x+w]
        
        # Extract face features
        face_features = extract_face_features(face_img)
        if face_features is None:
            return jsonify({"error": "Failed to extract face features"}), 400
        
        # Compare with known faces
        if len(face_storage.known_faces) > 0:
            min_distance = float('inf')
            best_match_index = -1
            
            for i, known_encoding in enumerate(face_storage.known_faces):
                # Calculate Euclidean distance between face features
                distance = np.linalg.norm(face_features - known_encoding)
                if distance < min_distance:
                    min_distance = distance
                    best_match_index = i
            
            # If the distance is below a threshold, consider it a match
            if min_distance < 8000:  # Increased threshold from 5000 to 8000
                return jsonify({
                    "recognized": True,
                    "name": face_storage.known_names[best_match_index],
                    "box": [int(x), int(y), int(w), int(h)]
                })
        
        return jsonify({
            "recognized": False,
            "encoding": face_features.tolist(),
            "box": [int(x), int(y), int(w), int(h)]
        })
        
    except Exception as e:
        print(f"Error in recognize_face: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/save_face', methods=['POST'])
def save_face():
    try:
        data = request.json
        if not data or 'name' not in data or 'encoding' not in data:
            return jsonify({"error": "Missing required data"}), 400
            
        name = data['name']
        encoding = np.array(data['encoding'])
        
        # Save face using storage system
        if face_storage.save_face(name, encoding):
            return jsonify({"success": True, "message": f"Face saved for {name}"})
        else:
            return jsonify({"error": "Failed to save face"}), 500
        
    except Exception as e:
        print(f"Error in save_face: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/faces', methods=['GET'])
def get_faces():
    """Get all stored faces"""
    try:
        faces = face_storage.get_all_faces()
        return jsonify({"faces": faces})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/faces/<int:face_id>', methods=['DELETE'])
def delete_face(face_id):
    """Delete a face by ID"""
    try:
        if face_storage.delete_face(face_id):
            return jsonify({"success": True, "message": f"Face {face_id} deleted"})
        else:
            return jsonify({"error": "Failed to delete face"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 
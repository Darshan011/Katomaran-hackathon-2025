import json
import os
from datetime import datetime
import numpy as np

class FaceStorage:
    def __init__(self, storage_dir="face_data"):
        self.storage_dir = storage_dir
        self.faces_file = os.path.join(storage_dir, "faces.json")
        self.known_faces = []
        self.known_names = []
        self._ensure_storage_exists()
        self.load_faces()

    def _ensure_storage_exists(self):
        """Ensure the storage directory exists"""
        if not os.path.exists(self.storage_dir):
            os.makedirs(self.storage_dir)

    def load_faces(self):
        """Load all faces from storage"""
        if os.path.exists(self.faces_file):
            try:
                with open(self.faces_file, 'r') as f:
                    data = json.load(f)
                    self.known_faces = [np.array(face['encoding']) for face in data]
                    self.known_names = [face['name'] for face in data]
            except Exception as e:
                print(f"Error loading faces: {str(e)}")
                self.known_faces = []
                self.known_names = []

    def save_face(self, name, encoding):
        """Save a new face to storage"""
        try:
            # Load existing data
            existing_data = []
            if os.path.exists(self.faces_file):
                with open(self.faces_file, 'r') as f:
                    existing_data = json.load(f)

            # Add new face data
            face_data = {
                'name': name,
                'encoding': encoding.tolist(),
                'timestamp': datetime.now().isoformat(),
                'id': len(existing_data) + 1
            }
            existing_data.append(face_data)

            # Save updated data
            with open(self.faces_file, 'w') as f:
                json.dump(existing_data, f, indent=2)

            # Update in-memory data
            self.known_faces.append(np.array(encoding))
            self.known_names.append(name)

            return True
        except Exception as e:
            print(f"Error saving face: {str(e)}")
            return False

    def get_all_faces(self):
        """Get all stored faces"""
        if os.path.exists(self.faces_file):
            with open(self.faces_file, 'r') as f:
                return json.load(f)
        return []

    def delete_face(self, face_id):
        """Delete a face by ID"""
        try:
            if os.path.exists(self.faces_file):
                with open(self.faces_file, 'r') as f:
                    faces = json.load(f)

                # Remove face with matching ID
                faces = [face for face in faces if face['id'] != face_id]

                # Save updated data
                with open(self.faces_file, 'w') as f:
                    json.dump(faces, f, indent=2)

                # Reload faces
                self.load_faces()
                return True
        except Exception as e:
            print(f"Error deleting face: {str(e)}")
            return False

    def get_face_by_id(self, face_id):
        """Get face data by ID"""
        if os.path.exists(self.faces_file):
            with open(self.faces_file, 'r') as f:
                faces = json.load(f)
                for face in faces:
                    if face['id'] == face_id:
                        return face
        return None 
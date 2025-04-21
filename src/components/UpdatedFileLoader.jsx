import React, { useState } from 'react';
import DropZone from './DropZone';
import FileList from './FileList';
import FileCount from './FileCount';
import Button from './Button';
import ExerciseTypeSelector from './ExerciseTypeSelector';

const FileUploader = ({ username }) => {
  const [files, setFiles] = useState([]);
  const [exerciseType, setExerciseType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ message: '', error: false });

  const handleFiles = (newFiles) => {
    const uniqueFiles = Array.from(newFiles).filter(
      newFile => !files.some(f =>
        f.name === newFile.name && f.size === newFile.size
      )
    );
    setFiles(prevFiles => [...prevFiles, ...uniqueFiles]);
  };

  const handleSubmit = async () => {
    if (!exerciseType) {
      setUploadStatus({ message: 'Please select an exercise type', error: true });
      return;
    }

    if (files.length === 0) {
      setUploadStatus({ message: 'Please add files to upload', error: true });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ message: '', error: false });

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/exercises/submit?exercise_type=${exerciseType}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadStatus({ 
        message: `Successfully uploaded ${result.uploaded_files.length} files`, 
        error: false 
      });
      setFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus({ 
        message: 'Error uploading files. Please try again.', 
        error: true 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const containerStyle = {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const userInfoStyle = {
    marginBottom: '20px',
    padding: '10px 15px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    color: '#4b5563',
    fontWeight: '500',
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: '20px',
  };

  const statusMessageStyle = {
    padding: '10px',
    marginTop: '15px',
    borderRadius: '6px',
    color: uploadStatus.error ? '#ef4444' : '#10b981',
    backgroundColor: uploadStatus.error ? '#fee2e2' : '#d1fae5',
    display: uploadStatus.message ? 'block' : 'none',
  };

  return (
    <div style={containerStyle}>
      <div style={userInfoStyle}>
        Logged in as: {username}
      </div>
      
      <ExerciseTypeSelector 
        selectedType={exerciseType} 
        onSelectType={setExerciseType} 
      />
      
      <DropZone onFilesAdded={handleFiles} />
      <FileList files={files} />
      <FileCount count={files.length} />
      
      {uploadStatus.message && (
        <div style={statusMessageStyle}>{uploadStatus.message}</div>
      )}
      
      <div style={buttonContainerStyle}>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Submit Files'}
        </Button>
      </div>
    </div>
  );
};

export default FileUploader;
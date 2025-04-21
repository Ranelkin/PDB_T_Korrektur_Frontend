import React, { useState, useEffect } from 'react';
import Button from './Button';

const FileDownloader = ({ exerciseType }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (exerciseType) {
      fetchGradedFiles();
    }
  }, [exerciseType]);

  const fetchGradedFiles = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/exercises/graded?type=${exerciseType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch graded files');
      }
      
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      setError('Error loading graded files. Please try again.');
      console.error('Error fetching graded files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (filename) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/exercises/download?filename=${filename}&type=${exerciseType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Error downloading file. Please try again.');
      console.error('Error downloading file:', error);
    }
  };

  const containerStyle = {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  };

  const headingStyle = {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#374151',
  };

  const fileItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  };

  const errorStyle = {
    color: '#ef4444',
    marginBottom: '15px',
  };

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Graded Exercises</h3>
      
      {error && <div style={errorStyle}>{error}</div>}
      
      {isLoading ? (
        <p>Loading files...</p>
      ) : files.length === 0 ? (
        <p>No graded files available for download.</p>
      ) : (
        <div>
          {files.map((file, index) => (
            <div key={index} style={fileItemStyle}>
              <span>{file.name}</span>
              <Button 
                variant="primary" 
                size="small" 
                onClick={() => downloadFile(file.name)}
              >
                Download
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '15px' }}>
        <Button 
          variant="secondary" 
          size="medium" 
          onClick={fetchGradedFiles}
          disabled={isLoading || !exerciseType}
        >
          Refresh Files
        </Button>
      </div>
    </div>
  );
};

export default FileDownloader;
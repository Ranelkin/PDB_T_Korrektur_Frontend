import React, { useState, useEffect } from 'react';
import Button from './Button';
import { getGradedExercises, downloadFile } from './APIService';

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
      const response = await getGradedExercises(exerciseType);
      if (response.error) {
        throw new Error(response.error);
      }
      setFiles(response.files || []);
    } catch (error) {
      setError(error.message || 'Error loading graded files. Please try again.');
      console.error('Error fetching graded files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await downloadFile(filename, exerciseType);
      if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      setError(error.message || 'Error downloading file. Please try again.');
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
              <Button variant="primary" size="small" onClick={() => handleDownload(file.name)}>
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
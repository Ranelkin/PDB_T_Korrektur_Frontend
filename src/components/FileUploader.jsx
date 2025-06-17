import { useState, useEffect } from 'react';
import DropZone from './DropZone';
import FileList from './FileList';
import FileCount from './FileCount';
import Button from './Button';
import { uploadSubmissions, connectToDepictFiles, downloadFile } from './APIService';

const FileUploader = ({ username }) => {
  const [file, setFile] = useState(null);
  const [exerciseType, setExerciseType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ message: '', error: false });
  const [feedbackFiles, setFeedbackFiles] = useState([]);
  const [availableGradedFiles, setAvailableGradedFiles] = useState([]);
  const [hasGradedResults, setHasGradedResults] = useState(false);
  const [finalGradedZip, setFinalGradedZip] = useState(null);

  const EXERCISE_TYPES = [
    { id: 'ER', name: 'ER Diagram' },
    { id: 'KEYS', name: 'Keys' },
  ];

  useEffect(() => {
    let unsubscribe;
    if (exerciseType && username) {
      unsubscribe = connectToDepictFiles(
        exerciseType,
        (files) => {
          setAvailableGradedFiles(files);
          setHasGradedResults(files.length > 0);
          console.log('Received graded files:', files);
        },
        (error) => {
          console.error('WebSocket error:', error);
          setUploadStatus({ message: `WebSocket error: ${error.message}`, error: true });
        }
      );
    }
    return () => unsubscribe && unsubscribe();
  }, [exerciseType, username]);

  const handleFile = (newFile) => {
    setFile(newFile);
  };

  const handleSubmit = async () => {
    if (!exerciseType) {
      setUploadStatus({ message: 'Please select an exercise type', error: true });
      return;
    }

    if (!file) {
      setUploadStatus({ message: 'Please add a file to upload', error: true });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ message: '', error: false });

    try {
      console.log('Submitting - exerciseType:', exerciseType, 'file:', file.name);
      const response = await uploadSubmissions(exerciseType, file);
      
      setFeedbackFiles(response.feedbackFiles || []);
      setAvailableGradedFiles(response.availableGradedFiles || []);
      setHasGradedResults(response.hasGradedResults || false);
      setFinalGradedZip(response.finalGradedZip || null);
      
      const successCount = response.summary?.successful || 0;
      const totalCount = response.summary?.total_submissions || 0;
      
      setUploadStatus({
        message: `Successfully processed ${successCount}/${totalCount} submissions from ${file.name}`,
        error: false,
      });
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus({
        message: error.message === 'Please log in to submit files'
          ? 'Please log in to submit files'
          : `Error uploading file: ${error.message || 'Please try again'}`,
        error: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!exerciseType) {
      setUploadStatus({ message: 'Please select an exercise type first', error: true });
      return;
    }

    setIsDownloading(true);
    setUploadStatus({ message: '', error: false });

    try {
      const response = await downloadFile(exerciseType);
      if (response.error) {
        throw new Error(response.error);
      }
      setUploadStatus({ message: `Successfully downloaded: ${response.filename}`, error: false });
    } catch (error) {
      setUploadStatus({ 
        message: `Error downloading feedback: ${error.message || 'Please try again'}`, 
        error: true 
      });
    } finally {
      setIsDownloading(false);
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

  const selectContainerStyle = {
    marginBottom: '20px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#374151',
  };

  const selectStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: '16px',
    color: '#4b5563',
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '10px',
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

  const feedbackStyle = {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  };

  const fileItemStyle = {
    marginBottom: '10px',
    padding: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
  };

  const gradedFilesListStyle = {
    maxHeight: '200px',
    overflowY: 'auto',
    marginBottom: '10px',
  };

  return (
    <div style={containerStyle}>
      <div style={userInfoStyle}>Logged in as: {username}</div>

      <div style={selectContainerStyle}>
        <label style={labelStyle} htmlFor="exerciseType">
          Exercise Type
        </label>
        <select
          id="exerciseType"
          style={selectStyle}
          value={exerciseType}
          onChange={(e) => setExerciseType(e.target.value)}
        >
          <option value="">Select exercise type</option>
          {EXERCISE_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <DropZone onFileAdded={handleFile} />
      <FileList files={file ? [file] : []} />
      <FileCount count={file ? 1 : 0} />

      {uploadStatus.message && (
        <div style={statusMessageStyle}>{uploadStatus.message}</div>
      )}

      <div style={buttonContainerStyle}>
        <Button variant="primary" onClick={handleSubmit} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Submit File'}
        </Button>
        
        {hasGradedResults && (
          <Button 
            variant="secondary" 
            onClick={handleDownload} 
            disabled={isDownloading || !exerciseType}
          >
            {isDownloading ? 'Downloading...' : 'Download All Feedback'}
          </Button>
        )}
      </div>

      {(feedbackFiles.length > 0 || availableGradedFiles.length > 0 || finalGradedZip) && (
        <div style={feedbackStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
            Correction Results
          </h3>
          
          {finalGradedZip && (
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontWeight: '500', marginBottom: '8px' }}>
                Final Graded Archive: {finalGradedZip}
              </p>
              <Button 
                variant="primary" 
                size="small" 
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? 'Downloading...' : 'Download Feedback ZIP'}
              </Button>
            </div>
          )}
          
          {feedbackFiles.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Recently Processed Files</h4>
              {feedbackFiles.map((file, index) => (
                <div key={index} style={fileItemStyle}>
                  <p><strong>File:</strong> {file.filename}</p>
                  <p><strong>Status:</strong> {file.status}</p>
                  {file.grading && (
                    <p><strong>Grade:</strong> {file.grading.total_points.toFixed(2)}/{file.grading.max_points}</p>
                  )}
                  {file.message && <p><strong>Message:</strong> {file.message}</p>}
                </div>
              ))}
            </div>
          )}
          
          {availableGradedFiles.length > 0 && (
            <div>
              <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>
                Available Graded Files ({availableGradedFiles.length})
              </h4>
              <div style={gradedFilesListStyle}>
                {availableGradedFiles.map((file, index) => (
                  <div key={index} style={fileItemStyle}>
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
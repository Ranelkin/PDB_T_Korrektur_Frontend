import React, { useState } from 'react';
import DropZone from './DropZone';
import FileList from './FileList';
import FileCount from './FileCount';
import Button from './Button';

const FileUploader = () => {
  const [files, setFiles] = useState([]);

  const handleFiles = (newFiles) => {
    const uniqueFiles = Array.from(newFiles).filter(
      newFile => !files.some(f =>
        f.name === newFile.name && f.size === newFile.size
      )
    );
    setFiles(prevFiles => [...prevFiles, ...uniqueFiles]);
  };

  const containerStyle = {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-start', // This aligns the button to the left
    marginTop: '20px',
  };

  return (
    <div style={containerStyle}>
      <DropZone onFilesAdded={handleFiles} />
      <FileList files={files} />
      <FileCount count={files.length} />
      <div style={buttonContainerStyle}>
        <Button variant="primary">Abgaben korrigieren</Button>
      </div>
    </div>
  );
};

export default FileUploader;
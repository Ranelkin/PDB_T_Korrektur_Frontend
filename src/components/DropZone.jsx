import React, { useState, useRef } from 'react';

const DropZone = ({ onFileAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0]; // Take only the first file
    if (file) {
      onFileAdded(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; // Take only the first file
    if (file) {
      onFileAdded(file);
    }
  };

  const dropZoneStyle = {
    border: '2px dashed #7c3aed',
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: isDragging ? '#f3e8ff' : '#fafafa',
    marginBottom: '20px',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    boxShadow: isDragging ? '0 0 20px rgba(124, 58, 237, 0.2)' : 'none',
    ...(isDragging && {
      borderColor: '#6d28d9',
      transform: 'scale(1.02)'
    })
  };

  const textStyle = {
    margin: 0,
    color: '#4b5563',
    fontSize: '18px',
    fontFamily: 'Arial, sans-serif'
  };

  const inputStyle = {
    display: 'none'
  };

  return (
    <div
      style={dropZoneStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <p style={textStyle}>Drag and drop a ZIP file here or click to select</p>
      <input
        type="file"
        ref={fileInputRef}
        style={inputStyle}
        accept=".zip" // Restrict to ZIP files
        onChange={handleFileChange}
      />
    </div>
  );
};

export default DropZone;
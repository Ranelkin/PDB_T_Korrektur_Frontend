import React from 'react';

const FileList = ({ files }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileListStyle = {
    border: '1px solid #e5e7eb',
    padding: '15px',
    minHeight: '150px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    overflowY: 'auto',
    maxHeight: '300px'
  };

  const fileItemStyle = {
    padding: '12px 15px',
    borderBottom: '1px solid #f3f4f6',
    color: '#374151',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#f9fafb'
    }
  };

  const fileNameStyle = {
    flex: 1,
    marginRight: '10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const fileSizeStyle = {
    color: '#6b7280',
    fontSize: '14px'
  };

  return (
    <div style={fileListStyle}>
      {files.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#9ca3af', 
          padding: '20px' 
        }}>
          No files uploaded yet
        </div>
      ) : (
        files.map((file, index) => (
          <div key={index} style={fileItemStyle}>
            <span style={fileNameStyle}>{file.name}</span>
            <span style={fileSizeStyle}>({formatFileSize(file.size)})</span>
          </div>
        ))
      )}
    </div>
  );
};

export default FileList;
import React from 'react';

const FileCount = ({ count }) => {
  const fileCountStyle = {
    marginTop: '15px',
    fontWeight: '600',
    color: '#4b5563',
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f3f4f6',
    padding: '8px 15px',
    borderRadius: '6px',
    display: 'inline-block'
  };

  return (
    <div style={fileCountStyle}>
      Files uploaded: {count}
    </div>
  );
};

export default FileCount;
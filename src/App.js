import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import Login from './components/Login';
import FileDownloader from './components/FileDownloader';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedExerciseType, setSelectedExerciseType] = useState('');

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      validateToken(token);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      // Optional: Verify token with backend
      const response = await fetch('http://localhost:8000/verify-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
        setIsLoggedIn(true);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error validating token:', error);
      localStorage.removeItem('token');
    }
  };

  const handleLogin = (username) => {
    setUsername(username);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUsername('');
  };

  const handleExerciseTypeChange = (type) => {
    setSelectedExerciseType(type);
  };

  const headerStyle = {
    backgroundColor: '#f3f4f6',
    padding: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderRadius: '8px',
  };

  const titleStyle = {
    margin: 0,
    color: '#1f2937',
    fontSize: '24px',
  };

  const logoutButtonStyle = {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  };

  const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
  };

  return (
    <div style={containerStyle}>
      {isLoggedIn ? (
        <>
          <div style={headerStyle}>
            <h1 style={titleStyle}>Exercise Submission System</h1>
            <button 
              style={logoutButtonStyle} 
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
          
          <FileUploader 
            username={username} 
            onExerciseTypeChange={handleExerciseTypeChange}
          />
          
          <FileDownloader exerciseType={selectedExerciseType} />
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
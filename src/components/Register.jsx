import React, { useState } from 'react';
import Button from './Button';
import { registerUser } from './APIService';

const Register = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tutor');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await registerUser(username, password, role);
      if (response.error) {
        throw new Error(response.error);
      }
      onRegister(username);
    } catch (error) {
      setError('Error registering user. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

const containerStyle = {
    maxWidth: '400px',
    margin: '40px auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    fontSize: '16px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500',
    color: '#374151',
  };

  const errorStyle = {
    color: '#ef4444',
    marginBottom: '15px',
  };
  
  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1f2937' }}>Register</h2>
      {error && <div style={errorStyle}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label style={labelStyle} htmlFor="username">Username</label>
          <input
            style={inputStyle}
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="password">Password</label>
          <input
            style={inputStyle}
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="role">Role</label>
          <select
            style={inputStyle}
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="tutor">Tutor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <Button 
          type="submit" 
          variant="primary" 
          fullWidth={true}
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </div>
  );
};

export default Register;
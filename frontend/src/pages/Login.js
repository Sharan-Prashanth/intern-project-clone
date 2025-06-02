import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState(''); // 'hod' or 'employee'
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.type === 'hod') {
        navigate('/hod-dashboard');
      } else if (user.type === 'employee') {
        navigate('/employee-dashboard');
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Manual credential verification
      if (userType === 'hod') {
        if (username === 'hod1' && password === 'hod123') {
          const user = {
            id: 1,
            name: 'HOD User',
            type: 'hod'
          };
          localStorage.setItem('user', JSON.stringify(user));
          navigate('/hod-dashboard');
        } else {
          setError('Invalid HOD credentials');
        }
      } else if (userType === 'employee') {
        if ((username === 'emp1' && password === 'emp123') || 
            (username === 'emp2' && password === 'emp123')) {
          const user = {
            id: username === 'emp1' ? 2 : 3,
            name: username === 'emp1' ? 'Employee One' : 'Employee Two',
            type: 'employee'
          };
          localStorage.setItem('user', JSON.stringify(user));
          navigate('/employee-dashboard');
        } else {
          setError('Invalid Employee credentials');
        }
      } else {
        setError('Please select a user type');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Feedback System Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="user-type-buttons">
            <button
              type="button"
              className={`user-type-btn ${userType === 'hod' ? 'active' : ''}`}
              onClick={() => setUserType('hod')}
            >
              HOD Login
            </button>
            <button
              type="button"
              className={`user-type-btn ${userType === 'employee' ? 'active' : ''}`}
              onClick={() => setUserType('employee')}
            >
              Employee Login
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 
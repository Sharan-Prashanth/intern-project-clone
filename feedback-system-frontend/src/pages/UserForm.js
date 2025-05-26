import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserForm.css';

const UserForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general',
    file: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    userType: 'hod'
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginData.userType === 'hod') {
        if (loginData.username === 'hod' && loginData.password === 'hod123') {
          const user = {
            id: 1,
            name: 'HOD User',
            type: 'hod'
          };
          localStorage.setItem('user', JSON.stringify(user));
          navigate('/hod-dashboard');
        } else {
          setError('Invalid HOD credentials and only Officials are allowed to Login');
        }
      } else if (loginData.userType === 'employee') {
        if ((loginData.username === 'emp1' && loginData.password === 'emp123') || 
            (loginData.username === 'emp2' && loginData.password === 'emp123')) {
          const user = {
            id: loginData.username === 'emp1' ? 1 :2,
            name: loginData.username === 'emp1' ? 'Employee One' : 'Employee Two',
            type: 'employee'
          };
          localStorage.setItem('user', JSON.stringify(user));
          navigate('/employee-dashboard');
        } else {
          setError('Invalid Employee credentials');
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      const response = await axios.post('http://localhost:5000/api/feedback', formDataToSend);
      alert(`Feedback submitted successfully! Your tracking key is: ${response.data.tracking_key}`);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general',
        file: null
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-form-container">
      <div className="form-header">
        <h2>Feedback Form</h2>
        <div className="header-buttons">
          <button 
            className="login-toggle-btn"
            onClick={() => setShowLogin(!showLogin)}
          >
            {showLogin ? 'Show Feedback Form' : 'Login'}
          </button>
          <button 
            className="status-btn"
            onClick={() => navigate('/status')}
          >
            Check Feedback Status
          </button>
        </div>
      </div>

      {showLogin ? (
        <div className="login-section">
          <h3>Login</h3>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>User Type:</label>
              <select
                name="userType"
                value={loginData.userType}
                onChange={handleLoginChange}
                required
              >
                <option value="hod">HOD</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                name="username"
                value={loginData.username}
                onChange={handleLoginChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Subject:</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Category:</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="general">General</option>
              <option value="query">Query</option>
              <option value="complaint">Spam Call</option>
              <option value="spam">Spam mail</option>
            </select>
          </div>
          <div className="form-group">
            <label>Message:</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Proof (if available)</label>
            <input
              type="file"
              name="file"
              onChange={handleChange}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Irunga bhaiii...' : 'Submit Feedback'}
          </button>
        </form>
      )}
    </div>
  );
};

export default UserForm; 
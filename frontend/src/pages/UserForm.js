import React, { useState, useEffect } from 'react';
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
    file: null,
    prNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    userType: 'hod'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrNumber = async () => {
      try {
        const response = await axios.get('http://localhost:3000/show-cookie', { withCredentials: true });
        if (response.data) {
          setFormData(prevData => ({
            ...prevData,
            prNumber: response.data
          }));
        }
      } catch (error) {
        console.error('Error fetching PR number:', error);
        setError('Failed to fetch PR number');
      }
    };

    fetchPrNumber();
  }, []);

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, GIF, PDF or Word documents only.');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 5MB.');
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files && name === 'file') {
      const file = files[0];
      if (file && !validateFile(file)) {
        e.target.value = ''; // Clear the file input
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
    setError(''); // Clear any previous errors
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
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('prNumber', formData.prNumber);
      
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      const response = await axios.post('http://localhost:5000/api/feedback', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.tracking_key) {
        alert(`Feedback submitted successfully! Your tracking key is: ${response.data.tracking_key}`);
        // prNumber should be taken from the session variable 

        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          category: 'general',
          file: null,
          prNumber: ''
        });
        setUploadProgress(0);
      } else {
        throw new Error('No tracking key received');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
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
            <label>PR Number:</label>
            <input
              type="text"
              name="prNumber"
              value={formData.prNumber}
              onChange={handleChange}
              required
              readOnly // no one can alter
            />
          </div>
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
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
            />
            <small className="file-help">
              Accepted formats: JPEG, PNG, GIF, PDF, Word documents. Max size: 5MB
            </small>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
              <span>{uploadProgress}% uploaded</span>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Irunga bhai...' : 'Submit Feedback'}
          </button>
        </form>
      )}
    </div>
  );
};

export default UserForm; 
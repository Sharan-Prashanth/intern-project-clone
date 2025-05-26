import React, { useState } from 'react';
import axios from 'axios';
import './UserStatusPage.css';

function UserStatusPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackingKey, setTrackingKey] = useState('');
  const [userId, setUserId] = useState(null);

  const getStatusBadgeClass = (status) => {
    if (!status) return '';
    return status.toLowerCase().replace(/\s+/g, '_');
  };

  const fetchUserFromTrackingKey = async (key) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:5000/api/feedback/tracking/7801329998`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log(response.data);
  
      if (Array.isArray(response.data) && response.data.length > 0) {
        setUserId(response.data[0].user_id);
        setFeedbacks(response.data);
      } else {
        setError('No feedback found for this tracking key');
      }
    } catch (err) {
      console.error('Error fetching user from tracking key:', err);
      if (err.response) {
        setError(err.response.data.message || 'Failed to fetch feedback status');
      } else if (err.request) {
        setError('No response received from server');
      } else {
        setError('Error setting up the request');
      }
    } finally {
      setLoading(false);
    }
  };  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackingKey.trim()) {
      setError('Please enter a tracking key');
      return;
    }
    await fetchUserFromTrackingKey(trackingKey);
  };

  const renderFeedbackDetails = (feedback) => (
    <div className="feedback-details">
      <div className="status-header">
        <h3>{feedback.subject}</h3>
        <span className={`status-badge ${getStatusBadgeClass(feedback.status)}`}>
          {feedback.status}
        </span>
      </div>
      
      <div className="detail-item">
        <strong>Message:</strong> {feedback.message}
      </div>
      <div className="detail-item">
        <strong>Category:</strong> {feedback.category}
      </div>
      <div className="detail-item">
        <strong>Submitted:</strong> {new Date(feedback.created_at).toLocaleString()}
      </div>
      <div className="detail-item">
        <strong>Tracking Key:</strong> {feedback.tracking_key}
      </div>

      {feedback.employee_name && (
        <div className="detail-item">
          <strong>Assigned To:</strong> {feedback.employee_name}
        </div>
      )}

      {feedback.employee_reply && (
        <>
          <div className="detail-item">
            <strong>Employee Response:</strong> {feedback.employee_reply}
          </div>
          <div className="detail-item">
            <strong>Response Status:</strong> 
            <span className={`status-badge ${getStatusBadgeClass(feedback.response_status)}`}>
              {feedback.response_status}
            </span>
          </div>
          {feedback.hod_comment && (
            <div className="detail-item">
              <strong>HOD Comment:</strong> {feedback.hod_comment}
            </div>
          )}
        </>
      )}

      {feedback.file && (
        <div className="detail-item">
          <strong>Attachment:</strong>{' '}
          <a href={`http://localhost:5000/uploads/${feedback.file}`} target="_blank" rel="noopener noreferrer">
            View File
          </a>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="user-status-page">
        <div className="loading-message">Loading feedback status...</div>
      </div>
    );
  }

  return (
    <div className="user-status-page">
      <div className="status-container">
        <h2>Your Feedback Status</h2>
        
        {!userId && (
          <form onSubmit={handleSubmit} className="tracking-form">
            <div className="input-group">
              <input
                type="text"
                value={trackingKey}
                onChange={(e) => setTrackingKey(e.target.value)}
                placeholder="Enter your tracking key"
                className="tracking-input"
              />
              <button type="submit" className="check-button" disabled={loading}>
                {loading ? 'Checking...' : 'Check Status'}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {userId && feedbacks.length === 0 ? (
          <div className="no-feedback-message">
            You haven't submitted any feedback yet.
          </div>
        ) : userId && (
          <div className="feedback-list">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="feedback-card">
                {renderFeedbackDetails(feedback)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserStatusPage;

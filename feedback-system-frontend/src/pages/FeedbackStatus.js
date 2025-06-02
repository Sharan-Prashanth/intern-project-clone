import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FeedbackStatus.css';

function FeedbackStatus() {
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackingKey, setTrackingKey] = useState('');

  const fetchFeedbackStatus = async (key) => {
    setLoading(true);
    setError(null);
    setFeedbackData(null);

    try {
      const response = await axios.get(`http://localhost:5000/api/feedback/tracking/${key}`);
      setFeedbackData(response.data);
    } catch (err) {
      setError('Error fetching feedback status');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trackingKey.trim()) {
      setError('Please enter a tracking key');
      return;
    }
    fetchFeedbackStatus(trackingKey);
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return '';
    return status.toLowerCase().replace(/\s+/g, '_');
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
      <div className="detail-item">
        <strong>PR Number:</strong> {feedback.pr_number}
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
        </>
      )}

      {feedback.hod_comment && (
        <div className="detail-item">
          <strong>HOD Comment:</strong> {feedback.hod_comment}
        </div>
      )}

      {feedback.file && (
        <div className="detail-item file-attachment">
          <strong>Attachment:</strong>
          <a 
            href={`http://localhost:5000/uploads/${feedback.file}`}
            target="_blank"
            rel="noopener noreferrer"
            className="file-link"
          >
            <i className="fas fa-paperclip"></i> View File
          </a>
        </div>
      )}
    </div>
  );

  return (
    <div className="feedback-status-page">
      <div className="status-container">
        <h2>Feedback Status</h2>
        
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

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="loading">Loading feedback status...</div>
        ) : feedbackData ? (
          <div className="feedback-result">
            {renderFeedbackDetails(feedbackData)}
          </div>
        ) : (
          <div className="no-feedback">Enter your tracking key to check feedback status</div>
        )}
      </div>
    </div>
  );
}

export default FeedbackStatus; 
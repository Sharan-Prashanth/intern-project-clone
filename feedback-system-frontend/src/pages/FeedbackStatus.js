import React, { useState } from 'react';
import axios from 'axios';
import './FeedbackStatus.css';

function FeedbackStatus() {
  const [trackingKey, setTrackingKey] = useState('');
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackingKey.trim()) {
      setError('Please enter a tracking key');
      return;
    }

    setLoading(true);
    setError(null);
    setFeedbackData(null);

    try {
      const response = await axios.get(`http://localhost:5000/api/feedback/tracking/${trackingKey}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setFeedbackData(response.data);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Error fetching feedback status');
      } else if (err.request) {
        setError('No response received from server');
      } else {
        setError('Error setting up the request');
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return '';
    return status.toLowerCase().replace(/\s+/g, '_');
  };

  const renderFeedbackDetails = (feedback) => (
    <div className="feedback-details">
      <div className="status-header">
        <h3>Feedback Status</h3>
        <span className={`status-badge ${getStatusBadgeClass(feedback.status)}`}>
          {feedback.status}
        </span>
      </div>
      
      <div className="detail-item">
        <strong>Subject:</strong> {feedback.subject}
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
        <div className="detail-item">
          <strong>Attachment:</strong>{' '}
          <a 
            href={`http://localhost:5000/uploads/${feedback.file}`}
            target="_blank"
            rel="noopener noreferrer"
            className="file-link"
          >
            View File
          </a>
        </div>
      )}
    </div>
  );

  return (
    <div className="feedback-status">
      <div className="status-container">
        <h2>Check Feedback Status</h2>
        <form onSubmit={handleSubmit} className="status-form">
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

        {feedbackData && (
          <>
            <h3 className="section-title">Current Feedback</h3>
            {renderFeedbackDetails(feedbackData.current_feedback)}

            <h3 className="section-title">All Your Feedback</h3>
            <div className="all-feedback-list">
              {feedbackData.all_feedback.map((feedback, index) => (
                <div key={feedback.id} className={`feedback-card ${feedback.tracking_key === trackingKey ? 'current' : ''}`}>
                  <div className="feedback-header">
                    <h4>{feedback.subject}</h4>
                    <span className={`status-badge ${getStatusBadgeClass(feedback.status)}`}>
                      {feedback.status}
                    </span>
                  </div>
                  <div className="feedback-preview">
                    <p><strong>Category:</strong> {feedback.category}</p>
                    <p><strong>Submitted:</strong> {new Date(feedback.created_at).toLocaleString()}</p>
                    <p><strong>Tracking Key:</strong> {feedback.tracking_key}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FeedbackStatus; 
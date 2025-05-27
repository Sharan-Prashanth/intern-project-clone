import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './HODDashboard.css';

function HODDashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [pendingResponses, setPendingResponses] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'pending'
  const [hodComment, setHodComment] = useState({});

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
    fetchFeedbacks();
    fetchPendingResponses();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/feedback');
      setFeedbacks(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch feedbacks');
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingResponses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/feedback/responses/pending');
      setPendingResponses(res.data);
    } catch (err) {
      console.error('Error fetching pending responses:', err);
    }
  };

  const assignFeedback = async (feedback_id) => {
    console.log(feedback_id, employeeId);
    try {

      if (parseInt(employeeId) === 1 || parseInt(employeeId) === 2) {

        await axios.post('http://localhost:5000/api/feedback/assign', {
        feedback_id,
        hod_id: user.id,
        employee_id: parseInt(employeeId),
      });
      alert("Feedback assigned successfully!");
      fetchFeedbacks();
      }
      
      
    } catch (err) {

      alert("Failed to assign feedback. Please try again.");
      console.error('Error assigning feedback:', err);
    }
  };

  const handleReview = async (response_id, status) => {
    if (status === 'Approved' && !hodComment[response_id]) {
      alert('Please provide a comment before approving');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/feedback/response/review', {
        response_id,
        status,
        hod_comment: hodComment[response_id] || ''
      });
      alert(`Response ${status.toLowerCase()} successfully`);
      fetchPendingResponses();
      // Clear the comment for this response
      setHodComment(prev => {
        const newComments = { ...prev };
        delete newComments[response_id];
        return newComments;
      });
    } catch (err) {
      alert("Failed to review response. Please try again.");
      console.error('Error reviewing response:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="hod-dashboard">
      <div className="dashboard-header">
        <h2>HOD Dashboard</h2>
        <div className="user-info">
          Welcome, {user?.name}
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          New Feedbacks
        </button>
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Reviews ({pendingResponses.length})
        </button>
      </div>

      {activeTab === 'new' ? (
        <div className="feedback-list">
          {feedbacks.length === 0 ? (
            <p className="no-feedbacks">No feedbacks available</p>
          ) : (
            feedbacks.map(f => (
              <div key={f.id} className="feedback-card">
                <div className="feedback-header">
                  <h3>{f.subject}</h3>
                  <span className={`category ${f.category}`}>{f.category}</span>
                </div>
                <div className="feedback-details">
                  <p><strong>From:</strong> {f.user_name}</p>
                  <p><strong>Message:</strong> {f.message}</p>
                  <p><strong>Status:</strong> <span className={`status ${f.status.toLowerCase()}`}>{f.status}</span></p>
                  <p><strong>Tracking Key:</strong> {f.tracking_key}</p>
                  {f.file && (
                    <p><strong>Attachment:</strong> <a href={`http://localhost:5000/uploads/${f.file}`} target="_blank" rel="noopener noreferrer">View File</a></p>
                  )}
                  <p><strong>Submitted:</strong> {new Date(f.created_at).toLocaleString()}</p>
                </div>
                <div className="assignment-section">
                  <button 
                    onClick = {() => {assignFeedback(f.id);
                      setEmployeeId('1');
                    }}
                    className="assign-button"
                    >
                      Assign to 1</button>
                  <button 
                    onClick = {() => {assignFeedback(f.id);
                      setEmployeeId('2');
                    }}
                    className="assign-button"
                    >
                      Assign to 2</button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="pending-responses">
          {pendingResponses.length === 0 ? (
            <p className="no-responses">No pending responses to review</p>
          ) : (
            pendingResponses.map(response => (
              <div key={response.response_id} className="response-card">
                <div className="response-header">
                  <h3>{response.subject}</h3>
                  <span className="employee-name">Assigned to: {response.employee_name}</span>
                </div>
                <div className="response-details">
                  <p><strong>Original Message:</strong> {response.message}</p>
                  <p><strong>Employee Response:</strong> {response.employee_reply}</p>
                  <p><strong>Submitted:</strong> {new Date(response.created_at).toLocaleString()}</p>
                </div>
                <div className="review-section">
                  <textarea
                    placeholder="Enter your comment (required for approval)"
                    value={hodComment[response.response_id] || ''}
                    onChange={e => setHodComment(prev => ({
                      ...prev,
                      [response.response_id]: e.target.value
                    }))}
                    className="hod-comment-input"
                  />
                  <div className="review-buttons">
                    <button 
                      onClick={() => handleReview(response.response_id, 'Approved')}
                      className="approve-button"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReview(response.response_id, 'Rejected')}
                      className="reject-button"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default HODDashboard;

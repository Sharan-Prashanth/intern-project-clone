import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './HODDashboard.css';

function HODDashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [pendingResponses, setPendingResponses] = useState([]);
  const [assignedFeedbacks, setAssignedFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('new'); // 'new', 'assigned', 'responses', 'report'
  const [hodComment, setHodComment] = useState({});

  // Report state
  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');
  const [reportData, setReportData] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
    fetchFeedbacks();
    fetchPendingResponses();
    fetchAssignedFeedbacks();
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

  const fetchAssignedFeedbacks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/feedback/assigned/all');
      setAssignedFeedbacks(res.data);
    } catch (err) {
      console.error('Error fetching assigned feedbacks:', err);
    }
  };

  const assignFeedback = async (feedback_id, selectedEmployeeId) => {
    try {
      if (selectedEmployeeId === 1 || selectedEmployeeId === 2) {
        await axios.post('http://localhost:5000/api/feedback/assign', {
          feedback_id,
          hod_id: user.id,
          employee_id: selectedEmployeeId,
        });
      


        // Remove the feedback from the unassigned list
        setFeedbacks(prevFeedbacks =>
          prevFeedbacks.filter(feedback => feedback.id !== feedback_id)
        );

        // Refresh assigned feedbacks
        fetchAssignedFeedbacks();

        alert("Feedback assigned successfully!");
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

  const renderFeedbackDetails = (feedback) => (
    <div className="feedback-details">
      <div className="feedback-header">
        <h3>{feedback.subject}</h3>
        <span className={`category ${feedback.category}`}>{feedback.category}</span>
      </div>
      <div className="feedback-content">
        <p><strong>From:</strong> {feedback.user_name}</p>
        <p><strong>Message:</strong> {feedback.message}</p>
        <p><strong>Status:</strong> <span className={`status ${feedback.status.toLowerCase()}`}>{feedback.status}</span></p>
        <p><strong>Tracking Key:</strong> {feedback.tracking_key}</p>
        <p><strong>PR Number:</strong> {feedback.pr_number}</p>
        {feedback.file && (
          <div className="file-attachment">
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
        <p><strong>Submitted:</strong> {new Date(feedback.created_at).toLocaleString()}</p>
      </div>
    </div>
  );

  // Report fetch function
  const fetchReport = async () => {
    if (!reportStart || !reportEnd) {
      setReportError('Please select both start and end dates.');
      return;
    }
    setReportLoading(true);
    setReportError(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/feedback/report?start=${reportStart}&end=${reportEnd}`);
      setReportData(res.data.reports);
      console.log('Report Response:', res.data.reports);
      
      setReportSummary(res.data.summary);
    } catch (err) {
      setReportError('Failed to fetch report data.');
    } finally {
      setReportLoading(false);
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

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          New Feedbacks
        </button>
        <button
          className={`tab-button ${activeTab === 'responses' ? 'active' : ''}`}
          onClick={() => setActiveTab('responses')}
        >
          Pending Responses
        </button>
        <button
          className={`tab-button ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          Report
        </button>
      </div>

      {activeTab === 'report' ? (
        <div className="report-section">
          <div className="report-filters">
            <label>
              Start Date:
              <input
                type="date"
                value={reportStart}
                onChange={e => setReportStart(e.target.value)}
              />
            </label>
            <label style={{ marginLeft: '1rem' }}>
              End Date:
              <input
                type="date"
                value={reportEnd}
                onChange={e => setReportEnd(e.target.value)}
              />
            </label>
            <button
              className="assign-button"
              style={{ marginLeft: '1rem' }}
              onClick={fetchReport}
              disabled={reportLoading}
            >
              {reportLoading ? 'Loading...' : 'Fetch Report'}
            </button>
          </div>
          {reportError && <div className="error">{reportError}</div>}
          {reportSummary && (
            <div className="report-summary" style={{ margin: '1.5rem 0', display: 'flex', gap: '2rem' }}>
              <div><strong>Total:</strong> {reportSummary.total}</div>
              <div><strong>Resolved:</strong> {reportSummary.resolved}</div>
              <div><strong>In Progress:</strong> {reportSummary.in_progress}</div>
              <div><strong>Pending:</strong> {reportSummary.pending}</div>
            </div>
          )}
          <div className="report-table-container" style={{ overflowX: 'auto' }}>
            <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Query ID</th>
                  <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>User</th>
                  <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Date</th>
                  <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Status</th>
                  <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Employee Assigned</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>No reports found for selected range.</td></tr>
                ) : (
                  reportData.map(row => (
                    <tr key={row.id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{row.id}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{row.user_name}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{new Date(row.created_at).toLocaleString()}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{row.status}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{row.employee_id || 'Not Assigned'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'new' ? (
        <div className="feedback-list">
          {feedbacks.length === 0 ? (
            <p className="no-feedbacks">No new feedbacks available</p>
          ) : (
            feedbacks.map(feedback => (
              <div key={feedback.id} className="feedback-card">
                {renderFeedbackDetails(feedback)}
                <div className="assignment-section">
                  <button
                    onClick={() => assignFeedback(feedback.id, 1)}
                    className="assign-button"
                  >
                    Assign to 1
                  </button>

                  <button
                    onClick={() => assignFeedback(feedback.id, 2)}
                    className="assign-button"
                  >
                    Assign to 2
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="pending-responses">
          {pendingResponses.length === 0 ? (
            <p className="no-feedbacks">No pending responses</p>
          ) : (
            pendingResponses.map(response => (
              <div key={response.response_id} className="response-card">
                <div className="response-header">
                  <h3>{response.subject}</h3>
                  <span className={`status ${response.status.toLowerCase()}`}>
                    {response.status}
                  </span>
                </div>
                <div className="response-content">
                  <p><strong>From User:</strong> {response.user_name}</p>
                  <p><strong>Original Message:</strong> {response.message}</p>
                  <p><strong>Employee Response:</strong> {response.employee_reply}</p>
                  <p><strong>Responded By:</strong> {response.employee_name}</p>
                  <p><strong>Response Date:</strong> {new Date(response.created_at).toLocaleString()}</p>
                </div>
                <div className="review-section">
                  <textarea
                    value={hodComment[response.response_id] || ''}
                    onChange={(e) => setHodComment(prev => ({
                      ...prev,
                      [response.response_id]: e.target.value
                    }))}
                    placeholder="Add your comment..."
                    className="hod-comment"
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

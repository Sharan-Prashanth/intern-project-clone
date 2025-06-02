import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './EmployeeDashboard.css';

function EmployeeDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
    if (storedUser) {
      fetchAssignments(storedUser.id);
    }
  }, []);

  const fetchAssignments = async (employeeId) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/feedback/assigned/${employeeId}`);
      setAssignments(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch assignments');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignment_id) => {
    if (!replies[assignment_id]) {
      alert('Please enter a reply');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/feedback/response', {
        assignment_id,
        employee_reply: replies[assignment_id],
      });
      
      // Remove the feedback from the assignments list immediately
      setAssignments(prevAssignments => 
        prevAssignments.filter(assignment => assignment.assignment_id !== assignment_id)
      );
      
      // Clear the reply for this assignment
      setReplies(prev => {
        const newReplies = { ...prev };
        delete newReplies[assignment_id];
        return newReplies;
      });

      alert("Response submitted successfully!");
    } catch (err) {
      alert("Failed to submit response. Please try again.");
      console.error('Error submitting response:', err);
    }
  };

  const renderAssignmentDetails = (assignment) => (
    <div className="assignment-details">
      <div className="assignment-header">
        <h3>{assignment.subject}</h3>
        <span className={`category ${assignment.category}`}>
          {assignment.category}
        </span>
      </div>
      <div className="assignment-content">
        <p><strong>From:</strong> {assignment.user_name}</p>
        <p><strong>Message:</strong> {assignment.message}</p>
        <p><strong>Status:</strong> <span className={`status ${assignment.status.toLowerCase()}`}>{assignment.status}</span></p>
        <p><strong>Tracking Key:</strong> {assignment.tracking_key}</p>
        <p><strong>PR Number:</strong> {assignment.pr_number}</p>
        {assignment.file && (
          <div className="file-attachment">
            <strong>Attachment:</strong>
            <a 
              href={`http://localhost:5000/uploads/${assignment.file}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="file-link"
            >
              <i className="fas fa-paperclip"></i> View File
            </a>
          </div>
        )}
        <p><strong>Assigned On:</strong> {new Date(assignment.assigned_at).toLocaleString()}</p>
        
        {assignment.employee_reply && (
          <div className="response-info">
            <p><strong>Your Response:</strong> {assignment.employee_reply}</p>
            <p><strong>Response Status:</strong> <span className={`status ${assignment.response_status?.toLowerCase()}`}>{assignment.response_status}</span></p>
            {assignment.hod_comment && (
              <p><strong>HOD Comment:</strong> {assignment.hod_comment}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading assignments...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="employee-dashboard">
      <div className="dashboard-header">
        <h2>Employee Dashboard</h2>
        <div className="user-info">
          Welcome, {user?.name}
        </div>
      </div>

      <div className="assignments-list">
        {assignments.length === 0 ? (
          <p className="no-assignments">No assignments available</p>
        ) : (
          assignments.map(assignment => (
            <div key={assignment.assignment_id} className="assignment-card">
              {renderAssignmentDetails(assignment)}
              {!assignment.employee_reply && (
                <div className="response-section">
                  <textarea
                    value={replies[assignment.assignment_id] || ''}
                    onChange={e => setReplies(prev => ({
                      ...prev,
                      [assignment.assignment_id]: e.target.value
                    }))}
                    placeholder="Enter your response..."
                    className="response-input"
                  />
                  <button 
                    onClick={() => handleSubmit(assignment.assignment_id)}
                    className="submit-button"
                    disabled={!replies[assignment.assignment_id]}
                  >
                    Submit Response
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;

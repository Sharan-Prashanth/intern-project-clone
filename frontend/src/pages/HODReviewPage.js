import React, { useEffect, useState } from 'react';
import axios from 'axios';

function HODReviewPage() {
  const [pending, setPending] = useState([]);

  const fetchPending = async () => {
    const res = await axios.get('http://localhost:5000/api/feedback/responses/pending');
    setPending(res.data);
  };

  const handleReview = async (response_id, status) => {
    await axios.post('http://localhost:5000/api/feedback/response/review', {
      response_id,
      status,
    });
    alert("Response " + status);
    fetchPending();
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div>
      <h2>Review Responses</h2>
      {pending.map(r => (
        <div key={r.response_id} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <p><strong>Subject:</strong> {r.subject}</p>
          <p><strong>Reply:</strong> {r.employee_reply}</p>
          <button onClick={() => handleReview(r.response_id, 'Approved')}>Approve</button>
          <button onClick={() => handleReview(r.response_id, 'Rejected')}>Reject</button>
        </div>
      ))}
    </div>
  );
}

export default HODReviewPage;

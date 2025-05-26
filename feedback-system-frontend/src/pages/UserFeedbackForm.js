import React, { useState } from 'react';
import axios from 'axios';

function FeedbackForm() {
  const [formData, setFormData] = useState({
    user_id: 1,
    subject: '',
    message: '',
    category: 'general',
    file: null,
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }

    try {
      const res = await axios.post('http://localhost:5000/api/feedback', data);
      alert("Feedback submitted successfully!");
    } catch (err) {
      alert("Error submitting feedback");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        name="subject" 
        placeholder="Subject" 
        value={formData.subject}
        onChange={handleChange}
        required 
      />
      <textarea 
        name="message" 
        placeholder="Your message" 
        value={formData.message}
        onChange={handleChange}
        required
      ></textarea>
      <select 
        name="category" 
        value={formData.category}
        onChange={handleChange}
        required
      >
        <option value="general">General</option>
        <option value="query">Query</option>
        <option value="complaint">Complaint</option>
        <option value="spam">Spam</option>  
      </select>
      <input 
        type="file" 
        name="file" 
        onChange={handleFileChange}
      />
      <button type="submit">Submit Feedback</button>
    </form>
  );
}

export default FeedbackForm;

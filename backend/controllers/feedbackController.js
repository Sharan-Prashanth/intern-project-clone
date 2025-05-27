const db = require('../db');

const generateTrackingKey = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
};

exports.submitFeedback = (req, res) => {
  const { name, email, subject, message, category } = req.body;
  console.log({ name, email, subject, message, category });

  const file = req.file ? req.file.filename : null;
  const tracking_key = generateTrackingKey();

  console.log('Submitting feedback:', { name, email, subject, message, category });

  const checkUserSql = 'SELECT id FROM users WHERE email = ?';
  db.query(checkUserSql, [email], (err, results) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).send("Error checking user");
    }

    console.log('User check results:', results);

    let userId;
    if (results.length === 0) {
      const createUserSql = 'INSERT INTO users (username, email, password, name, user_type) VALUES (?, ?, ?, ?, ?)';
      const username = email.split('@')[0]; 
      const defaultPassword = 'password123';``
      db.query(createUserSql, [username, email, defaultPassword, name, 'employee'], (err, result) => {
        if (err) {
          console.error("Error creating user:", err);
          return res.status(500).send("Error creating user");
        }
        userId = result.insertId;
        console.log('Created new user with ID:', userId);
        insertFeedback(userId);
      });
    } else {
      userId = results[0].id;
      console.log('Using existing user ID:', userId);
      insertFeedback(userId);
    }
  });

  function insertFeedback(userId) {
    const sql = `INSERT INTO feedback (user_id, subject, message, category, file, tracking_key, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [userId, subject, message, category, file, tracking_key, 'Submitted'], (err, result) => {
      if (err) {
        console.error("Error submitting feedback:", err);
        return res.status(500).send("Error submitting feedback");
      }
      console.log('Feedback inserted with ID:', result.insertId);
      res.status(200).json({ 
        id: result.insertId,
        tracking_key: tracking_key,
        message: 'Feedback submitted successfully'
      });
    });
  }
};

exports.getAllFeedbacks = (req, res) => {
  const sql = `
    SELECT f.*, u.name as user_name 
    FROM feedback f 
    JOIN users u ON f.user_id = u.id 
    ORDER BY f.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Failed to fetch feedbacks", err);
      return res.status(500).send("Error fetching feedbacks");
    }
    res.json(results);
  });
};

exports.assignToEmployee = (req, res) => {
  const { feedback_id, hod_id, employee_id } = req.body;
  
  console.log('Assigning feedback:', { feedback_id, hod_id, employee_id });

  const sql = `INSERT INTO feedback_assignments (feedback_id, hod_id, employee_id) 
               VALUES (?, ?, ?)`;

  db.query(sql, [feedback_id, hod_id, employee_id], (err, result) => {
    if (err) {
      console.error("Assignment failed", err);
      return res.status(500).send("Assignment failed");
    }

    console.log('Assignment created with ID:', result.insertId);

    // Update feedback status
    db.query(
      `UPDATE feedback SET status = 'Assigned' WHERE id = ?`,
      [feedback_id],
      (err2) => {
        if (err2) {
          console.error("Failed to update feedback status", err2);
          return res.status(500).send("Failed to update feedback status");
        }
        console.log('Feedback status updated to Assigned');
        res.json({ 
          message: "Feedback assigned successfully",
          assignment_id: result.insertId
        });
      }
    );
  });
};

exports.getAssignmentsForEmployee = (req, res) => {
  const { employee_id } = req.params;
  
  console.log('Fetching assignments for employee:', employee_id);

  const sql = `
    SELECT 
      fa.id as assignment_id,
      f.id as feedback_id,
      f.subject,
      f.message,
      f.category,
      f.file,
      f.tracking_key,
      u.name as user_name,
      f.created_at
    FROM feedback_assignments fa
    JOIN feedback f ON fa.feedback_id = f.id
    JOIN users u ON f.user_id = u.id
    LEFT JOIN feedback_responses fr ON fa.id = fr.assignment_id
    WHERE fa.employee_id = ?
    AND fr.id IS NULL
    ORDER BY f.created_at DESC
  `;

  db.query(sql, [employee_id], (err, results) => {
    if (err) {
      console.error("Error fetching assignments", err);
      return res.status(500).send("Error fetching assignments");
    }
    console.log('Found assignments:', results);
    res.json(results);
  });
};

exports.submitEmployeeResponse = (req, res) => {
  const { assignment_id, employee_reply } = req.body;
  
  console.log('Submitting employee response:', { assignment_id, employee_reply });

  // First, check if a response already exists
  const checkSql = 'SELECT id FROM feedback_responses WHERE assignment_id = ?';
  db.query(checkSql, [assignment_id], (err, results) => {
    if (err) {
      console.error("Error checking existing response:", err);
      return res.status(500).send("Error checking existing response");
    }

    if (results.length > 0) {
      console.log('Response already exists for this assignment');
      return res.status(400).json({ message: "A response has already been submitted for this feedback" });
    }

    // If no response 
    const insertSql = `INSERT INTO feedback_responses (assignment_id, employee_reply, status) 
                      VALUES (?, ?, 'Pending')`;

    db.query(insertSql, [assignment_id, employee_reply], (err, result) => {
      if (err) {
        console.error("Error submitting response:", err);
        return res.status(500).send("Error submitting response");
      }

      console.log('Response inserted with ID:', result.insertId);

      // Under Review
      const updateSql = `
        UPDATE feedback f 
        JOIN feedback_assignments fa ON f.id = fa.feedback_id 
        SET f.status = 'Under Review' 
        WHERE fa.id = ?`;

      db.query(updateSql, [assignment_id], (err2) => {
        if (err2) {
          console.error("Failed to update feedback status:", err2);
          return res.status(500).send("Failed to update feedback status");
        }
        console.log('Feedback status updated to Under Review');
        res.json({ 
          message: "Response submitted successfully and sent for HOD review",
          response_id: result.insertId
        });
      });
    });
  });
};

exports.getPendingResponses = (req, res) => {
  const sql = `
    SELECT 
      fr.id as response_id,
      fr.assignment_id,
      fr.employee_reply,
      fr.created_at,
      f.id as feedback_id,
      f.subject,
      f.message,
      f.tracking_key,
      f.status,
      u.name as user_name,
      e.name as employee_name,
      h.name as hod_name
    FROM feedback_responses fr
    JOIN feedback_assignments fa ON fr.assignment_id = fa.id
    JOIN feedback f ON fa.feedback_id = f.id
    JOIN users u ON f.user_id = u.id
    JOIN users e ON fa.employee_id = e.id
    JOIN users h ON fa.hod_id = h.id
    WHERE fr.status = 'Pending'
    ORDER BY fr.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching responses", err);
      return res.status(500).send("Error fetching responses");
    }
    res.json(results);
  });
};

exports.hodApproveResponse = (req, res) => {
  const { response_id, status, hod_comment } = req.body;

  const sql = `
    UPDATE feedback_responses fr
    JOIN feedback_assignments fa ON fr.assignment_id = fa.id
    JOIN feedback f ON fa.feedback_id = f.id
    SET fr.status = ?,
        fr.hod_comment = ?,
        f.status = CASE 
          WHEN ? = 'Approved' THEN 'Completed'
          WHEN ? = 'Rejected' THEN 'In Progress'
          ELSE f.status
        END
    WHERE fr.id = ?
  `;

  db.query(sql, [status, hod_comment, status, status, response_id], (err) => {
    if (err) {
      console.error("Error reviewing response", err);
      return res.status(500).send("Error reviewing response");
    }
    res.json({ 
      message: status === 'Approved' ? 
        "Response approved and sent to user" : 
        "Response rejected and sent back to employee"
    });
  });
};

exports.getUserFeedbacks = (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT 
      f.id,
      f.subject,
      f.message,
      f.category,
      f.status,
      f.tracking_key,
      f.created_at,
      fr.employee_reply,
      fr.status as response_status,
      e.name as employee_name
    FROM feedback f
    LEFT JOIN feedback_assignments fa ON f.id = fa.feedback_id
    LEFT JOIN feedback_responses fr ON fa.id = fr.assignment_id
    LEFT JOIN users e ON fa.employee_id = e.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching user feedbacks", err);
      return res.status(500).send("Error fetching user feedbacks");
    }
    res.json(results);
  });
};

exports.checkEmployeeDetails = (req, res) => {
  const sql = `
    SELECT u.*, 
           COUNT(fa.id) as assignment_count,
           GROUP_CONCAT(f.id) as feedback_ids
    FROM users u
    LEFT JOIN feedback_assignments fa ON u.id = fa.employee_id
    LEFT JOIN feedback f ON fa.feedback_id = f.id
    WHERE u.username = 'emp1'
    GROUP BY u.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error checking employee details:", err);
      return res.status(500).send("Error checking employee details");
    }
    console.log('Employee details:', results);
    res.json(results);
  });
};

exports.checkAllEmployeeAssignments = (req, res) => {
  const sql = `
    SELECT 
      u.id as employee_id,
      u.username,
      u.name as employee_name,
      COUNT(fa.id) as total_assignments,
      GROUP_CONCAT(f.id) as feedback_ids,
      GROUP_CONCAT(f.subject) as feedback_subjects
    FROM users u
    LEFT JOIN feedback_assignments fa ON u.id = fa.employee_id
    LEFT JOIN feedback f ON fa.feedback_id = f.id
    WHERE u.user_type = 'employee'
    GROUP BY u.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error checking employee assignments:", err);
      return res.status(500).send("Error checking employee assignments");
    }
    console.log('Employee assignments:', results);
    res.json(results);
  });
};

exports.getFeedbackByTrackingKey = (req, res) => {
  const { tracking_key } = req.params;
  
  console.log('Received request for tracking key:', tracking_key);

  if (!tracking_key) {
    console.error('No tracking key provided');
    return res.status(400).json({ message: "Tracking key is required" });
  }

  const userSql = `
    SELECT f.user_id, f.id as feedback_id
    FROM feedback f
    WHERE f.tracking_key = ?
  `;

  console.log('Executing user query:', userSql);
  console.log('With parameters:', [tracking_key]);

  db.query(userSql, [tracking_key], (err, userResults) => {
    if (err) {
      console.error("Database error in user query:", err);
      return res.status(500).json({ message: "Error fetching user information", error: err.message });
    }
    
    if (userResults.length === 0) {
      console.log('No feedback found for tracking key:', tracking_key);
      return res.status(404).json({ message: "Feedback not found" });
    }

    const userId = userResults[0].user_id;
    console.log('Found user ID:', userId);

    // tracking status of the feedback
    const feedbackSql = `
      SELECT 
        f.id,
        f.subject,
        f.message,
        f.category,
        f.status,
        f.tracking_key,
        f.created_at,
        f.file,
        u.name as user_name,
        e.name as employee_name,
        fr.employee_reply,
        fr.status as response_status,
        fr.hod_comment,
        fr.created_at as response_date
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN feedback_assignments fa ON f.id = fa.feedback_id
      LEFT JOIN users e ON fa.employee_id = e.id
      LEFT JOIN feedback_responses fr ON fa.id = fr.assignment_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;

    console.log('Executing feedback query:', feedbackSql);
    console.log('With parameters:', [userId]);

    db.query(feedbackSql, [userId], (err2, feedbackResults) => {
      if (err2) {
        console.error("Database error in feedback query:", err2);
        return res.status(500).json({ message: "Error fetching feedback", error: err2.message });
      }

      // Find the specific feedback that matches the tracking key
      const specificFeedback = feedbackResults.find(f => f.tracking_key === tracking_key);
      
      if (!specificFeedback) {
        console.log('No feedback found for tracking key:', tracking_key);
        return res.status(404).json({ message: "Feedback not found" });
      }

      const response = {
        current_feedback: specificFeedback,
        all_feedback: feedbackResults
      };

      console.log('Sending response with current feedback and all user feedback');
      res.json(response);
    });
  });
};

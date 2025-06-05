const db = require('../db');
const path = require('path');
const fs = require('fs');

const generateTrackingKey = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
};

exports.submitFeedback = async (req, res) => {
  try {
    const { name, email, subject, message, category, prNumber } = req.body;
    const file = req.file ? req.file.filename : null;
    const tracking_key = generateTrackingKey();

    console.log('Submitting feedback:', { name, email, subject, message, category, file, prNumber });

    // Validate required fields
    if (!name || !email || !subject || !message || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // First, check if user exists
    const checkUserSql = 'SELECT id FROM users WHERE email = ?';
    const [userResults] = await db.promise().query(checkUserSql, [email]);

    let userId;
    if (userResults.length === 0) {
      // Create new user
      const createUserSql = 'INSERT INTO users (username, email, password, name, user_type) VALUES (?, ?, ?, ?, ?)';
      const username = email.split('@')[0];
      const defaultPassword = 'password123';

      const [result] = await db.promise().query(createUserSql, [username, email, defaultPassword, name, 'employee']);
      userId = result.insertId;
      console.log('Created new user with ID:', userId);
    } else {
      userId = userResults[0].id;
      console.log('Using existing user ID:', userId);
    }

    const sql = `
  INSERT INTO feedback (user_id, subject, message, category, file, tracking_key, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

    const [feedbackResult] = await db.promise().query(sql, [
      userId,
      subject,
      message,
      category,
      file,
      tracking_key,
      'Submitted'
    ]);


    console.log('Feedback inserted with ID:', feedbackResult.insertId);

    res.status(200).json({
      id: feedbackResult.insertId,
      tracking_key: tracking_key,
      message: 'Feedback submitted successfully'
    });

  } catch (err) {
    console.error('Error in submitFeedback:', err);

    // If there was a file uploaded but the operation failed, delete the file
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads', req.file.filename);
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    }

    res.status(500).json({
      message: 'Error submitting feedback',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.getAllFeedbacks = async (req, res) => {
  try {
    const sql = `
      SELECT f.*, u.name as user_name 
      FROM feedback f 
      JOIN users u ON f.user_id = u.id 
      WHERE f.status != 'Assigned'
      ORDER BY f.created_at DESC
    `;

    const [results] = await db.promise().query(sql);
    res.json(results);
  } catch (err) {
    console.error('Failed to fetch feedbacks:', err);
    res.status(500).json({
      message: 'Error fetching feedbacks',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
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

exports.getAssignmentsForEmployee = async (req, res) => {
  try {
    const { employee_id } = req.params;
    
    if (!employee_id) {
      console.log('Employee ID is missing');
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    console.log('Fetching assignments for employee:', employee_id);

    // First verify if the employee exists
    const checkEmployeeSql = 'SELECT id FROM users WHERE id = ? AND user_type = "employee"';
    console.log('Checking employee with SQL:', checkEmployeeSql, [employee_id]);
    
    const [employeeResults] = await db.promise().query(checkEmployeeSql, [employee_id]);
    console.log('Employee check results:', employeeResults);

    if (employeeResults.length === 0) {
      console.log('Employee not found:', employee_id);
      return res.status(404).json({ message: 'Employee not found' });
    }

    // First check if the pr_number column exists
    const checkColumnSql = `
      SELECT COUNT(*) as column_exists 
      FROM information_schema.columns 
      WHERE table_schema = 'feedback_system' 
      AND table_name = 'feedback' 
      AND column_name = 'pr_number'
    `;
    
    const [columnCheck] = await db.promise().query(checkColumnSql);
    console.log('Column check results:', columnCheck);

    const sql = `
      SELECT 
        fa.id as assignment_id,
        f.id as feedback_id,
        f.subject,
        f.message,
        f.category,
        f.file,
        f.tracking_key,
        ${columnCheck[0].column_exists ? 'COALESCE(f.pr_number, "") as pr_number' : '"" as pr_number'},
        f.status,
        u.name as user_name,
        f.created_at,
        fa.assigned_at,
        fr.employee_reply,
        fr.status as response_status,
        fr.hod_comment
      FROM feedback_assignments fa
      JOIN feedback f ON fa.feedback_id = f.id
      JOIN users u ON f.user_id = u.id
      LEFT JOIN feedback_responses fr ON fa.id = fr.assignment_id
      WHERE fa.employee_id = ?
      AND (fr.status IS NULL OR fr.status != 'Rejected')
      AND f.status NOT IN ('Completed', 'Under Review')
      ORDER BY fa.assigned_at DESC
    `;

    console.log('Executing SQL query for employee:', employee_id);
    console.log('SQL:', sql);
    
    const [results] = await db.promise().query(sql, [employee_id]);
    console.log('Query results:', results);
    
    if (!results || results.length === 0) {
      console.log('No assignments found for employee:', employee_id);
      return res.json([]); // Return empty array instead of 404
    }

    res.json(results);
  } catch (err) {
    console.error("Error in getAssignmentsForEmployee:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sqlState: err.sqlState,
      stack: err.stack
    });
    res.status(500).json({ 
      message: 'Error fetching assignments',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
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

    // If no response exists, proceed with insertion
    const insertSql = `INSERT INTO feedback_responses (assignment_id, employee_reply, status) 
                      VALUES (?, ?, 'Pending')`;

    db.query(insertSql, [assignment_id, employee_reply], (err, result) => {
      if (err) {
        console.error("Error submitting response:", err);
        return res.status(500).send("Error submitting response");
      }

      console.log('Response inserted with ID:', result.insertId);

      // Update feedback status to 'Under Review'
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
    AND f.status != 'In Progress'
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

exports.getFeedbackByTrackingKey = async (req, res) => {
  try {
    const { tracking_key } = req.params;
    const sql = `
      SELECT f.*, u.name as user_name 
      FROM feedback f 
      JOIN users u ON f.user_id = u.id 
      WHERE f.tracking_key = ?
    `;

    const [results] = await db.promise().query(sql, [tracking_key]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching feedback by tracking key:', err);
    res.status(500).json({
      message: 'Error fetching feedback',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.getAllAssignedFeedbacks = (req, res) => {
  console.log('Fetching all assigned feedbacks...');
  const sql = `
    SELECT 
      fa.id as assignment_id,
      f.id as feedback_id,
      f.subject,
      f.message,
      f.category,
      f.status,
      f.file,
      f.tracking_key,
      f.pr_number,
      f.created_at,
      fa.assigned_at,
      u.name as user_name,
      e.name as employee_name
    FROM feedback_assignments fa
    JOIN feedback f ON fa.feedback_id = f.id
    JOIN users u ON f.user_id = u.id
    JOIN users e ON fa.employee_id = e.id
    ORDER BY fa.assigned_at DESC
  `;

  console.log('Executing SQL query:', sql);
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching all assigned feedbacks:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        sqlMessage: err.sqlMessage,
        sqlState: err.sqlState
      });
      return res.status(500).send("Error fetching assigned feedbacks");
    }
    console.log('Found assigned feedbacks:', results);
    res.json(results);
  });
};

exports.getReportByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }
    // Fetch feedbacks in the date range
    const sql = `
      SELECT 
      f.id, 
      f.subject, 
      f.status, 
      f.created_at, 
      u.name AS user_name,
      fa.employee_id
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN feedback_assignments fa ON fa.feedback_id = f.id
      WHERE DATE(f.created_at) BETWEEN ? AND ?
      ORDER BY f.created_at DESC;

    `;
    const [results] = await db.promise().query(sql, [start, end]);

    // status  summary
    const summary = {
      total: results.length,
      resolved: results.filter(f => f.status === 'Completed' || f.status === 'Resolved').length,
      in_progress: results.filter(f => f.status === 'In Progress' || f.status === 'Under Review').length,
      pending: results.filter(f => f.status === 'Submitted' || f.status === 'Assigned').length,
    };

    res.json({
      summary,
      reports: results
    });
  } catch (err) {
    console.error('Error fetching report:', err);
    res.status(500).json({ message: 'Error fetching report', error: err.message });
  }
};

DROP DATABASE IF EXISTS feedback_system;
CREATE DATABASE feedback_system;
USE feedback_system;


DROP TABLE IF EXISTS feedback_responses;
DROP TABLE IF EXISTS feedback_assignments;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS users;

-- users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    user_type ENUM('hod', 'employee') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- feedback table
CREATE TABLE feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category ENUM('general', 'query', 'complaint', 'spam') NOT NULL,
    file VARCHAR(255),
    status ENUM('Submitted', 'Assigned', 'Poru pa thambi...', 'Under Review', 'Completed') DEFAULT 'Submitted',
    tracking_key VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- feedback_assignments table
CREATE TABLE feedback_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    feedback_id INT NOT NULL,
    hod_id INT NOT NULL,
    employee_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- feedback_responses table
CREATE TABLE feedback_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    employee_reply TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    hod_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES feedback_assignments(id) ON DELETE CASCADE
);


INSERT INTO users (username, email, password, name, user_type) VALUES
('hod', 'hod1@cpcl.in', 'hod123', 'HOD', 'hod');


INSERT INTO users (username, email, password, name, user_type) VALUES
('emp1', 'emp1@cpcl.in', 'emp123', 'Employee One', 'employee'),
('emp2', 'emp2@cpcl.in', 'emp123', 'Employee Two', 'employee');


UPDATE feedback_assignments SET employee_id = 2 WHERE employee_id = 1; 
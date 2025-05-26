import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserForm from './pages/UserForm';
import HODDashboard from './pages/HODDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import FeedbackStatus from './pages/FeedbackStatus';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children, userType }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user) {
    return <Navigate to="/" />;
  }

  if (userType && user.type !== userType) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<UserForm />} />
          <Route path="/status" element={<FeedbackStatus />} />

          {/* Protected HOD route */}
          <Route 
            path="/hod-dashboard" 
            element={
              <ProtectedRoute userType="hod">
                <HODDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Protected Employee route */}
          <Route 
            path="/employee-dashboard" 
            element={
              <ProtectedRoute userType="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

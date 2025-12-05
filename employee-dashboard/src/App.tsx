// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeForm from './EmployeeForm';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <nav className="navbar navbar-expand navbar-dark bg-dark">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">EmployeeApp</Link>
            <div>
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link" to="/">Home</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/employee-form">Employee Form</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<EmployeeDashboard />} />
            <Route path="/employee-form" element={<EmployeeForm />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;

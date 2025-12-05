// EmployeeForm.tsx
import React, { useState } from 'react';

const EmployeeForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    location: '',
    salary: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Form data is not posted as per requirements.');
  };

  return (
    <div>
      <h2>Employee Form</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name:</label>
          <input type="text" className="form-control" id="name" name="name" value={formData.name} onChange={handleChange} required/>
        </div>
        <div className="mb-3">
          <label htmlFor="designation" className="form-label">Designation:</label>
          <input type="text" className="form-control" id="designation" name="designation" value={formData.designation} onChange={handleChange} required/>
        </div>
        <div className="mb-3">
          <label htmlFor="location" className="form-label">Location:</label>
          <input type="text" className="form-control" id="location" name="location" value={formData.location} onChange={handleChange} required/>
        </div>
        <div className="mb-3">
          <label htmlFor="salary" className="form-label">Salary:</label>
          <input type="number" className="form-control" id="salary" name="salary" value={formData.salary} onChange={handleChange} required/>
        </div>
        <button type="submit" className="btn btn-primary">Submit</button>
      </form>
    </div>
  );
};

export default EmployeeForm;

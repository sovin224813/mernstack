const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Serve frontend build (do not modify dist files)
app.use(express.static(path.join(__dirname + '/dist/Frontend')));

// Middleware
app.use(express.json()); // for parsing application/json

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/employeedb';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

// Employee Schema & Model
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  position: { type: String, required: true },
  salary: { type: Number, required: true },
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);

// Routes

// GET all employees
app.get('/api/employeelist', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET single employee by id
app.get('/api/employeelist/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    console.error('Error fetching employee:', err);
    res.status(400).json({ error: 'Invalid employee id' });
  }
});

// POST - create new employee
// Request body format: {name:'',location:'',position:'',salary:''}
app.post('/api/employeelist', async (req, res) => {
  const { name, location, position, salary } = req.body;
  if (!name || !location || !position || salary === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newEmployee = new Employee({ name, location, position, salary });
    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT - update employee by id
// Request body format: {name:'',location:'',position:'',salary:''}
app.put('/api/employeelist/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updated = await Employee.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Employee not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(400).json({ error: 'Failed to update employee' });
  }
});

// DELETE - delete employee by id
app.delete('/api/employeelist/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Employee.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted', id: deleted._id });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(400).json({ error: 'Failed to delete employee' });
  }
});

//! dont delete this code. it connects the front end file.
// Final catch-all: serve the SPA index. Use app.use to avoid path-to-regexp parsing issues.
app.use(function (req, res) {
  // Serve the SPA index file from the built frontend. Use path.join with
  // components to avoid accidental casing/concat mistakes.
  res.sendFile(path.join(__dirname, 'dist', 'Frontend', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




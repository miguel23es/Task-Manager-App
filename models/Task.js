const mongoose = require('mongoose');

// Define the schema (the shape of a task)
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true // Makes title mandatory
  },
  description: {
    type: String,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: String,
  },
  allDay: {
    type: Boolean,
    default: false
  },
  start: {
    type:String,
    default: ''
  },
  end: {
    type:String,
    default: ''
  },
  startStr: {
    type:String,
    default: ''
  },
  endStr: {
    type: String,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true});

// Create the model
const Task = mongoose.model('Task', taskSchema);

// Export it so you can use it in your routes
module.exports = Task;

const mongoose = require('mongoose');

// Define the schema (the shape of a task)
const tabSchema = new mongoose.Schema({
  title: {
    type: String,
    default: null // Makes title mandatory
  },
  notes: {
    type: [String],
    default: []
  },
}, { timestamps: true});

// Create the model
const Tab = mongoose.model('Tab', tabSchema);

// Export it so you can use it in your routes
module.exports = Tab;


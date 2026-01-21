const mongoose = require('mongoose');

const tabSchema = new mongoose.Schema({
  id:{
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: '',
  }
}, { timestamps: true });

const Tab = mongoose.model('Tab', tabSchema);

module.exports = Tab;



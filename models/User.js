const mongoose = require ('mongoose');
const bcrypt = require('bcrypt');

// Schema for the user
const userSchema = new mongoose.Schema ({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        require: true,
        minlength: 8
    },
    avatarUrl: {
        type: String,
        default: '/img/default-avatar.png'
    }
}, { timestamps: true});

// Hashing the password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password during login
userSchema.methods.comparePassword = function (userPassword) {
    return bcrypt.compare(userPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
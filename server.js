// MongoDB set-up
const mongoose = require('mongoose');

// Cloudinary set-up
const cloudinary = require("./cloudinary");
const streamifier = require("streamifier");

// Replace the string below with your actual connection string
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// models
const Task = require('./models/Task');
const User = require('./models/User');

// Node.js, express and JSON set-up
const express = require('express');
const path = require('path');
const { error } = require('console');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Avatar file upload 
const multer = require("multer");

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Please upload an image"));
    }
    cb(null, true);
  }
});

// Route for Avatar 
app.post("/users/:userId/avatar", upload.single("avatar"), async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    // Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "avatars", public_id: userId },
      async (error, result) => {
        if (error) return res.status(500).json({ error: "Upload failed" });

        // Save Cloudinary URL to MongoDB
        user.avatarUrl = result.secure_url;
        await user.save();

        res.json({ avatarUrl: result.secure_url });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Avatar upload failed" });
  }
});

// Get user info
app.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.json({ username: user.username, avatarUrl: user.avatarUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Routes for user authentication
const bcrypt = require('bcrypt');

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
      // If login is successful
      res.status(200).json({
          message: 'Login successful',
          _id: user._id,
          username: user.username
      });
  } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
  
});
// Creates the user
app.post('/users', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const newUser = new User({ username, email, password });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

// Deletes account 
app.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try{
    await Task.deleteMany({ user: userId});
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User and tasks deleted successfully'});
  } catch (error){
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Gets number of taks for the user 
app.get("/tasks/count/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const count = await Task.countDocuments({ user: userId });

    console.log("Task count for user", userId.toString(), "=", count);

    res.json({ totalTasks: count });
  } catch (err) {
    console.error("Count error:", err);
    res.status(500).json({ error: "Failed to count tasks" });
  }
});

// Routes for CRUD of tasks

  // GET route
  app.get('/tasks', async (req, res) => {
    const userId = req.query.user;

    if (!userId || userId == 'null') {
    return res.status(400).json({ error: 'Missing userId in query' });
    }

    try{
      const tasks = await Task.find({ user: userId})
      .sort({ dueDate: 1 });
      res.json(tasks);
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // POST Route
  app.post('/tasks', async (req, res) => {
    const { title, description, user, dueDate, allDay, start, end, startStr, endStr } = req.body;
  
    if (!title) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
  
    try {
      const newTask = new Task({ title, description, user, dueDate, allDay, start, end, startStr, endStr });
      const savedTask = await newTask.save();
      res.status(201).json(savedTask);
    } catch (err) {
      console.error('Error saving task:', err);
      res.status(500).json({ error: 'Failed to save task' });
    }
  });

  // PUT Route
  app.put('/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    const { description} = req.body;
    
    try{
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { description },
        {new: true, runValidators: true}
      );

      if(!updatedTask){
        return res.status(404).json({ eroor: "Task not found. " });
      }

      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE Route
  app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const deletedTask = await Task.findByIdAndDelete(id);

      if(!deletedTask){
        return res.status(404).json({error: 'Task not found.'});
      }

      res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
// Routes for tabs and notes
const Tab = require("./models/Tab");

//Post Route
  app.post('/tab', async (req, res) => {
    const { id, title, note, user } = req.body;

    if (!user || user === 'null') {
      return res.status(400).json({ error: 'Missing userId in request' });
    }

    try {
      // Try to find existing tab with this id for this user
      let tab = await Tab.findOne({ id, user });
      if (tab) {
      // Add new note to existing notes array
      tab.notes = note;
    } else {
      // Create new tab with first note
      tab = new Tab({ id, title, notes: note, user });
    }
      const savedTab = await tab.save();
      res.status(201).json(savedTab);
    } catch (err) {
      console.error('Error saving tab:', err);
      res.status(500).json({ error: 'Failed to save Tab' });
    }
  });

// PUT route for the tab note
app.put('/tab/:id', async (req, res) => {
  const tabId = req.params.id;
  const { note, user } = req.body;

  if (!user || user === 'null') {
    return res.status(400).json({ error: 'Missing userId in request' });
  }

  try {
    const updateFields = { notes: note };

    const updatedTab = await Tab.findOneAndUpdate(
      { id: tabId, user },
       updateFields,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json(updatedTab);
  } catch (err) {
    console.error("Error updating/creating tab:", err);
    res.status(500).json({ error: "Failed to update or create tab" });
  }
});
// PUT route for tab title
app.put('/tabs/:id', async (req, res) => {
    const tabId = req.params.id;
    const { title, user } = req.body;

    if (!user || user === 'null') {
      return res.status(400).json({ error: 'Missing userId in request' });
    }

    try{
      const updatedTab = await Tab.findOneAndUpdate(
        { id: tabId, user },
        { title },
        {new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true}
      );

      res.json(updatedTab);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


// GET route for notes
app.get('/tabs', async (req, res) => {
    const tabId = req.query.id;
    const userId = req.query.user;

    if (!userId || userId === 'null') {
      return res.status(400).json({ error: 'Missing userId in query' });
    }

    const tab = await Tab.find({ id: tabId, user: userId });
    res.json(tab);
});

  // Listen
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });





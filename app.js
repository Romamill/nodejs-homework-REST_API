

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const contactsRouter = require('./routes/api/contacts');
const usersRouter = require('./routes/api/users');
const multer = require('multer');
const User = require('./models/userModel');
const usersController = require('./Controllers/usersController');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());

mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Database connection successful');
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });

app.use('/api/contacts', contactsRouter);
app.use('/api/users', usersRouter);


app.get('/api/users/verify/:verificationToken', usersController.verifyUser);

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.patch('/api/users/avatars', upload.single('avatar'), async (req, res) => {
  const userId = req.user._id;

  if (req.file) {
    const { filename } = req.file;
    const avatarURL = `/avatars/${filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { avatarURL },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ avatarURL });
  } else {
    return res.status(400).json({ message: 'No file uploaded' });
  }
});

module.exports = app;

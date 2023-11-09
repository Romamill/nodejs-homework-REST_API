

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { jwtSecret } = require('../config');
const gravatar = require('gravatar');
const multer = require('multer');
const jimp = require('jimp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const upload = multer({
  dest: 'tmp',
});

const registerUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'Email in use' });
    }

    const avatarURL = gravatar.url(email, { s: '250', d: 'retro' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    const newUser = await User.create({
      email,
      password: hashedPassword,
      avatarURL,
      verificationToken,
    });

    sendVerificationEmail(email, verificationToken);

    return res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
        verify: newUser.verify,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Email or password is wrong' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email or password is wrong' });
    }

    if (!user.verify) {
      return res.status(401).json({ message: 'Email is not verified' });
    }

    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1h' });

    user.token = token;
    await user.save();

    return res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
        verify: user.verify,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const logoutUser = async (req, res) => {
  req.user.token = null;
  await req.user.save();
  return res.status(204).send();
};

const getCurrentUser = (req, res) => {
  return res.status(200).json({
    email: req.user.email,
    subscription: req.user.subscription,
    avatarURL: req.user.avatarURL,
    verify: req.user.verify,
  });
};

const updateUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Avatar is required' });
    }

    const { user } = req;
    const uploadedAvatar = req.file;
    const avatarName = `${user._id}-${Date.now()}-${uploadedAvatar.originalname}`;

    const imagePath = path.join('public/avatars', avatarName);

    const image = await jimp.read(uploadedAvatar.path);
    await image.cover(250, 250).write(imagePath);

    user.avatarURL = `/avatars/${avatarName}`;
    await user.save();

    return res.status(200).json({ avatarURL: user.avatarURL });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.SERVER_URL}/api/users/verify/${token}`;

  const msg = {
    to: 'romamill666@gmail.com',
    from: process.env.SENDER_EMAIL,
    subject: 'Email Verification',
    text: `Click on the link to verify your email: ${verificationLink}`,
    html: `<p>Click <a href="${verificationLink}">here</a> to verify your email</p>`,
  };

  await sgMail.send(msg);
};

const verifyUser = async (req, res) => {
  const { verificationToken } = req.params;

  try {
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verificationToken = null;
    user.verify = true;
    await user.save();

    return res.status(200).json({ message: 'User successfully verified' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserAvatar,
  upload,
  verifyUser,
};

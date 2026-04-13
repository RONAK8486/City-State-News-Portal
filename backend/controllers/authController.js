const User = require('../models/User');
const OtpToken = require('../models/OtpToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendWelcomeEmail, sendOtpEmail } = require('../utils/sendEmail');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Await sending specifically to instantly pull the demo Ethereal URL for the user frontend 
    let previewUrl = null;
    try {
      previewUrl = await sendWelcomeEmail(user);
    } catch (err) {
      console.error("Async Email Dispatcher Error:", err);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      previewUrl,
      message: 'Registration successful. Please sign in to continue.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites', 'title slug image');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, avatar },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register admin (protected - only existing admin can create)
// @route   POST /api/auth/register-admin
// @access  Private/Admin
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register admin publicly (temporary/setup)
// @route   POST /api/auth/register-admin-public
// @access  Public
exports.registerAdminPublic = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register publisher (protected - only admin can create)
// @route   POST /api/auth/register-publisher
// @access  Private/Admin
exports.registerPublisher = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'publisher'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all publishers
// @route   GET /api/auth/publishers
// @access  Private/Admin
exports.getPublishers = async (req, res) => {
  try {
    const publishers = await User.find({ role: 'publisher' }).select('-password');

    res.status(200).json({
      success: true,
      count: publishers.length,
      data: publishers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════
// FORGOT PASSWORD — OTP FLOW
// ═══════════════════════════════════════════════════════════

// @desc    Step 1 — Request OTP (send to email)
// @route   POST /api/auth/request-otp
// @access  Public
exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    // ── Rate limit: max 3 OTP requests per hour per email ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await OtpToken.findOne({ email, windowStart: { $gte: oneHourAgo } });

    if (existing) {
      if (existing.requestCount >= 3) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Please try again after 1 hour.'
        });
      }
      // Increment count in the same window
      await OtpToken.updateMany(
        { email, windowStart: { $gte: oneHourAgo } },
        { $inc: { requestCount: 1 } }
      );
    }

    // ── Look up user ──
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Email id is not registered.' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Hash it — never store plain OTP
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Delete any existing OTP for this email
    await OtpToken.deleteMany({ email: email.toLowerCase() });

    // Store new OTP record
    await OtpToken.create({
      email: email.toLowerCase(),
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0,
      isUsed: false,
      requestCount: 1,
      windowStart: new Date(),
      ipAddress: ip
    });

    // Send email (fire-and-forget — don't expose errors to client)
    sendOtpEmail(email, otp).catch(err => console.error('OTP email send failed:', err.message));

    return res.status(200).json({ success: true, message: 'OTP sent successfully to your email.' });

  } catch (error) {
    console.error('requestOtp error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// @desc    Step 2 — Verify OTP & return short-lived reset token
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const record = await OtpToken.findOne({
      email: email.toLowerCase(),
      isUsed: false
    });

    // Generic error for security
    const INVALID_MSG = 'Invalid or expired OTP.';

    if (!record) return res.status(400).json({ success: false, message: INVALID_MSG });

    // Check expiry
    if (record.expiresAt < new Date()) {
      await OtpToken.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts
    if (record.attempts >= 3) {
      await OtpToken.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    // Verify hash
    const isMatch = await bcrypt.compare(otp, record.otpHash);

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      const remaining = 3 - record.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
      });
    }

    // ── OTP correct — mark as used & issue short-lived reset token ──
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    record.isUsed = true;
    record.resetToken = resetTokenHash;
    record.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await record.save();

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken // plain token sent to client, hash stored in DB
    });

  } catch (error) {
    console.error('verifyOtp error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// @desc    Step 3 — Reset password using verified reset token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, reset token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Hash the incoming token and compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const record = await OtpToken.findOne({
      email: email.toLowerCase(),
      isUsed: true,
      resetToken: resetTokenHash,
      resetTokenExpiresAt: { $gt: new Date() }
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset session. Please start over.' });
    }

    // Find user & update password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid request.' });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    // Clean up the OTP record
    await OtpToken.deleteOne({ _id: record._id });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });

  } catch (error) {
    console.error('resetPasswordWithOtp error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

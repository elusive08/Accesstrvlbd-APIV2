
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ================= REGISTER ================= */

      







exports.register = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    name = name.trim();
    email = email.trim().toLowerCase();

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const otp = generateOTP();

    const user = await User.create({
      name,
      email,
      password,
      emailOTP: otp,
      emailOTPExpires: Date.now() + 10 * 60 * 1000,
    });

    try {
      await sendEmail({
        to: email,
        subject: "Verify your email - ACCESS-TRAVEL",
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      });
    } catch (err) {
      console.error("Email failed:", err.message);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful. Check your email for OTP.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};











/* ================= VERIFY EMAIL ================= */
exports.verifyEmail = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({
      email,
      emailOTP: otp,
      emailOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.isEmailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error("Verify error:", err);
    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or email not verified",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};



exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
    emailOTP: otp,
    emailOTPExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP"
    });
  }

  user.isEmailVerified = true;
  user.emailOTP = undefined;
  user.emailOTPExpires = undefined;
  await user.save();

  return res.json({
    success: true,
    message: "Email verified successfully"
  });
};





/* ================= ME ================= */
exports.me = async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (user) {
      const otp = generateOTP();
      user.resetPasswordOTP = otp;
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      await sendEmail({
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      });
    }

    return res.json({
      success: true,
      message: "If that email exists, an OTP has been sent",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({
      success: false,
      message: "Request failed",
    });
  }
};

/* ================= RESET PASSWORD ================= */
exports.changePassword = async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({
      success: false,
      message: "Reset failed",
    });
  }
};
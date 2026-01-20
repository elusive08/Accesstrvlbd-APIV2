
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP email function
// const sendOTPEmail = async (email, otp) => {
//   const msg = {
//     to: email,
//     from: process.env.SENDGRID_FROM_EMAIL,
//     subject: 'Your OTP Code - ACCESS-TRAVEL',
//     text: `Your OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
//     html: `
//       <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
//         <h2 style="color: #333;">Your OTP Code</h2>
//         <p>Your OTP code is:</p>
//         <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px;">
//           <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${otp}</span>
//         </div>
//         <p style="margin-top: 20px;">This code will expire in <strong>10 minutes</strong>.</p>
//         <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
//       </div>
//     `
//   }
// };
  







//Send OTP email function
const sendOTPEmail = async (email, otp) => {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Your OTP Code - ACCESS-TRAVEL',
    text: `Your OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p>Your OTP code is:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px;">
          <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${otp}</span>
        </div>
        <p style="margin-top: 20px;">This code will expire in <strong>10 minutes</strong>.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };

  try {
    console.log('Attempting to send email to:', email);
    console.log('From:', process.env.SENDGRID_FROM_EMAIL);
    console.log('SendGrid API Key exists:', !!process.env.SENDGRID_API_KEY);
    
    await sgMail.send(msg);
    console.log('✅ Email sent successfully to:', email);
  } catch (error) {
    console.error('❌ SendGrid Error:', error.response?.body || error.message);
    throw error;
  }
};
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
      await sendOTPEmail(email, otp);
      console.log("Verification email sent successfully");
    } catch (err) {
      console.error("Email failed:", err.message);
      // Continue even if email fails - user can request resend
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful. Check your email or check your spam folder for OTP.",
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

      try {
        await sendOTPEmail(email, otp);
      } catch (err) {
        console.error("Password reset email failed:", err);
        // Continue even if email fails
      }
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
exports.resetPassword = async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
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

    user.password = newPassword;
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

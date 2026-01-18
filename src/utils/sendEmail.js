const sgMail = require('@sendgrid/mail');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

//   try {
//     await sgMail.send(msg);
//     console.log('OTP email sent successfully to:', email);
//   } catch (error) {
//     console.error('SendGrid Error:', error);
//     if (error.response) {
//       console.error(error.response.body);
//     }
//     throw new Error('Failed to send OTP email');
//   }
// };

module.exports = sendOTPEmail;

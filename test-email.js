require('dotenv').config();
const sendEmail = require('./src/utils/sendEmail'); // Adjust path if needed

const test = async () => {
  try {
    console.log("Attempting to send test email...");
    await sendEmail({
      to: "elusive4dev@gmail.com", 
      subject: "SMTP Test",
      text: "If you see this, your email config is working!"
    });
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Email failed!");
    console.error(error);
  }
};

test();

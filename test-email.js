require('dotenv').config();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'aderetitaiwo614@gmail.com', // Change this to your email
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'Test Email',
  text: 'If you receive this, SendGrid is working!',
};

sgMail.send(msg)
  .then(() => {
    console.log('✅ Email sent successfully!');
  })
  .catch((error) => {
    console.error('❌ Error:', error.response?.body || error);
  });
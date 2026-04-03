const nodemailer = require('nodemailer');
const { EmailLog } = require('../models');
require('dotenv').config();

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendEmail = async (toEmail, subject, body, emailType = 'Other', userId = null) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: subject,
      html: body
    };

    const info = await transporter.sendMail(mailOptions);

    // Log the email
    await EmailLog.create({
      user_id: userId,
      to_email: toEmail,
      subject: subject,
      body: body,
      email_type: emailType,
      status: 'Sent'
    });

    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);

    // Log the failed email
    try {
      await EmailLog.create({
        user_id: userId,
        to_email: toEmail,
        subject: subject,
        body: body,
        email_type: emailType,
        status: 'Failed',
        error_message: error.message
      });
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }

    throw error;
  }
};

const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConnection
};

// src/services/notification.service.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587, 
        secure: false, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
        <div style="padding: 20px; border-bottom: 2px solid #eee;">
          <img 
            src="https://i.ibb.co/sJCvwQGT/Delivery-Rider-Logo-for-Dev-Go-removebg-preview.png" 
            alt="Courier App Logo" 
            style="width: 150px; height: auto;"
          />
        </div>
        <div style="padding: 20px;">
          <h2>${options.subject}</h2>
          <p style="white-space: pre-wrap; text-align: left; line-height: 1.6;">${options.message}</p>
          <br>
          <p>Thank you for using our service!</p>
        </div>
        <div style="padding: 10px; font-size: 12px; color: #777; background-color: #f4f4f4;">
          © 2025 DevGo App. All rights reserved.
        </div>
      </div>
    `;
    

    const mailOptions = {
        from: `Courier App <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message, 
        html: emailHtml     
    };

    
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
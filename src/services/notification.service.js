// src/services/notification.service.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Transporter banayein (woh service jo email bhejti hai)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587, // Standard port for SMTP
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // 1. Email ke liye HTML template banao
    // Ismein humne aapke logo ke liye <img> tag daala hai
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
    // ------------------------------------------

    // 2. Email ke options define karo
    const mailOptions = {
        from: `Courier App <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message, // Yeh plain text version hai, un clients ke liye jo HTML support nahi karte
        html: emailHtml     // Yeh naya HTML version hai
    };

    // 3. Asal mein email bhejo
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
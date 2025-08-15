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

    // 2. Email ke options define karein
    const mailOptions = {
        from: `Courier App <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: '<b>Hello world?</b>' // Aap HTML email bhi bhej sakte hain
    };

    // 3. Asal mein email bhejein
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

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
  const templatePath = path.join(
    __dirname,
    `../templates/${options.template}.hbs`
  );
  const templateSource = fs.readFileSync(templatePath, "utf8");
  const compiledTemplate = handlebars.compile(templateSource);
  const finalHtml = compiledTemplate({
    logoUrl: "https://i.ibb.co/wrZ3VgdX/Delivery-Rider-Logo-for-Dev-Go.png",
    ...options.data,
  });
  const mailOptions = {
    from: `DevGo <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: finalHtml,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

// emailService.js

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey('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');

// Function to send an email
const sendEmail = (to, subject, body) => {
  const msg = {
    to: to,  // Recipient's email
    from: 'johnniebre1995@gmail.com',  // Your SendGrid verified sender email
    subject: subject,  // Email subject
    text: body,  // Email body (plain text)
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent successfully');
    })
    .catch((error) => {
      console.error('Error sending email:', error);
    });
};

module.exports = sendEmail;

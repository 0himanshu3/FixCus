import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends an email using SendGrid
 * @param {Object} params
 * @param {string} params.email - recipient email
 * @param {string} params.subject - email subject
 * @param {string} params.message - HTML message
 */
export const sendEmail = async ({ email, subject, message }) => {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html: message,
  };

  try {
    const info = await sgMail.send(msg);
    return info; // similar to nodemailer
  } catch (err) {
    console.error("SendGrid error:", err.response?.body || err.message);
    throw new Error(`Failed to send email: ${err.message}`);
  }
};

import nodeMailer from "nodemailer";

const DEFAULT_TIMEOUT = 15_000; // ms

export const sendEmail = async ({ email, subject, message }) => {
  // Parse numeric port if present
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const hasService = !!process.env.SMTP_SERVICE;
  const secure = port === 465; // secure true for SMTPS (465)

  // Build transporter options intelligently:
  const baseOptions = hasService
    ? {
        service: process.env.SMTP_SERVICE,
        auth: {
          user: process.env.SMTP_MAIL,
          pass: process.env.SMTP_PASSWORD,
        },
        ...(port ? { port, secure } : {}),
      }
    : {
        host: process.env.SMTP_HOST,
        port: port || 587,
        secure, // true for 465, false for 587 (STARTTLS)
        requireTLS: port === 587 || port === undefined,
        auth: {
          user: process.env.SMTP_MAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      };

  // Add timeouts & connection options
  const transporterOptions = {
    ...baseOptions,
    connectionTimeout:  DEFAULT_TIMEOUT,
    greetingTimeout:  DEFAULT_TIMEOUT,
    socketTimeout:  DEFAULT_TIMEOUT,
  };

  const transporter = nodeMailer.createTransport(transporterOptions);

  // Helpful verify + clear error messaging for logs
  try {
    await transporter.verify();
    // console.log("SMTP verify ok");
  } catch (err) {
    // Common cause: ETIMEDOUT (network/port blocked), ECONNREFUSED, auth failures, DNS
    console.error("SMTP verify failed:", err && err.code, err && err.message);
    // Re-throw with a clearer message so the Render logs show actionable info
    throw new Error(
      `SMTP verify failed: ${err && err.code} - ${err && err.message}. ` +
      `Check SMTP_HOST/PORT/SERVICE, credentials and that your cloud host allows outbound SMTP.`
    );
  }

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html: message,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // console.log('Message sent: ', info.messageId);
    return info;
  } catch (err) {
    console.error("sendMail error:", err && err.code, err && err.message);
    throw err; // let caller handle/log; Render logs will contain details
  }
};

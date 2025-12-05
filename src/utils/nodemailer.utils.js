const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Dummy transporter so existing code won't break.
// It will NOT be used for sending emails.
const transporter = {
  verify: (cb) => cb?.(null, true),
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const result = await resend.emails.send({
      from: `Brgy. Santa Monica Services <${process.env.RESEND_MAIL}>`,
      to,
      subject,
      html,
    });

    console.log("[RESEND] Email result:", result);
    return result;
  } catch (error) {
    console.error("[RESEND] Email sending failed:", error);
    throw new Error(error.message);
  }
};

module.exports = { transporter, sendEmail };

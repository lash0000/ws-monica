const EmailTemplate = require("../../utils/email_template.utils");
const { sendEmail } = require("../../utils/nodemailer.utils");
const mdl_UserCredentials = require("../user_creds/user_creds.mdl");

class EmailService {
  /**
   * Send email to a user using user_id lookup
   */
  static async sendToUser({ user_id, template, data = {}, subject }) {
    try {
      const creds = await mdl_UserCredentials.findOne({ where: { user_id } });

      if (!creds?.email) {
        console.warn("EmailService: User has no email:", user_id);
        return;
      }

      const rendered = await EmailTemplate.as_renderAll(template, {
        ...data,
        subject
      });

      await sendEmail({
        to: creds.email,
        subject: rendered.subject,
        html: rendered.html
      });

      console.log(`Background email sent to ${creds.email} using template: ${template}`);

    } catch (err) {
      console.error("EmailService error:", err);
    }
  }

  /**
   * Send event announcement to a raw email address.
   *
   * @param {Object} opts
   * @param {String} opts.email - Recipient email
   * @param {Object} opts.event - Event object (category, title, description, etc.)
   */
  static async sendEventAnnouncement({ email, event }) {
    try {
      if (!email) {
        console.warn("EmailService: No email provided for event announcement");
        return;
      }

      const rendered = await EmailTemplate.as_renderAll("events", {
        event,
        subject: `Upcoming Event: ${event.title}`
      });

      await sendEmail({
        to: email,
        subject: rendered.subject,
        html: rendered.html
      });

      console.log(`Event announcement sent to ${email}`);

    } catch (err) {
      console.error("sendEventAnnouncement error:", err);
    }
  }
}

module.exports = EmailService;

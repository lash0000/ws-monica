const EmailTemplate = require("../../utils/email_template.utils");
const { sendEmail } = require("../../utils/nodemailer.utils");
const mdl_UserCredentials = require("../user_creds/user_creds.mdl");

class EmailService {
  /**
   * Decoupling function.
   *
   * @param {Object} options
   * @param {String} options.user_id - Target user that will receive the email
   * @param {String} options.template - Template folder name inside /templates
   * @param {Object} options.data - Variables passed to the template renderer
   * @param {String} options.subject - Final subject that will be used
   */
  static async sendToUser({ user_id, template, data = {}, subject }) {
    try {
      const creds = await mdl_UserCredentials.findOne({
        where: { user_id }
      });

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
}

module.exports = EmailService;

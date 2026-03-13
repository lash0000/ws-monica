const automationService = require("./automation.srv");

class AutomationController {
  constructor() {
    this.automationService = automationService;
    this.runPrompt = this.runPrompt.bind(this);
  }

  async runPrompt(req, res) {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({
          error: "Prompt is required"
        });
      }

      const result = await this.automationService.askModel(prompt);

      return res.json({
        prompt,
        result
      });

    } catch (err) {
      console.error("Automation error:", err.message);

      return res.status(500).json({
        error: "AI processing failed"
      });
    }
  }

}

module.exports = new AutomationController();

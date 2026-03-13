const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { OLLAMA_URL } = require("../../../config/db.config");

class AutomationService {

  constructor() {
    const filePath = path.resolve(__dirname, "../../utils/ollama_prompt.txt");
    this.promptTemplate = fs.readFileSync(filePath, "utf8");

    // dataset for UI sections
    this.sections = [
      "Header",
      "Navigation",
      "Hero / Landing Section",
      "Main Content Area",
      "Call-To-Action (CTA)",
      "Content Sections",
      "Forms",
      "Media Elements",
      "Feedback / Status UI",
      "Footer"
    ];

    // dataset for page categories
    this.categories = [
      "landing_page",
      "documentation",
      "tutorial",
      "blog",
      "product_page",
      "dashboard",
      "profile",
      "faq",
      "marketing"
    ];
  }

  buildPrompt(userPrompt) {

    const sectionsText = this.sections
      .map((s, i) => `${i + 1}. ${s}`)
      .join("\n");

    const categoriesText = this.categories.join("\n");

    const injectedContext = `
Possible Page Categories:
${categoriesText}

Possible Web Sections:
${sectionsText}

User Request:
${userPrompt}
`;

    return this.promptTemplate.replace(
      "{{USER_PROMPT}}",
      injectedContext
    );
  }

  async askModel(prompt) {

    const fullPrompt = this.buildPrompt(prompt);

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: "llama3.2:3b",
      prompt: fullPrompt,
      stream: false
    });

    return response.data.response;
  }

}

module.exports = new AutomationService();

const axios = require("axios");
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

const checkOllamaConnection = async () => {
  try {
    const res = await axios.get(`${OLLAMA_URL}/api/tags`);

    console.log("Ollama connection succeeded");
    console.log(`Ollama URL: ${OLLAMA_URL}`);
    console.log(`Available models: ${res.data.models?.length || 0}`);

  } catch (error) {
    console.error("Ollama connection failed");
    console.error(error.message);
  }
};

module.exports = {
  OLLAMA_URL,
  checkOllamaConnection
};

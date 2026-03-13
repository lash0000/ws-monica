// root application
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { checkOllamaConnection } = require("./config/db.config");

dotenv.config();
const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  cors({
    origin: [
      "",
    ],
    credentials: true
  })
);

app.use(cookieParser());
app.get("/", (req, res) => {
  res.json({
    project_name: "Ai shite",
    project_details: "Ollama reasoning engine.",
    version: "v0"
  });
});

// routes
const routes = require("./src/utils/routes.utils");
app.use("/api", routes);

checkOllamaConnection();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

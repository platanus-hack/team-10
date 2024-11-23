const express = require("express");
const ClaudeController = require("../controllers/claudeController");
const router = express.Router();

// Initialize ClaudeController with your API key
const apiKey = process.env.ANTHROPIC_API_KEY;
const claudeController = new ClaudeController(apiKey);

// Define the route for sending a prompt
router.post("/send-prompt", (req, res) => claudeController.sendPrompt(req, res));

module.exports = router;

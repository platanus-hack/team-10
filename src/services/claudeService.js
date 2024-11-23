const { Anthropic } = require("@anthropic-ai/sdk");

class ClaudeService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error("API key is required to initialize ClaudeService");
        }
        this.client = new Anthropic(apiKey);
    }

    // /**
    //  * Sends a prompt to Claude and gets a response.
    //  * @param {string} prompt - The input prompt.
    //  * @param {Object} options - Optional parameters.
    //  * @param {number} options.maxTokensToSample - Max tokens to generate.
    //  * @param {string} options.model - The Claude model to use.
    //  * @returns {Promise<string>} - The response from Claude.
    //  */
    
    async sendPrompt(human_msg) {
        const message = await client.messages.create({
            max_tokens: 1024,
            messages: [{ role: 'user', content: human_msg }],
            model: "claude-3-5-sonnet-20241022",
          });

        return message;
    }
}

module.exports = ClaudeService;

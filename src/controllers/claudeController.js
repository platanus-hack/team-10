import ClaudeService from "../services/claudeService";
// Client


class ClaudeController {
    constructor(apiKey) {
        this.claudeService = new ClaudeService(apiKey);
    }

    /**
     * Handles incoming requests to send a prompt to Claude.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    // sendPrompt is a human message to send to Claude
    async sendPrompt(msg) {
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }
        try {
            const response = await this.claudeService.sendPrompt(msg.body);
            res.status(200).json({ response });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }
    // async sendPrompt(req, res) {
    //     const { prompt, maxTokensToSample, model } = req.body;

    //     if (!prompt) {
    //         return res.status(400).json({ error: "Prompt is required" });
    //     }

    //     try {
    //         const response = await this.claudeService.sendPrompt(prompt, {
    //             maxTokensToSample,
    //             model,
    //         });
    //         res.status(200).json({ response });
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ error: error.message });
    //     }
    // }
}

export default ClaudeController;

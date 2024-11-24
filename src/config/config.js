require('dotenv').config();

export default {
    claude: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-latest',
        maxTokens: 1024,
        temperature: 0.7
    },
};
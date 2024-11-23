require('dotenv').config();

module.exports = {
    claude: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-opus-20240229',
        maxTokens: 1024,
        temperature: 0.7
    },
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost/sobuddy',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },
};
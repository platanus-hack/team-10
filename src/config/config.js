require('dotenv').config();

export default {
    claude: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-latest',
        maxTokens: 1024,
        temperature: 0.7,
        system: "Eres un compañero de apoyo por WhatsApp para personas trabajando en su relación con el alcohol. Mantienes un tono cercano y natural, como un amigo comprensivo que sabe escuchar.",
    },
};
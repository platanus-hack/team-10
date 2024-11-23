const app = require('./app');
const WhatsAppBot = require('./services/whatsapp-bot');

// Initialize WhatsApp bot
const whatsappBot = new WhatsAppBot();
whatsappBot.initialize();

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

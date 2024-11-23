const app = require('./app');
const WhatsAppBot = require('./services/whatsappBot');
const prisma = require('./lib/prisma');

// Initialize WhatsApp bot
const whatsappBot = new WhatsAppBot();
whatsappBot.initialize();

// Server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing HTTP server and database connections...');
    
    await Promise.all([
        new Promise(resolve => server.close(resolve)),
        prisma.$disconnect()
    ]);
    
    console.log('Server and database connections closed.');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received. Closing HTTP server and database connections...');
    
    await Promise.all([
        new Promise(resolve => server.close(resolve)),
        prisma.$disconnect()
    ]);
    
    console.log('Server and database connections closed.');
    process.exit(0);
});

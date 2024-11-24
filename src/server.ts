import prisma from './lib/prisma';
import WhatsAppBot from './services/whatsappBot';
const app = require('./app');

async function main() {
    try {
        // Connect to Prisma
        await prisma.$connect();
        console.log('Database connected successfully');
        
        // Initialize WhatsApp bot
        const whatsappBot = new WhatsAppBot();
        await whatsappBot.initialize();
        
        // Start your server
        const port = process.env.PORT || 3000;
        const server = app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
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

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });

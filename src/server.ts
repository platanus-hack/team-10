import prisma from './lib/prisma';
import WhatsAppBot from './services/whatsappBot';
import { SchedulerService } from './services/schedulerService';
import { HolidayService } from './services/holidayService';
import { CheckInService } from './services/checkInService';

async function main() {
    try {
        // Connect to Prisma
        await prisma.$connect();
        console.log('Database connected successfully');
        
        // Initialize WhatsApp bot
        const whatsappBot = new WhatsAppBot();
        await whatsappBot.initialize();
        
        // Initialize services
        const holidayService = new HolidayService(whatsappBot.client);
        const checkInService = new CheckInService(whatsappBot.client);
        
        const scheduler = new SchedulerService(
            holidayService,
            checkInService,
            whatsappBot.messageController.getActiveConversations()
        );
        
        // Start scheduled tasks
        scheduler.startScheduledTasks();
        
        console.log('Application started successfully');
        
        // Graceful shutdown
        const shutdown = async () => {
            console.log('Shutdown signal received. Closing connections...');
            await prisma.$disconnect();
            console.log('Database connections closed.');
            process.exit(0);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
}

main();

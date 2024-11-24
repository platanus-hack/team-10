import { PrismaClient } from '@prisma/client';
import { type Holiday, holidays } from '../data/holidays';
import { Client as WhatsappClient } from 'whatsapp-web.js';
import ClaudeHandler from '../handlers/claudeHandler';
import generateUserContext from '../utils/generateUserContext';

export class HolidayService {
    private prisma: PrismaClient;
    private whatsappClient: WhatsappClient;

    constructor(whatsappClient: WhatsappClient) {
        this.prisma = new PrismaClient();
        this.whatsappClient = whatsappClient;
    }

    private formatDate(date: Date): string {
        return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    private getUpcomingHolidays(): Holiday[] {
        const today = new Date();
        const twoDaysFromNow = new Date(today);
        twoDaysFromNow.setDate(today.getDate() + 2);

        const todayFormatted = this.formatDate(today);
        const twoDaysFormatted = this.formatDate(twoDaysFromNow);

        return holidays.filter(holiday => 
            holiday.date === todayFormatted || holiday.date === twoDaysFormatted
        );
    }

    public async checkHolidays(activeConversations: Map<string, any>): Promise<void> {
        const upcomingHolidays = this.getUpcomingHolidays();
        
        if (upcomingHolidays.length === 0) return;

        const activeUsers = await this.prisma.user.findMany({
            where: { isActive: true }
        });

        for (const user of activeUsers) {
            if (activeConversations.has(user.phoneNumber)) continue;

            for (const holiday of upcomingHolidays) {
                const userProfile = generateUserContext(user);
                const handler = new ClaudeHandler(userProfile, `holiday-${holiday.name}`);
                const initialMessage = await handler.startConversation();
                await this.whatsappClient.sendMessage(user.phoneNumber, initialMessage);
            }
        }
    }
} 
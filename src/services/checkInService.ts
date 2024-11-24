import { PrismaClient } from '@prisma/client';
import { Client as WhatsappClient } from 'whatsapp-web.js';
import { CheckInHandler } from '../handlers/checkInHandler';

export class CheckInService {
    private prisma: PrismaClient;
    private whatsappClient: WhatsappClient;

    constructor(whatsappClient: WhatsappClient) {
        this.prisma = new PrismaClient();
        this.whatsappClient = whatsappClient;
    }

    private async handleCheckIn(user: any, type: 'MORNING' | 'EVENING'): Promise<void> {
        const handler = new CheckInHandler(user.phoneNumber, type);
        const messages = await handler.handleMessage(null); // Initial check-in message
        for (const message of messages) {
            await this.whatsappClient.sendMessage(user.phoneNumber, message);
        }
    }

    public async runMorningCheckIns(activeConversations: Map<string, any>): Promise<void> {
        const currentTime = new Date();
        const users = await this.prisma.user.findMany({
            where: {
                isActive: true,
                morningCheckInTime: {
                    not: null,
                    equals: currentTime.toLocaleTimeString('en-US', { hour12: false })
                }
            }
        });

        for (const user of users) {
            if (activeConversations.has(user.phoneNumber)) continue;
            await this.handleCheckIn(user, 'MORNING');
        }
    }

    public async runEveningCheckIns(activeConversations: Map<string, any>): Promise<void> {
        const currentTime = new Date();
        const users = await this.prisma.user.findMany({
            where: {
                isActive: true,
                eveningCheckInTime: {
                    equals: currentTime.toLocaleTimeString('en-US', { hour12: false })
                }
            }
        });

        for (const user of users) {
            if (activeConversations.has(user.phoneNumber)) continue;
            await this.handleCheckIn(user, 'EVENING');
        }
    }
} 
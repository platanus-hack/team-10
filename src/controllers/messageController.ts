import type { PrismaClient } from '@prisma/client/extension';
import { OnboardingHandler } from '../handlers/onboardingHandler';
import type Anthropic from '@anthropic-ai/sdk';
import IdleHandler from '../handlers/idleHandler';
import type { Message } from 'whatsapp-web.js';

const UserStates = require('../constants/userStates');
const prisma = require('../lib/prisma').default;
const { getIDLEMessage, activeConversations} = require('../utils/helpers');

class MessageController {
    private client: Anthropic;
    private prisma: PrismaClient;
    private conversations: Map<string, OnboardingHandler | IdleHandler>;

    constructor(client) {
        this.client = client;
        this.prisma = prisma;
        this.conversations = new Map();
    }

    async initializeBot() {
        try {
            console.log('Initializing bot...');
            console.log('Bot initialization complete! 🤖✨');
        } catch (error) {
            console.error('Error initializing bot:', error);
            throw error;
        }
    }

    
    async handleMessage(msg: Message) {
        try {
            // Use transaction to handle race condition
            // await this.prisma.$transaction(async (tx) => {
            //     const user = await tx.user.select({
            //         where: { phoneNumber: msg.from },
            //         update: { lastInteraction: new Date() },
            //         create: {
            //             phoneNumber: msg.from,
            //             currentState: UserStates.ONBOARDING,
            //             lastInteraction: new Date()
            //         }
            //     });


                if (this.conversations.has(msg.from)) {
                    const handler = this.conversations.get(msg.from);
                    const response = await handler.handleMessage(msg.body);
                    for (const message of response) {
                        await msg.reply(message);
                    }
                    return;
                } else {
                    const user = await this.prisma.user.findUnique({
                        where: { phoneNumber: msg.from }
                    });

                    if (!user) {
                        console.log('Starting onboarding for user:', msg.from);
                        this.conversations.set(msg.from, new OnboardingHandler(msg.from));
                        for (const message of await this.conversations.get(msg.from).handleMessage(msg.body)) {
                            await msg.reply(message);
                        }
                        return;
                    } else {
                        console.log('User already exists:', msg.from);
                        this.conversations.set(msg.from, new IdleHandler(msg.from, "Agustín tiene 23 años y es un estudiante universitario. Está soltero y vive con su familia. Lleva 3 meses tratando de mantenerse sobrio."));
                    }
                }

        } catch (error) {
            console.error('Error:', error);
            await msg.reply('❌ Something went wrong. Please try again.');
        }
    }

    // async handleStateMessage(msg, currentState) {
    //     switch (currentState) {
    //         case UserStates.IDLE:
    //             await this.handleIdle(msg);
    //             break;
    //         case UserStates.ONBOARDING:
    //             await this.handleOnboarding(msg);
    //             break;
    //         case UserStates.IN_CONVERSATION:
    //             await this.handleConversation(msg);
    //             break;
    //         case UserStates.CHECKIN:
    //             await this.handleCheckIn(msg);
    //             break;
    //         default:
                
                
    //     }
    // }



    // async handleOnboarding(msg) {
    //     const name = msg.body.trim();
        
    //     await this.prisma.user.update({
    //         where: { phoneNumber: msg.from },
    //         data: { 
    //             name,
    //             lastInteraction: new Date()
    //         }
    //     });

    //     await msg.reply(
    //         `Thanks, ${name}! 🤝\n\n` +
    //         'When do you typically feel most vulnerable? ' +
    //         'For example: "Friday nights" or "After work at 6pm"\n\n'
    //     );
    // }

    // async handleIdle(msg) {
    //     const user = await this.prisma.user.findUnique({
    //         where: { phoneNumber: msg.from }
    //     });
        
    //     const userProfile = {
    //         gender: user.gender,
    //         workStatus: user.workStatus,
    //         age: user.age,
    //         relationshipStatus: user.relationshipStatus,
    //         homeStatus: user.homeStatus,
    //     };

    //     // Create new IdleHandler instance for this conversation
    // ;
    //     const handler = new IdleHandler(msg.body, "Agustín tiene 23 años y es un estudiante universitario. Está soltero y vive con su familia. Lleva 3 meses tratando de mantenerse sobrio.");
    //     this.conversations.set(msg.from, handler);

    //     // Get response from Claude
    //     const response = await handler.handleMessage(msg.body);
    //     activeConversations[msg.from].push(msg);
        
    //     await msg.reply(response);
        
    //     await this.prisma.user.update({
    //         where: { phoneNumber: msg.from },
    //         data: {
    //             lastMessage: msg.body,
    //             totalMessages: { increment: 1 },
    //             allMessages: { push: msg.body },
    //             lastInteraction: new Date()
    //         }
    //     });
        
    // }
        
    // async handleConversation(msg) {
    //     // Get existing conversation handler
    //     let handler = this.conversations.get(msg.from);
        
    //     // If no handler exists (e.g., after server restart), create new one
    //     if (!handler) {
    //         const user = await this.prisma.user.findUnique({
    //             where: { phoneNumber: msg.from }
    //         });
            
    //         const userProfile = {
    //             gender: user.gender,
    //             workStatus: user.workStatus,
    //             age: user.age,
    //             relationshipStatus: user.relationshipStatus,
    //             homeStatus: user.homeStatus,
    //         };
            
    //         handler = new IdleHandler(getIDLEMessage(userProfile));
    //         this.conversations.set(msg.from, handler);
    //     }

    //     // Get response from Claude
    //     const response = await handler.handleMessage(msg.body);
    //     await msg.reply(response);
        
    //     await this.prisma.user.update({
    //         where: { phoneNumber: msg.from },
    //         data: {
    //             lastMessage: msg.body,
    //             totalMessages: { increment: 1 },
    //             allMessages: { push: msg.body },
    //             lastInteraction: new Date()
    //         }
    //     });
        
    //     // Check if conversation should end
    //     if (this.shouldEndConversation(msg.body)) {
    //         this.conversations.delete(msg.from);
    //     }
    // }

    shouldEndConversation(message) {
        // Implement your logic to determine if conversation should end
        // For example, based on keywords or time elapsed
        if (message.toLowerCase().includes('bye')) {
            return true;
        }
        return false;
    }


    async scheduleTriggerCheck(userId, riskTimes) {
        // Implementation for scheduling automated check-ins during risk times
        console.log('Scheduling trigger check for user:', userId, 'with risk times:', riskTimes);
    }
}

export default MessageController;
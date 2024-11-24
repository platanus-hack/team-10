import { OnboardingHandler } from '../handlers/onboardingHandler';
import IdleHandler from '../handlers/idleHandler';
import type { Message } from 'whatsapp-web.js';
import generateUserContext from '../utils/generateUserContext';
import prisma from '../lib/prisma';

import { Client as WhatsappClient } from 'whatsapp-web.js';


const maxTime = 100000000;


interface ConversationState {
    handler: OnboardingHandler | IdleHandler;
    lastInteraction: Date;
}

class MessageController {
    private whatsappClient: WhatsappClient;
    private conversations: Map<string, ConversationState>;

    constructor(whatsappClient: WhatsappClient) {
        this.conversations = new Map();
        this.whatsappClient = whatsappClient;
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
            const whiteList = ['56966600989@c.us', '56986885166@c.us', '56993203847@c.us'];

            if (!whiteList.includes(msg.from)) {
                console.log('Unauthorized user:', msg.from);
                return;
            }
            // Use transaction to handle race condition
            // await prisma.$transaction(async (tx) => {
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
                    const handler = this.conversations.get(msg.from).handler;
                    const lastInteraction = this.conversations.get(msg.from).lastInteraction;
                    const timeDiff = new Date().getTime() - lastInteraction.getTime();
                    if (handler.state == "COMPLETED" || timeDiff > maxTime) {
                        console.log("Cortamos Handler")
                        // Borramos el handler de la conversación
                        this.conversations.delete(msg.from);
                        return;
                    }
                    const response = await handler.handleMessage(msg.body);
                    for (const message of response) {
                        await this.whatsappClient.sendMessage(msg.from, message);
                    }
                    return;
                } else {
                        const user = await prisma.user.findUnique({
                            where: { phoneNumber: msg.from }
                        });

                        if (!user) {
                            console.log('Starting onboarding for user:', msg.from);
                            // this.conversations.set(msg.from, 
                            //     {
                            //         handler: new OnboardingHandler(msg.from),
                            //         lastInteraction: new Date(),

                            // });
                            const user = await prisma.user.create(
                                {data: {
                                    name: 'Agustín',
                                    phoneNumber: msg.from,
                                    gender: "MALE",
                                    age: 23,
                                    relationshipStatus: "SINGLE",
                                    workStatus: "STUDENT",
                                    homeStatus: "LIVES_WITH_FAMILY",
                                    triggers: [],
                                    copingStrategies: [],
                                    sobrietyStartDate: new Date(),
                                }})

                            // for (const message of await this.conversations.get(msg.from).handler.handleMessage(msg.body)) {
                            //     await this.whatsappClient.sendMessage(msg.from, message);
                            // }
                            await this.whatsappClient.sendMessage(msg.from, 'Bienvenido')
                        } else {
                            console.log('User already exists:', msg.from);
                            this.conversations.set(msg.from, 
                                {
                                handler : new IdleHandler(msg.from, generateUserContext(user)),
                                lastInteraction: new Date()
                                });
                            for (const message of await this.conversations.get(msg.from).handler.handleMessage(msg.body)) {
                                await this.whatsappClient.sendMessage(msg.from, message);
                            }
                        }
                        }
                

        } catch (error) {
            console.error('Error:', error);
            await this.whatsappClient.sendMessage(msg.from, 'Lo siento, algo salió mal. Por favor, inténtalo de nuevo más tarde.');
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
        
    //     await prisma.user.update({
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
    //     const user = await prisma.user.findUnique({
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
        
    //     await prisma.user.update({
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
    //         const user = await prisma.user.findUnique({
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
        
    //     await prisma.user.update({
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
const UserStates = require('../constants/userStates');
const ClaudeService = require('../services/claudeService');
const StateHandler = require('../handlers/stateHandler');
const prisma = require('../lib/prisma').default;
const { getIDLEMessage, activeConversations} = require('../utils/helpers');

class MessageController {
    constructor(client) {
        this.client = client;
        this.claudeService = new ClaudeService(process.env.ANTHROPIC_API_KEY);
        this.stateHandler = new StateHandler(prisma);
        this.prisma = prisma;
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

    async handleMessage(msg) {
        try {
            // Use transaction to handle race condition
            await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.upsert({
                    where: { phoneNumber: msg.from },
                    update: { lastInteraction: new Date() },
                    create: {
                        phoneNumber: msg.from,
                        currentState: UserStates.ONBOARDING,
                        lastInteraction: new Date()
                    }
                });


                // If user was just created, start onboarding
                if (user.currentState === UserStates.ONBOARDING && !user.name) {
                    await msg.reply('Welcome to SoBuddy! 🌟\nTo get started, please tell me your name.');
                    return;
                }

                // Handle ongoing states
                const currentState = user.currentState || UserStates.IDLE;
                await this.handleStateMessage(msg, currentState);
            });

        } catch (error) {
            console.error('Error:', error);
            await msg.reply('❌ Something went wrong. Please try again.');
            await this.stateHandler.clearState(msg.from);
        }
    }

    async handleStateMessage(msg, currentState) {
        switch (currentState) {
            case UserStates.IDLE:
                await this.handleIdle(msg);
                break;
            case UserStates.ONBOARDING:
                await this.handleOnboarding(msg);
                break;
            case UserStates.IN_CONVERSATION:
                await this.handleConversation(msg);
                break;
            case UserStates.CHECKIN:
                await this.handleCheckIn(msg);
                break;
            default:
                await this.stateHandler.clearState(msg.from);
        }
    }

    async startOnboarding(msg) {
        await this.stateHandler.setState(msg.from, UserStates.ONBOARDING);
        await msg.reply('Welcome to SoBuddy! 🌟\nTo get started, please tell me your name.');
    }

    async handleOnboarding(msg) {
        const name = msg.body.trim();
        
        await this.prisma.user.update({
            where: { phoneNumber: msg.from },
            data: { 
                name,
                lastInteraction: new Date()
            }
        });

        await msg.reply(
            `Thanks, ${name}! 🤝\n\n` +
            'When do you typically feel most vulnerable? ' +
            'For example: "Friday nights" or "After work at 6pm"\n\n'
        );
    }


    async handleIdle(msg) {
        const user = await this.prisma.user.findUnique({
            where: { phoneNumber: msg.from }
        });
        userProfile = {
            gender: user.gender,
            workStatus: user.workStatus,
            age: user.age,
            relationshipStatus: user.relationshipStatus,
            homeStatus: user.homeStatus,
        }
        msg.body = getIDLEMessage(userProfile);
        const response = await this.claudeService.sendPrompt(msg.body);
        activeConversations[msg.from].push(msg);
        console.log(response)
        await msg.reply(response);
        
        await this.prisma.user.update({
            where: { phoneNumber: msg.from },
            data: {
                lastMessage: msg.body,
                totalMessages: { increment: 1 },
                allMessages: { push: msg.body },
                lastInteraction: new Date()
            }
        });
        
        await this.stateHandler.clearState(msg.from);
    }
        
    async handleConversation(msg) {
        // msg.body = 
        const response = await this.claudeService.sendPrompt(msg.body);
        await msg.reply(response);
        
        await this.prisma.user.update({
            where: { phoneNumber: msg.from },
            data: {
                lastMessage: msg.body,
                totalMessages: { increment: 1 },
                allMessages: { push: msg.body },
                lastInteraction: new Date()
            }
        });
        
        await this.stateHandler.clearState(msg.from);
    }

    async scheduleTriggerCheck(userId, riskTimes) {
        // Implementation for scheduling automated check-ins during risk times
        console.log('Scheduling trigger check for user:', userId, 'with risk times:', riskTimes);
    }
}

module.exports = MessageController; 
const UserStates = require('../constants/userStates');
const ClaudeService = require('../services/claudeService');
const StateHandler = require('../handlers/stateHandler');

class MessageController {
    constructor(client) {
        this.client = client;
        this.stateHandler = new StateHandler();
        this.claudeService = new ClaudeService();
    }

    async initializeBot() {
        try {
            console.log('Initializing bot...');
            
            // You can add initialization tasks here, such as:
            // - Loading conversation history
            // - Setting up scheduled tasks
            // - Connecting to databases
            // - Loading any cached data
            
            console.log('Bot initialization complete! 🤖✨');
        } catch (error) {
            console.error('Error initializing bot:', error);
            throw error;
        }
    }

    async handleMessage(msg) {
        try {
            const content = msg.body;
            const currentState = this.stateHandler.getState(msg.from);

            // Handle onboarding for new users
            if (this.isNewUser(msg.from)) {
                await this.startOnboarding(msg);
                return;
            }

            // Handle ongoing states
            if (this.stateHandler.hasState(msg.from)) {
                await this.handleStateMessage(msg, currentState);
                return;
            }

            // Start new conversation with Claude
            this.stateHandler.setState(msg.from, UserStates.IN_CONVERSATION);
            await this.handleConversation(msg);

        } catch (error) {
            console.error('Error:', error);
            await msg.reply('❌ Something went wrong. Please try again.');
            this.stateHandler.clearState(msg.from);
        }
    }

    async handleStateMessage(msg, currentState) {
        switch (currentState) {
            case UserStates.ONBOARDING:
                await this.handleOnboarding(msg);
                break;
            case UserStates.ONBOARDING_RISK_TIMES:
                await this.handleOnboardingRiskTimes(msg);
                break;
            case UserStates.IN_CONVERSATION:
                await this.handleConversation(msg);
                break;
            default:
                this.stateHandler.clearState(msg.from);
        }
    }

    async startOnboarding(msg) {
        this.stateHandler.setState(msg.from, UserStates.ONBOARDING_NAME);
        await msg.reply('Welcome to SoBuddy! 🌟\nTo get started, please tell me your name.');
    }

    async handleOnboardingName(msg) {
        const name = msg.body.trim();
        
        // Store name in database
        // await this.prisma.user.create({ ... })

        this.stateHandler.setState(msg.from, UserStates.ONBOARDING_RISK_TIMES, { name });
        await msg.reply(
            `Thanks, ${name}! 🤝\n\n` +
            'When do you typically feel most vulnerable? ' +
            'For example: "Friday nights" or "After work at 6pm"\n\n' +
            'This helps me check in with you during challenging times.'
        );
    }

    async handleOnboardingRiskTimes(msg) {
        const riskTimes = msg.body.trim();
        const context = this.stateHandler.getContext(msg.from);
        
        // Store risk times in database
        // await this.prisma.user.update({ ... })

        this.stateHandler.setState(msg.from, UserStates.ONBOARDING_COMPLETE);
        await msg.reply(
            `Perfect, ${context.name}! I'll make sure to check in with you during those times. 🌟\n\n` +
            'You can message me anytime you need support or just want to talk.\n\n' +
            "I'm here to listen and help you stay on track! 💪"
        );
        this.stateHandler.clearState(msg.from);
    }

    async handleConversation(msg) {
        const response = await this.claudeService.getResponse(msg.body);
        await msg.reply(response);
        
        // Clear conversation state after Claude responds
        this.stateHandler.clearState(msg.from);
    }

    async isNewUser(userId) {
        // Check if user exists in database
        // return !(await this.prisma.user.findUnique({ where: { phoneNumber: userId }}));
        return false; // Temporary placeholder
    }

    async scheduleTriggerCheck(userId, riskTimes) {
        // Implementation for scheduling automated check-ins during risk times
        // This would integrate with a scheduling system
    }
}

module.exports = MessageController; 
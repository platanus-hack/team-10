const CommandController = require('./commandController');
const StateHandler = require('../handlers/stateHandler');

class MessageController {
    constructor(client) {
        this.client = client;
        this.commandController = new CommandController(client);
        this.stateHandler = new StateHandler();
    }

    async initializeBot() {
        try {
            await this.client.setStatus('🤖 Bot active | Type !help');
            console.log('Bot profile updated!');
        } catch (err) {
            console.log('Error updating profile:', err);
        }
    }

    async handleMessage(msg) {
        try {
            const chat = await msg.getChat();
            const content = msg.body.toLowerCase();

            // Handle ongoing states
            if (this.stateHandler.hasState(msg.from)) {
                await this.handleStateMessage(msg);
                return;
            }

            // Handle commands
            if (content.startsWith('!')) {
                await this.commandController.handleCommand(msg);
                return;
            }
        } catch (error) {
            console.error('Error:', error);
            await msg.reply('❌ An error occurred while processing your message.');
        }
    }

    async handleStateMessage(msg) {
        const state = this.stateHandler.getState(msg.from);
        await this.commandController.handleStateCommand(msg, state);
        this.stateHandler.clearState(msg.from);
    }
}

module.exports = MessageController; 
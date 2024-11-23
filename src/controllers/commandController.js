class CommandController {
    constructor(client) {
        this.client = client;
        this.commands = new Map();
        this.initializeCommands();
    }

    initializeCommands() {
        // Add basic commands
        this.commands.set('help', this.handleHelp.bind(this));
        // Add more commands as needed
    }

    async handleCommand(msg) {
        const command = msg.body.toLowerCase().split(' ')[0].substring(1);
        const handler = this.commands.get(command);
        
        if (handler) {
            await handler(msg);
        } else {
            await msg.reply('❌ Unknown command. Type !help for available commands.');
        }
    }

    async handleStateCommand(msg, state) {
        // Handle state-specific commands
        console.log(`Handling state command: ${state}`);
    }

    async handleHelp(msg) {
        const helpText = `
Available commands:
!help - Show this help message
`;
        await msg.reply(helpText);
    }
}

module.exports = CommandController; 
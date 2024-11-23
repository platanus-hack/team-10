const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const MessageController = require('../controllers/messageController');
const StateHandler = require('../handlers/stateHandler');

class WhatsAppBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium'
            }
        });
        
        this.messageController = new MessageController(this.client);
        this.stateHandler = new StateHandler();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.on('qr', (qr) => {
            console.log('QR RECEIVED', qr);
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', async () => {
            console.log('Client is ready!');
            await this.messageController.initializeBot();
        });

        this.client.on('message', async (msg) => {
            await this.messageController.handleMessage(msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('Client was disconnected:', reason);
        });
    }

    initialize() {
        this.client.initialize();
    }
}

module.exports = WhatsAppBot; 
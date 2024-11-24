import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import MessageController from '../controllers/messageController';

class WhatsAppBot {
    constructor() {
        console.log('Initializing WhatsAppBot...');
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: '/usr/src/app/.wwebjs_auth'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-software-rasterizer',
                    '--disable-dev-tools'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
                timeout: 60000
            },
            webVersion: '2.2402.5',
            webVersionCache: {
                type: 'local',
                path: '/usr/src/app/.wwebjs_cache'
            }
        });
        
        this.messageController = new MessageController(this.client);
        this.stateHandler = new StateHandler();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.on('loading_screen', (percent, message) => {
            console.log('LOADING SCREEN', percent, message);
        });

        this.client.on('authenticated', () => {
            console.log('AUTHENTICATED - Session is ready');
        });

        this.client.on('auth_failure', msg => {
            console.error('AUTHENTICATION FAILURE', msg);
        });

        this.client.on('qr', (qr) => {
            console.log('QR RECEIVED - Waiting for scan');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', async () => {
            console.log('WhatsApp Client is ready and fully connected!');
            try {
                await this.messageController.initializeBot();
                console.log('Bot initialized successfully');
            } catch (error) {
                console.error('Error initializing bot:', error);
            }
        });

        this.client.on('message', async (msg) => {
            console.log('Received message:', msg.body);
            try {
                await this.messageController.handleMessage(msg);
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });

        this.client.on('disconnected', (reason) => {
            console.log('Client was disconnected:', reason);
        });
    }

    initialize() {
        console.log('Starting WhatsApp client initialization...');
        this.client.initialize()
            .catch(error => {
                console.error('Failed to initialize WhatsApp client:', error);
            });
    }
}

export default WhatsAppBot;

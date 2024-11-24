import { PrismaClient } from '@prisma/client';
import { Client as WhatsappClient } from 'whatsapp-web.js';
import ClaudeHandler from '../handlers/claudeHandler';
import generateUserContext from '../utils/generateUserContext';

export class CheckInService {
    private prisma: PrismaClient;
    private whatsappClient: WhatsappClient;

    constructor(whatsappClient: WhatsappClient) {
        this.prisma = new PrismaClient();
        this.whatsappClient = whatsappClient;
    }

    private buildCheckInPrompt(user: any, type: 'MORNING' | 'EVENING'): string {
        const userContext = generateUserContext(user);
        const timeOfDay = type === 'MORNING' ? 'mañana' : 'noche';
        const sobrietyDays = user.sobrietyStartDate 
            ? Math.floor((new Date().getTime() - user.sobrietyStartDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        return `
        Eres un asistente de check-in diario para personas en recuperación del alcohol. Tu rol es guiar una breve conversación de check-in de ${timeOfDay}.

        CONTEXTO ACTUAL:
        - Momento: Check-in de ${type.toLowerCase()}
        - Días en recuperación: ${sobrietyDays}
        - Primera interacción: true

        INFORMACIÓN DEL USUARIO:
        ${userContext}

        GUÍAS DE RESPUESTA:
        1. Mantén respuestas breves (máximo 2-3 líneas por mensaje)
        2. Usa español chileno casual pero respetuoso
        3. Enfócate en el momento presente
        4. Valida sus experiencias sin juzgar
        5. Ofrece apoyo práctico solo si es necesario
        6. Incluye un mensaje de cierre positivo y esperanzador

        RECURSOS DISPONIBLES:
        - SENDA (1431): Línea de ayuda 24/7
        - HALT: Revisar Hambre, Angustia, Soledad, Tensión
        - Ejercicios de respiración
        - Técnicas de manejo de impulsos

        Inicia la conversación de manera amigable y empática, preguntando sobre su estado actual o planes para el día.`;
    }

    private async handleCheckIn(user: any, type: 'MORNING' | 'EVENING'): Promise<void> {
        const prompt = this.buildCheckInPrompt(user, type);
        const handler = new ClaudeHandler(prompt, `check-in-${type}`);
        const initialMessage = await handler.startConversation();
        await this.whatsappClient.sendMessage(user.phoneNumber, initialMessage);
    }

    public async runMorningCheckIns(activeConversations: Map<string, any>): Promise<void> {
        const currentTime = new Date();
        const users = await this.prisma.user.findMany({
            where: {
                isActive: true,
                morningCheckInTime: {
                    equals: new Date(`1970-01-01T${currentTime.toTimeString().split(' ')[0]}Z`),
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
                  equals: new Date(`1970-01-01T${currentTime.toTimeString().split(' ')[0]}Z`)
              }
            }
        });

        for (const user of users) {
            if (activeConversations.has(user.phoneNumber)) continue;
            await this.handleCheckIn(user, 'EVENING');
        }
    }
} 
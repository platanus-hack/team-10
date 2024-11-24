import type { Holiday } from '../data/holidays';
import prisma from '../lib/prisma';
import Anthropic from '@anthropic-ai/sdk';
import config from '../config/config';
import generateUserContext from '../utils/generateUserContext';
import { PrismaClient } from '@prisma/client';

export class HolidayHandler {
    private user: any;
    private anthropic: Anthropic;
    private prisma: PrismaClient;

    constructor(private userId: string, private holiday: Holiday) {
        this.prisma = new PrismaClient();
        this.anthropic = new Anthropic({
            apiKey: config.claude.apiKey,
        });
        this.user = null;
    }

    private async loadUser() {
        this.user = await this.prisma.user.findUnique({ where: { id: this.userId } });
    }

    private async generateResponse(message: string | null): Promise<string[]> {
        const userContext = generateUserContext(this.user);
        
        const prompt = `
        Eres un asistente de IA que ayuda a un usuario que intenta dejar el alcohol. En particular, debes ayudarlo porque se viene una fecha complicado para este por una festividad.

        CONTEXTO:
        - Festividad: ${this.holiday.name}
        - Fecha: ${this.holiday.date}
        - Primera interacción: ${!message ? 'true' : 'false'}

        INFORMACIÓN DEL USUARIO:
        ${userContext}

        ${message ? `MENSAJE DEL USUARIO: "${message}"` : 'INICIO DE CONVERSACIÓN'}

        GUÍAS DE RESPUESTA:
        1. Mantén un tono empático y comprensivo
        2. Reconoce que las festividades pueden ser momentos desafiantes
        3. Ofrece sugerencias prácticas si el usuario las solicita
        4. Valida sus emociones y preocupaciones
        5. Mantén las respuestas breves y claras
        6. Usa español chileno casual pero respetuoso

        RECURSOS DISPONIBLES:
        - SENDA (1431): Línea de ayuda 24/7
        - Técnicas de manejo de impulsos
        - Plan de acción para eventos sociales

        Responde como un amigo comprensivo que ayuda a prepararse para la festividad.`;

        try {
            const response = await this.anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 250,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
            });

            const content = response.content.find((c) => c.type === "text")?.text;
            return content ? content.split('\n').filter(line => line.trim()) : [
                `Hola ${this.user.name}, se acerca ${this.holiday.name}.`,
                "¿Cómo te sientes al respecto?"
            ];
        } catch (error) {
            console.error("Error generating response:", error);
            return [
                `Hola ${this.user.name}, se acerca ${this.holiday.name}.`,
                "¿Cómo te sientes al respecto?"
            ];
        }
    }

    async handleMessage(message: string | null): Promise<string[]> {
        try {
            if (!this.user) {
                await this.loadUser();
            }

            return await this.generateResponse(message);
        } catch (error) {
            console.error("Error in handleMessage:", error);
            return ["Disculpa, tuve un problema. ¿Podríamos intentar de nuevo?"];
        }
    }
} 
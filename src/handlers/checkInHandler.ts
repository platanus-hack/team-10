import { PrismaClient } from "@prisma/client";
import type { User } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import config from "../config/config";
import generateUserContext from "../utils/generateUserContext";

interface CheckInState {
  type: 'MORNING' | 'EVENING';
  step: number;
  sessionStartTime: Date;
}

export class CheckInHandler {
  private state: CheckInState;
  private user: User | null;
  private prisma: PrismaClient;
  private anthropic: Anthropic;
  
  constructor(
    private phoneNumber: string,
    type: 'MORNING' | 'EVENING' = 'EVENING'
  ) {
    this.prisma = new PrismaClient();
    this.anthropic = new Anthropic({
      apiKey: config.claude.apiKey,
    });
    this.user = null;
    this.state = {
      type,
      step: 0,
      sessionStartTime: new Date()
    };
  }

  private async loadUser() {
    this.user = await this.prisma.user.findUnique({
      where: { phoneNumber: this.phoneNumber }
    });

    if (!this.user) {
      throw new Error('User not found');
    }

    await this.prisma.user.update({
      where: { id: this.user.id },
      data: { lastInteraction: new Date() }
    });
  }

  private buildSystemPrompt(): string {
    const timeOfDay = new Date().getHours() < 12 ? 'mañana' : 
                     new Date().getHours() < 18 ? 'tarde' : 
                     'noche';
    
    const sobrietyDays = this.user?.sobrietyStartDate 
      ? Math.floor((new Date().getTime() - this.user.sobrietyStartDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return `
    CONTEXTO DE CHECK-IN:
    - Momento: Check-in ${this.state.type.toLowerCase()} (${timeOfDay})
    - Días en recuperación: ${sobrietyDays}
    - Tipo: Check-in programado

    INFORMACIÓN DEL USUARIO:
    ${generateUserContext(this.user)}

    OBJETIVOS DEL CHECK-IN:
    1. Evaluar estado actual y posibles riesgos
    2. Validar logros y esfuerzos
    3. Identificar necesidades de apoyo inmediatas
    4. Reforzar compromiso con la recuperación

    ESTRUCTURA:
    1. Saludo breve y cálido
    2. Pregunta específica sobre el momento actual
    3. Exploración de necesidades si es necesario
    4. Cierre con recordatorio del próximo check-in

    RECURSOS RELEVANTES:
    - HALT: Revisar Hambre, Angustia, Soledad, Tensión
    - SENDA (1431): Disponible 24/7
    - Ejercicios de respiración
    - Técnicas de manejo de impulsos

    IMPORTANTE:
    - Mantén respuestas concisas (2-3 líneas)
    - Usa lenguaje chileno casual pero respetuoso
    - Enfócate en el presente inmediato
    - Valida sin juzgar
    - Ofrece recursos solo si detectas señales de riesgo`;
  }

  private async generateResponse(message: string): Promise<string[]> {
    const prompt = this.buildSystemPrompt();

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 250,
        messages: [
          { role: "user", content: prompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
      });

      const content = response.content.find((c) => c.type === "text")?.text;
      return this.formatResponse(content);
    } catch (error) {
      console.error("Error generating response:", error);
      return this.getFallbackResponse();
    }
  }

  private formatResponse(content: string | undefined): string[] {
    return content ? content.split('\n').filter(line => line.trim()) : this.getFallbackResponse();
  }

  private getFallbackResponse(): string[] {
    const timeOfDay = new Date().getHours() < 12 ? 'mañana' : 
                     new Date().getHours() < 18 ? 'tarde' : 
                     'noche';
    return [
      "Te escucho y estoy aquí para apoyarte.",
      `Que tengas una buena ${timeOfDay}. Recuerda que no estás solo/a en este proceso.`
    ];
  }

  public async handleMessage(message: string): Promise<string[]> {
    try {
      if (!this.user) {
        await this.loadUser();
      }

      const response = await this.generateResponse(message);
      this.state.step++;

      if (this.state.step >= 3) {
        await this.prisma.user.update({
          where: { id: this.user.id },
          data: { lastInteraction: new Date() }
        });
      }

      return response;
    } catch (error) {
      console.error("Error in handleMessage:", error);
      return ["Disculpa, tuve un problema. ¿Podríamos intentar de nuevo?"];
    }
  }
}
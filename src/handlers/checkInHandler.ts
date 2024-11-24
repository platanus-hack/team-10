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
    Eres un asistente de check-in diario para personas en recuperación del alcohol. Tu rol es guiar una breve conversación de check-in ${this.state.type === 'MORNING' ? 'matutino' : 'vespertino'}.

    ESTRUCTURA DEL CHECK-IN:
    Etapa ${this.state.step + 1}/3:
    ${this.getStepInstructions()}

    CONTEXTO ACTUAL:
    - Momento: Check-in de ${this.state.type.toLowerCase()}
    - Días en recuperación: ${sobrietyDays}
    - Hora del día: ${timeOfDay}

    INFORMACIÓN DEL USUARIO:
    ${generateUserContext(this.user)}

    GUÍAS DE RESPUESTA:
    1. Mantén respuestas breves (máximo 2-3 líneas por mensaje)
    2. Usa español chileno casual pero respetuoso
    3. Enfócate en el momento presente
    4. Valida sus experiencias sin juzgar
    5. Ofrece apoyo práctico solo si es necesario
    ${this.state.step >= 2 ? '6. Incluye un mensaje de cierre positivo y esperanzador' : ''}

    RECURSOS DISPONIBLES:
    ${this.getAvailableResources()}`;
  }

  private getStepInstructions(): string {
    const steps = {
      0: `
    - Saludo inicial cálido y breve
    - Pregunta sobre su estado actual/planes para el día`,
      1: `
    - Validación de su respuesta
    - Exploración gentil de cualquier preocupación
    - Ofrecer apoyo específico si es necesario`,
      2: `
    - Cierre positivo
    - Recordatorio de recursos disponibles
    - Confirmación de próximo check-in`
    };
    return steps[this.state.step as keyof typeof steps];
  }

  private getAvailableResources(): string {
    return `
    - SENDA (1431): Línea de ayuda 24/7
    - HALT: Revisar Hambre, Angustia, Soledad, Tensión
    - Ejercicios de respiración
    - Técnicas de manejo de impulsos`;
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
import { Anthropic } from '@anthropic-ai/sdk';
import { PrismaClient, User } from '@prisma/client';
import config from '../config/config';

const anthropic = new Anthropic({
  apiKey: config.claude.apiKey,
  
});

const prisma = new PrismaClient();

type OnboardingStep = 
  | 'INITIAL'
  | 'NAME'
  | 'GENDER'
  | 'AGE'
  | 'WORK_STATUS'
  | 'HOME_STATUS'
  | 'PROBLEM_HISTORY'
  | 'TRIGGERS'
  | 'CHECKIN_TIME'
  | 'COMPLETED';

interface OnboardingState {
  step: OnboardingStep;
  data: Partial<User>;
}

export class OnboardingHandler {
  private state: OnboardingState = {
    step: 'INITIAL',
    data: {}
  };

  constructor(private phoneNumber: string) {}

  private async interpretWithClaude(message: string, context: string): Promise<any> {
    try {
      const prompt = `
        Context: ${context}
        User message: "${message}"
        
        Extract the relevant information from the user's message and return it in a structured JSON format.
        Only return the JSON, no other text.
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
        system: "You are a helpful assistant that extracts structured data from user messages. Only respond with valid JSON.",
        temperature: 0,
      });

      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Error interpreting message with Claude:', error);
      return null;
    }
  }

  private getPromptForStep(step: OnboardingStep): string {
    const prompts: Record<OnboardingStep, string> = {
      INITIAL: '¡Hola! Un gusto conocerte, mi nombre es SoBuddy y seré tu compañero en este proceso. Para entrar en mayor confianza me gustaría saber algunas cosas sobre ti, estas preguntas son de caracterización y solo serán preguntadas esta primera vez. Prometo que no te tomará más de 10 minutos!\n\nComencemos por lo básico, ¿cuál es tu nombre?',
      NAME: 'Un gusto ${name}! Para poder dirigirme a ti de la mejor manera, ¿podrías decirme con qué género te identificas? Puedes elegir entre masculino, femenino, no binario, otro, o preferir no decirlo.',
      GENDER: 'Gracias por compartir eso conmigo. ¿Te molestaría decirme cuántos años tienes?',
      AGE: 'Entiendo, y actualmente ¿trabajas? ¿estudias? Puedes ser detallado si lo deseas.',
      WORK_STATUS: 'Suena bien, y actualmente ¿con quién vives?',
      HOME_STATUS: 'Fantástico, ahora comenzaremos con las preguntas un poco más duras.\n\nRecuerda que estas preguntas son opcionales y si no te sientes cómodo respondiendo puedes omitirla, estas preguntas sirven para poder caracterizar mejor tu perfil y poder ayudarte de la mejor forma :)\n\nMe gustaría saber en primer lugar hace cuanto presentas este problema con el alcohol y hace cuanto tiempo has estado trabajando para dejarlo o reducirlo.',
      PROBLEM_HISTORY: 'Muchas gracias por tanta colaboración. Lo que haremos ahora será definir ciertos eventos gatillantes y funcionamiento de la app en el día a día para poder cubrir de la mejor manera los escenarios de riesgo.\n\nUna de las cosas que puedo hacer por ti es ayudarte a manejar situaciones difíciles. ¿En qué momentos crees que necesitas más ayuda? Puede ser los viernes por la noche, por ejemplo.',
      TRIGGERS: 'Para el funcionamiento de nuestra relación en el día a día, te pediré que respondas ciertas preguntas de manera rutinaria, recomendamos que estas preguntas las respondas después de despertar y antes de dormir.\n\nDime, ¿a qué horas quieres responder estas preguntas diariamente?',
      CHECKIN_TIME: '¡Genial! Entonces te estaré escribiendo de manera diaria. Para comenzar, ¿te gustaría establecer una fecha de inicio de tu proceso de recuperación?',
      COMPLETED: '¡Perfecto! Ya estamos listos para comenzar este proceso juntos. Estaré aquí para apoyarte en todo momento.'
    };

    return prompts[step];
  }

  private async updateUserData(data: Partial<User>) {
    try {
      await prisma.user.upsert({
        where: { phoneNumber: this.phoneNumber },
        update: { ...data },
        create: { 
          phoneNumber: this.phoneNumber,
          ...data,
          currentState: 'ONBOARDING'
        }
      });
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  public async getInitialMessages(): Promise<string[]> {
    return [];
  }

  public async handleMessage(message: string): Promise<string[]> {
    try {
      let response: string;
      let interpretedData: any;

      switch (this.state.step) {
        case 'INITIAL':
          this.state.step = 'NAME';
          return this.getPromptForStep('NAME');

        case 'NAME':
          interpretedData = await this.interpretWithClaude(message, "Extract the user's name");
          if (interpretedData?.name) {
            await this.updateUserData({ name: interpretedData.name });
            this.state.data.name = interpretedData.name;
            this.state.step = 'GENDER';
            response = this.getPromptForStep('GENDER').replace('${name}', interpretedData.name);
          } else {
            response = 'Lo siento, no pude entender tu nombre. ¿Podrías decírmelo nuevamente?';
          }
          break;

        case 'GENDER':
          interpretedData = await this.interpretWithClaude(message, "Classify gender into: MALE, FEMALE, NON_BINARY, OTHER, PREFER_NOT_TO_SAY. Look for keywords like 'masculino'/'hombre' for MALE, 'femenino'/'mujer' for FEMALE, 'no binario' for NON_BINARY, 'prefiero no decir' for PREFER_NOT_TO_SAY");
          if (interpretedData?.gender) {
            await this.updateUserData({ gender: interpretedData.gender });
            this.state.step = 'AGE';
            response = this.getPromptForStep('AGE');
          } else {
            response = 'Lo siento, no pude entender tu respuesta sobre género. ¿Podrías elegir entre masculino, femenino, no binario, otro, o preferir no decirlo?';
          }
          break;

        case 'AGE':
          interpretedData = await this.interpretWithClaude(message, "Extract age as a number");
          if (interpretedData?.age && typeof interpretedData.age === 'number') {
            await this.updateUserData({ age: interpretedData.age });
            this.state.step = 'WORK_STATUS';
            response = this.getPromptForStep('WORK_STATUS');
          } else {
            response = 'Lo siento, no pude entender tu edad. ¿Podrías decirme cuántos años tienes?';
          }
          break;

        case 'WORK_STATUS':
          interpretedData = await this.interpretWithClaude(message, "Classify work status into: EMPLOYED, UNEMPLOYED, STUDENT, RETIRED, OTHER");
          if (interpretedData?.workStatus) {
            await this.updateUserData({ workStatus: interpretedData.workStatus });
            this.state.step = 'HOME_STATUS';
            response = this.getPromptForStep('HOME_STATUS');
          } else {
            response = 'Lo siento, no pude entender tu situación laboral. ¿Podrías ser más específico?';
          }
          break;

        case 'HOME_STATUS':
          interpretedData = await this.interpretWithClaude(message, "Classify living situation into: LIVES_ALONE, LIVES_WITH_FAMILY, LIVES_WITH_ROOMMATES, HOMELESS, OTHER");
          if (interpretedData?.homeStatus) {
            await this.updateUserData({ homeStatus: interpretedData.homeStatus });
            this.state.step = 'PROBLEM_HISTORY';
            response = this.getPromptForStep('PROBLEM_HISTORY');
          } else {
            response = 'Lo siento, no pude entender tu situación de vivienda. ¿Podrías explicarlo nuevamente?';
          }
          break;

        case 'PROBLEM_HISTORY':
          // Store the raw text as part of allMessages for now
          await this.updateUserData({
            allMessages: { push: message }
          });
          this.state.step = 'TRIGGERS';
          response = this.getPromptForStep('TRIGGERS');
          break;

        case 'TRIGGERS':
          interpretedData = await this.interpretWithClaude(message, "Extract potential trigger situations or times");
          if (interpretedData?.triggers) {
            await this.updateUserData({ 
              triggers: interpretedData.triggers,
              riskLevel: interpretedData.riskLevel || 0
            });
            this.state.step = 'CHECKIN_TIME';
            response = this.getPromptForStep('CHECKIN_TIME');
          } else {
            response = 'Lo siento, no pude entender los momentos de riesgo. ¿Podrías ser más específico?';
          }
          break;

        case 'CHECKIN_TIME':
          interpretedData = await this.interpretWithClaude(message, "Extract check-in times for morning and evening");
          if (interpretedData?.checkInTimes) {
            const now = new Date();
            await this.updateUserData({
              dailyCheckInDate: now,
              weeklyCheckInDate: now,
              currentState: 'IDLE'
            });
            this.state.step = 'COMPLETED';
            response = this.getPromptForStep('COMPLETED');
          } else {
            response = 'Lo siento, no pude entender los horarios. ¿Podrías especificar a qué hora te gustaría hacer los check-ins?';
          }
          break;

        case 'COMPLETED':
          response = 'Ya hemos completado el proceso de registro. ¿Hay algo más en lo que pueda ayudarte?';
          break;

        default:
          response = 'Lo siento, ha ocurrido un error. Por favor, intenta nuevamente.';
      }

      return response;
    } catch (error) {
      console.error('Error in handleMessage:', error);
      return 'Lo siento, ha ocurrido un error. Por favor, intenta nuevamente.';
    }
  }
}

// Usage example:
/*
const handler = new OnboardingHandler('+1234567890');
const response = await handler.handleMessage('Hola! Me gustaría empezar a usar la app!');
console.log(response);
*/
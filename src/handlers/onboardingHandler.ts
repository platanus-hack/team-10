import { Anthropic } from '@anthropic-ai/sdk';
import { PrismaClient, User } from '@prisma/client';
import config from '../config/config';

const anthropic = new Anthropic({
  apiKey: config.claude.apiKey,
});

const prisma = new PrismaClient();

type OnboardingStep = 
  | 'WELCOME'  // Initial welcome
  | 'CONFIRM_START'  // Confirm they want to start
  | 'NAME'
  | 'GENDER'
  | 'AGE'
  | 'WORK_STATUS'
  | 'HOME_STATUS'
  | 'PROBLEM_HISTORY'
  | 'TRIGGERS'
  | 'CHECKIN_TIME'
  | 'RECOVERY_DATE'
  | 'COMPLETED';

interface OnboardingState {
  step: OnboardingStep;
  data: Partial<User>;
  retryCount: number;
}

export class OnboardingHandler {
  private state: OnboardingState = {
    step: 'WELCOME',
    data: {},
    retryCount: 0
  };

  private readonly MAX_RETRIES = 3;

  constructor() {}

  private async interpretWithClaude(message: string, context: string): Promise<any> {
    try {
      const prompt = `
        Context: ${context}
        User message: "${message}"
        
        Extract the relevant information from the user's message and return it in a structured JSON format.
        If you're unsure about the interpretation, return { "confidence": "low" } instead of guessing.
        Only return the JSON, no other text.
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
        system: "You are a helpful assistant that extracts structured data from user messages. Only respond with valid JSON. Be conservative in your interpretations - if you're not confident, return { \"confidence\": \"low\" }.",
        temperature: 0,
      });

      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Error interpreting message with Claude:', error);
      return { confidence: "low" };
    }
  }

  private getPromptForStep(step: OnboardingStep): string[] {
    const prompts: Record<OnboardingStep, string[]> = {
      WELCOME: [
        '¡Hola! Un gusto conocerte, mi nombre es SoBuddy y seré tu compañero en este proceso. 🤝',
        'Este es un espacio seguro y confidencial donde podremos trabajar juntos en tu recuperación.',
        '¿Te gustaría comenzar con unas preguntas iniciales para conocerte mejor? Tomarán aproximadamente 5 minutos.'
      ],
      CONFIRM_START: [
        'Excelente. Todas tus respuestas son confidenciales y me ayudarán a brindarte un mejor apoyo.',
        '¿Estás list@ para comenzar?'
      ],
      NAME: [
        'Comencemos por lo básico, ¿cuál es tu nombre?',
        'Puedes usar tu nombre real o un apodo, como te sientas más cómod@.'
      ],
      GENDER: [
        'Un gusto ${name}! Para poder dirigirme a ti de la mejor manera...',
        '¿Con qué género te identificas?',
        'Puedes elegir entre:\n- Masculino\n- Femenino\n- No binario\n- Otro\n- Prefiero no decirlo'
      ],
      AGE: [
        'Gracias por compartir eso conmigo.',
        '¿Te molestaría decirme cuántos años tienes?'
      ],
      WORK_STATUS: [
        'Entiendo. Y cuéntame, ¿a qué te dedicas actualmente?',
        '¿Trabajas? ¿Estudias? Puedes ser tan detallad@ como desees.'
      ],
      HOME_STATUS: [
        'Y actualmente, ¿con quién vives?',
        'Esta información me ayuda a entender mejor tu entorno de apoyo.'
      ],
      PROBLEM_HISTORY: [
        'Ahora vamos a hablar de algo un poco más personal.',
        'Recuerda que esta es una conversación privada y confidencial. Si en algún momento te sientes incómod@, podemos hacer una pausa.',
        '¿Hace cuánto tiempo presentas este problema con el alcohol y hace cuánto estás trabajando para dejarlo o reducirlo?'
      ],
      TRIGGERS: [
        'Gracias por compartir eso conmigo. Es importante identificar las situaciones de riesgo para poder manejarlas mejor.',
        '¿En qué momentos sientes que necesitas más apoyo?',
        'Por ejemplo:\n- Días específicos de la semana\n- Situaciones sociales\n- Estados emocionales particulares'
      ],
      CHECKIN_TIME: [
        'Para ayudarte mejor, me gustaría hacer check-ins diarios contigo.',
        'Son breves conversaciones para ver cómo vas y brindarte apoyo cuando lo necesites.',
        'Necesito que me indiques un horario fijo para el check-in de la noche. Este es muy importante para evaluar cómo te fue en el día.',
        '¿A qué hora de la noche te gustaría hacer este check-in? Por ejemplo: 9:00 PM',
        'También puedes tener un check-in opcional en la mañana. ¿Te gustaría agregarlo? Puedes decir "no" o indicar una hora.'
      ],
      RECOVERY_DATE: [
        '¡Excelente! Ya casi terminamos.',
        '¿Te gustaría establecer una fecha oficial de inicio para tu proceso de recuperación?',
        'Puede ser hoy o cualquier otra fecha significativa para ti.'
      ],
      COMPLETED: [
        '¡Perfecto! Ya estamos list@s para comenzar este proceso juntos. 🌟',
        'Estaré aquí para apoyarte en cada paso del camino.',
        'Recuerda que puedes escribirme en cualquier momento si necesitas ayuda o simplemente quieres conversar.'
      ]
    };

    return prompts[step];
  }

  public async getInitialMessages(): Promise<string[]> {
    return this.getPromptForStep('WELCOME');
  }

  private handleRetry(errorMessage: string): string[] {
    this.state.retryCount++;
    if (this.state.retryCount >= this.MAX_RETRIES) {
      this.state.retryCount = 0;
      const currentStep = this.state.step;
      this.state.step = this.getNextStep(currentStep);
      return [
        'Parece que estamos teniendo dificultades con esta pregunta.',
        'Continuemos con la siguiente y podremos volver a esto más tarde si lo deseas.'
      ];
    }
    return [errorMessage];
  }

  private getNextStep(currentStep: OnboardingStep): OnboardingStep {
    const stepOrder: OnboardingStep[] = [
      'WELCOME',
      'CONFIRM_START',
      'NAME',
      'GENDER',
      'AGE',
      'WORK_STATUS',
      'HOME_STATUS',
      'PROBLEM_HISTORY',
      'TRIGGERS',
      'CHECKIN_TIME',
      'RECOVERY_DATE',
      'COMPLETED'
    ];
    
    const currentIndex = stepOrder.indexOf(currentStep);
    return stepOrder[currentIndex + 1] || 'COMPLETED';
  }

  public async handleMessage(message: string): Promise<string[]> {
    try {
      let interpretedData: any;

      switch (this.state.step) {
        case 'WELCOME':
          if (message.toLowerCase().includes('si') || message.toLowerCase().includes('sí') || 
              message.toLowerCase().includes('ok') || message.toLowerCase().includes('vale')) {
            this.state.step = 'CONFIRM_START';
            return this.getPromptForStep('CONFIRM_START');
          }
          return ['¿Te gustaría comenzar? Puedes decir "sí" cuando estés list@.'];

        case 'CONFIRM_START':
          if (message.toLowerCase().includes('si') || message.toLowerCase().includes('sí') || 
              message.toLowerCase().includes('ok') || message.toLowerCase().includes('vale')) {
            this.state.step = 'NAME';
            return this.getPromptForStep('NAME');
          }
          return ['Cuando estés list@ para comenzar, solo dime "sí".'];

        case 'NAME':
          interpretedData = await this.interpretWithClaude(message, "Extract the user's name. Return { name: string, confidence: 'high'|'low' }");
          if (interpretedData?.name && interpretedData.confidence === 'high') {
            this.state.data.name = interpretedData.name;
            this.state.step = 'GENDER';
            return this.getPromptForStep('GENDER').map(msg => msg.replace('${name}', interpretedData.name));
          }
          return this.handleRetry('Lo siento, no pude entender tu nombre. ¿Podrías decírmelo nuevamente?');

        case 'GENDER':
          interpretedData = await this.interpretWithClaude(message, 
            "Classify gender into: MALE, FEMALE, NON_BINARY, OTHER, PREFER_NOT_TO_SAY. " +
            "Look for keywords like 'masculino'/'hombre' for MALE, 'femenino'/'mujer' for FEMALE, " +
            "'no binario' for NON_BINARY, 'prefiero no decir' for PREFER_NOT_TO_SAY");
          if (interpretedData?.gender) {
            this.state.data.gender = interpretedData.gender;
            this.state.step = 'AGE';
            return this.getPromptForStep('AGE');
          }
          return this.handleRetry(
            'Lo siento, no pude entender tu respuesta. ¿Podrías elegir una de estas opciones?\n' +
            '- Masculino\n- Femenino\n- No binario\n- Otro\n- Prefiero no decirlo'
          );

        case 'AGE':
          interpretedData = await this.interpretWithClaude(message, "Extract age as a number between 18 and 100");
          if (interpretedData?.age && typeof interpretedData.age === 'number') {
            this.state.data.age = interpretedData.age;
            this.state.step = 'WORK_STATUS';
            return this.getPromptForStep('WORK_STATUS');
          }
          return this.handleRetry('Lo siento, no pude entender tu edad. ¿Podrías decirme cuántos años tienes usando números?');

        case 'WORK_STATUS':
          interpretedData = await this.interpretWithClaude(message, "Classify work status into: EMPLOYED, UNEMPLOYED, STUDENT, RETIRED, OTHER");
          if (interpretedData?.workStatus) {
            this.state.data.workStatus = interpretedData.workStatus;
            this.state.step = 'HOME_STATUS';
            return this.getPromptForStep('HOME_STATUS');
          }
          return this.handleRetry('¿Podrías decirme si trabajas, estudias, estás retirad@, o cuál es tu situación actual?');

        case 'HOME_STATUS':
          interpretedData = await this.interpretWithClaude(message, 
            "Classify living situation into: LIVES_ALONE, LIVES_WITH_FAMILY, LIVES_WITH_ROOMMATES, HOMELESS, OTHER");
          if (interpretedData?.homeStatus) {
            this.state.data.homeStatus = interpretedData.homeStatus;
            this.state.step = 'PROBLEM_HISTORY';
            return this.getPromptForStep('PROBLEM_HISTORY');
          }
          return this.handleRetry('¿Podrías decirme si vives sol@, con familia, con compañeros de piso, u otra situación?');

        case 'PROBLEM_HISTORY':
          // Store the raw response and move forward - this is a sensitive question
          this.state.data.allMessages = [...(this.state.data.allMessages || []), message];
          this.state.step = 'TRIGGERS';
          return this.getPromptForStep('TRIGGERS');

        case 'TRIGGERS':
          interpretedData = await this.interpretWithClaude(message, 
            "Extract potential trigger situations or times. Return { triggers: string[], confidence: 'high'|'low' }");
          if (interpretedData?.triggers && interpretedData.confidence === 'high') {
            this.state.data.triggers = interpretedData.triggers;
            this.state.step = 'CHECKIN_TIME';
            return this.getPromptForStep('CHECKIN_TIME');
          }
          return this.handleRetry(
            'Para ayudarte mejor, necesito entender en qué momentos necesitas más apoyo.\n' +
            '¿Podrías mencionar situaciones específicas? Por ejemplo:\n' +
            '- "Los viernes por la noche"\n' +
            '- "Cuando estoy estresad@"\n' +
            '- "En reuniones sociales"'
          );

        case 'CHECKIN_TIME':
          // First, get the evening check-in time (required)
          if (!this.state.data.eveningCheckInTime) {
            interpretedData = await this.interpretWithClaude(message, 
              "Extract evening time in 24-hour format. Return { time: string, confidence: 'high'|'low' }. Example: '21:00' for 9 PM");
            if (interpretedData?.time && interpretedData.confidence === 'high') {
              this.state.data.eveningCheckInTime = interpretedData.time;
              return [
                '¡Perfecto! Te haré el check-in todas las noches a las ' + interpretedData.time + '.',
                '¿Te gustaría agregar un check-in opcional en la mañana? Puedes decir "no" o indicar una hora.'
              ];
            }
            return this.handleRetry(
              'Necesito saber a qué hora de la noche prefieres hacer el check-in.\n' +
              'Por ejemplo: "9:00 PM" o "21:00"'
            );
          }
          
          // Then, handle the morning check-in time (optional)
          if (message.toLowerCase().includes('no')) {
            this.state.data.morningCheckInTime = null;
            this.state.step = 'RECOVERY_DATE';
            return this.getPromptForStep('RECOVERY_DATE');
          }

          interpretedData = await this.interpretWithClaude(message,
            "Extract morning time in 24-hour format. Return { time: string, confidence: 'high'|'low' }. Example: '08:00' for 8 AM");
          if (interpretedData?.time && interpretedData.confidence === 'high') {
            this.state.data.morningCheckInTime = interpretedData.time;
            this.state.step = 'RECOVERY_DATE';
            return this.getPromptForStep('RECOVERY_DATE');
          }
          
          return this.handleRetry(
            'Si quieres un check-in matutino, dime a qué hora. Por ejemplo: "8:00 AM" o "08:00".\n' +
            'Si no lo deseas, simplemente di "no".'
          );

        case 'RECOVERY_DATE':
          interpretedData = await this.interpretWithClaude(message, 
            "Extract date or 'today'. Return { date: string, isToday: boolean, confidence: 'high'|'low' }");
          if (interpretedData?.confidence === 'high') {
            this.state.data.sobrietyStartDate = interpretedData.isToday ? new Date() : new Date(interpretedData.date);
            this.state.step = 'COMPLETED';
            return this.getPromptForStep('COMPLETED');
          }
          return this.handleRetry(
            'Puedes decirme "hoy" o una fecha específica para iniciar tu proceso.\n' +
            'Por ejemplo: "1 de abril" o "hoy mismo"'
          );

        case 'COMPLETED':
          return ['Estoy aquí para apoyarte. ¿Hay algo específico en lo que pueda ayudarte ahora?'];

        default:
          console.error('Invalid step:', this.state.step);
          return ['Lo siento, ha ocurrido un error. Volvamos a empezar.'];
      }
    } catch (error) {
      console.error('Error in handleMessage:', error);
      return [
        'Lo siento, ha ocurrido un error inesperado.',
        '¿Te gustaría continuar desde donde estábamos o preferirías comenzar de nuevo?'
      ];
    }
  }
}

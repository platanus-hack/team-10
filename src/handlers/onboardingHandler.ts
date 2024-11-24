import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient, type User } from "@prisma/client";
import config from "../config/config";

const anthropic = new Anthropic({
  apiKey: config.claude.apiKey,
});

const prisma = new PrismaClient();

export type OnboardingStep =
  | "WELCOME"
  | "NAME"
  | "GENDER"
  | "AGE"
  | "WORK_STATUS"
  | "HOME_STATUS"
  | "PROBLEM_HISTORY"
  | "TRIGGERS"
  | "EVENING_CHECKIN"
  | "MORNING_CHECKIN"
  | "RECOVERY_DATE"
  | "COMPLETED";

interface OnboardingState {
  step: OnboardingStep;
  data: Partial<User>;
  retryCount: number;
}

export class OnboardingHandler {
  private state: OnboardingState = {
    step: "WELCOME",
    data: {},
    retryCount: 0,
  };

  private readonly MAX_RETRIES = 3;

  constructor(private readonly phoneNumber: string) {
    if (!phoneNumber) {
      throw new Error("Phone number is required for onboarding");
    }
  }

  public get currentStep(): OnboardingStep {
    return this.state.step;
  }

  private getPromptForStep(step: OnboardingStep): string[] {
    const prompts: Record<OnboardingStep, string[]> = {
      WELCOME: [
        "¡Hola! Un gusto conocerte, mi nombre es SoBuddy y seré tu compañero en este proceso. 🤝",
        "Este es un espacio seguro y confidencial donde podremos trabajar juntos en tu recuperación.",
        "Me gustaría hacerte unas preguntas iniciales para conocerte mejor. Tomarán aproximadamente 10 minutos.",
        "Comencemos por lo básico, ¿cuál es tu nombre?",
      ],
      NAME: [
        "Puedes usar tu nombre real o un apodo, como te sientas más cómod@.",
      ],
      GENDER: [
        "Un gusto ${name}! Para poder dirigirme a ti de la mejor manera...",
        "¿Con qué género te identificas?",
        "Puedes elegir entre:\n- Masculino\n- Femenino\n- No binario\n- Otro\n- Prefiero no decirlo",
      ],
      AGE: [
        "Gracias por compartir eso conmigo.",
        "¿Te molestaría decirme cuántos años tienes?",
      ],
      WORK_STATUS: [
        "Entiendo. Y cuéntame, ¿a qué te dedicas actualmente?",
        "¿Trabajas? ¿Estudias? Puedes ser tan detallad@ como desees.",
      ],
      HOME_STATUS: [
        "Y actualmente, ¿con quién vives?",
        "Esta información me ayuda a entender mejor tu entorno de apoyo.",
      ],
      PROBLEM_HISTORY: [
        "Ahora vamos a hablar de algo un poco más personal.",
        "Recuerda que esta es una conversación privada y confidencial. Si en algún momento te sientes incómod@, podemos hacer una pausa.",
        "¿Hace cuánto tiempo presentas este problema con el alcohol y hace cuánto estás trabajando para dejarlo o reducirlo?",
      ],
      TRIGGERS: [
        "Gracias por compartir eso conmigo. Es importante identificar las situaciones de riesgo para poder manejarlas mejor.",
        "¿En qué momentos sientes que necesitas más apoyo?",
        "Por ejemplo:\n- Días específicos de la semana\n- Situaciones sociales\n- Estados emocionales particulares",
      ],
      EVENING_CHECKIN: [
        "Para ayudarte mejor, me gustaría hacer check-ins diarios contigo.",
        "Son breves conversaciones para ver cómo vas y brindarte apoyo cuando lo necesites.",
        "Haremos un check-in obligatorio en la noche para evaluar cómo te fue en el día, y opcionalmente podemos agregar uno en la mañana para empezar el día con motivación.",
        "Primero, ¿a qué hora de la noche te gustaría hacer el check-in? Por ejemplo: 9:00 PM",
      ],
      MORNING_CHECKIN: [
        "¡Perfecto! Haré el check-in todas las noches a las ${eveningTime}.",
        "¿Te gustaría agregar un check-in opcional en la mañana?",
        'Puedes decirme una hora (ejemplo: 8:00 AM) o simplemente responder "no" si prefieres solo el check-in nocturno.',
      ],
      RECOVERY_DATE: [
        "¡Excelente! Ya casi terminamos.",
        "¿Te gustaría establecer una fecha oficial de inicio para tu proceso de recuperación?",
        "Puede ser hoy o cualquier otra fecha significativa para ti.",
      ],
      COMPLETED: [
        "¡Perfecto! Ya estamos list@s para comenzar este proceso juntos. 🌟",
        "Estaré aquí para apoyarte en cada paso del camino.",
        "Recuerda que puedes escribirme en cualquier momento si necesitas ayuda o simplemente quieres conversar.",
      ],
    };

    return prompts[step];
  }

  private handleRetry(errorMessage: string): string[] {
    this.state.retryCount++;
    if (this.state.retryCount >= this.MAX_RETRIES) {
      this.state.retryCount = 0;
      const currentStep = this.state.step;
      this.state.step = this.getNextStep(currentStep);
      return [
        "Parece que estamos teniendo dificultades con esta pregunta.",
        "Continuemos con la siguiente y podremos volver a esto más tarde si lo deseas.",
      ];
    }
    return [errorMessage];
  }

  private getNextStep(currentStep: OnboardingStep): OnboardingStep {
    const stepOrder: OnboardingStep[] = [
      "WELCOME",
      "NAME",
      "GENDER",
      "AGE",
      "WORK_STATUS",
      "HOME_STATUS",
      "PROBLEM_HISTORY",
      "TRIGGERS",
      "EVENING_CHECKIN",
      "MORNING_CHECKIN",
      "RECOVERY_DATE",
      "COMPLETED",
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    return stepOrder[currentIndex + 1] || "COMPLETED";
  }

  private async createUserProfile(): Promise<void> {
    if (this.state.step !== "COMPLETED") {
      throw new Error(
        "Cannot create user profile before onboarding is completed"
      );
    }

    const {
      name,
      gender,
      age,
      workStatus,
      homeStatus,
      triggers,
      sobrietyStartDate,
      eveningCheckInTime,
      morningCheckInTime,
      riskLevel,
    } = this.state.data;

    if (!name || !eveningCheckInTime) {
      throw new Error("Missing required fields for user profile");
    }

    try {
      await prisma.user.create({
        data: {
          phoneNumber: this.phoneNumber,
          name,
          gender,
          age,
          workStatus,
          homeStatus,
          triggers: triggers || [],
          copingStrategies: [],
          riskLevel: riskLevel || 0,
          sobrietyStartDate,
          eveningCheckInTime,
          morningCheckInTime,
          isActive: true,
        },
      });
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw new Error("Failed to create user profile");
    }
  }

  private async interpretWithClaude(
    message: string,
    context: string
  ): Promise<any> {
    try {
      const prompt = `
        Context: ${context}
        User message: "${message}"
        
        Extract the relevant information from the user's message and return it in a structured JSON format.
        If you're unsure about the interpretation, return { "confidence": "low" } instead of guessing.
        Only return the JSON, no other text.
      `;

      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
        system:
          'You are a helpful assistant that extracts structured data from user messages. Only respond with valid JSON. Be conservative in your interpretations - if you\'re not confident, return { "confidence": "low" }.',
        temperature: 0,
      });

      const content = response.content.find((c) => c.type === "text")?.text;
      if (!content) {
        throw new Error("No text content in response");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Error interpreting message with Claude:", error);
      return { confidence: "low" };
    }
  }

  public async handleMessage(message: string | null = null): Promise<string[]> {
    try {
      let response: string[];
      let interpretedData: any;

      switch (this.state.step) {
        case "WELCOME":
          // Send welcome message and transition to NAME state
          response = this.getPromptForStep("WELCOME");
          this.state.step = "NAME";
          return response;

        case "NAME":
          if (!message) {
            return this.getPromptForStep("NAME");
          }
          
          interpretedData = await this.interpretWithClaude(
            message,
            "Extract the user's name"
          );
          if (interpretedData?.name && interpretedData.confidence === "high") {
            this.state.data.name = interpretedData.name;
            this.state.step = "GENDER";
            response = this.getPromptForStep("GENDER").map((msg) =>
              msg.replace("${name}", interpretedData.name)
            );
          } else {
            response = this.handleRetry(
              "Lo siento, no pude entender tu nombre. ¿Podrías decírmelo nuevamente?"
            );
          }
          return response;

        case "GENDER":
          if (!message) {
            return this.getPromptForStep("GENDER");
          }

          interpretedData = await this.interpretWithClaude(
            message,
            "Classify gender into: MALE, FEMALE, NON_BINARY, OTHER, PREFER_NOT_TO_SAY"
          );
          if (interpretedData?.gender) {
            this.state.data.gender = interpretedData.gender;
            this.state.step = "AGE";
            return this.getPromptForStep("AGE");
          }
          return this.handleRetry(
            "Lo siento, no pude entender tu respuesta. ¿Podrías elegir una de estas opciones?\n" +
              "- Masculino\n- Femenino\n- No binario\n- Otro\n- Prefiero no decirlo"
          );

        case "AGE":
          if (!message) {
            return this.getPromptForStep("AGE");
          }

          interpretedData = await this.interpretWithClaude(
            message,
            "Extract age as a number between 18 and 100"
          );
          if (interpretedData?.age && typeof interpretedData.age === "number") {
            this.state.data.age = interpretedData.age;
            this.state.step = "WORK_STATUS";
            return this.getPromptForStep("WORK_STATUS");
          }
          return this.handleRetry(
            "Lo siento, no pude entender tu edad. ¿Podrías decirme cuántos años tienes usando números?"
          );

        case "WORK_STATUS":
          if (!message) {
            return this.getPromptForStep("WORK_STATUS");
          }

          interpretedData = await this.interpretWithClaude(
            message,
            "Classify work status into: EMPLOYED, UNEMPLOYED, STUDENT, RETIRED, OTHER"
          );
          if (interpretedData?.workStatus) {
            this.state.data.workStatus = interpretedData.workStatus;
            this.state.step = "HOME_STATUS";
            return this.getPromptForStep("HOME_STATUS");
          }
          return this.handleRetry(
            "¿Podrías decirme si trabajas, estudias, estás retirad@, o cuál es tu situación actual?"
          );

        case "HOME_STATUS":
          if (!message) {
            return this.getPromptForStep("HOME_STATUS");
          }

          interpretedData = await this.interpretWithClaude(
            message,
            "Classify living situation into: LIVES_ALONE, LIVES_WITH_FAMILY, LIVES_WITH_ROOMMATES, HOMELESS, OTHER"
          );
          if (interpretedData?.homeStatus) {
            this.state.data.homeStatus = interpretedData.homeStatus;
            this.state.step = "PROBLEM_HISTORY";
            return this.getPromptForStep("PROBLEM_HISTORY");
          }
          return this.handleRetry(
            "¿Podrías decirme si vives sol@, con familia, con compañeros de piso, u otra situación?"
          );

        case "PROBLEM_HISTORY":
          if (!message) {
            return this.getPromptForStep("PROBLEM_HISTORY");
          }

          this.state.step = "TRIGGERS";
          return this.getPromptForStep("TRIGGERS");

        case "TRIGGERS":
          if (!message) {
            return this.getPromptForStep("TRIGGERS");
          }

          interpretedData = await this.interpretWithClaude(
            message,
            "Extract potential trigger situations or times. Return { triggers: string[], confidence: 'high'|'low' }"
          );
          if (interpretedData?.triggers && interpretedData.confidence === "high") {
            this.state.data.triggers = interpretedData.triggers;
            this.state.step = "EVENING_CHECKIN";
            return this.getPromptForStep("EVENING_CHECKIN");
          }
          return this.handleRetry(
            "Para ayudarte mejor, necesito entender en qué momentos necesitas más apoyo.\n" +
              "¿Podrías mencionar situaciones específicas? Por ejemplo:\n" +
              '- "Los viernes por la noche"\n' +
              '- "Cuando estoy estresad@"\n' +
              '- "En reuniones sociales"'
          );

        case "EVENING_CHECKIN":
          if (!message) {
            return this.getPromptForStep("EVENING_CHECKIN");
          }

          interpretedData = await this.interpretWithClaude(
            message,
            "Extract evening time in 24-hour format. Return { time: string, confidence: 'high'|'low' }"
          );
          if (interpretedData?.time && interpretedData.confidence === "high") {
            this.state.data.eveningCheckInTime = interpretedData.time;
            this.state.step = "MORNING_CHECKIN";
            return this.getPromptForStep("MORNING_CHECKIN").map((msg) =>
              msg.replace("${eveningTime}", interpretedData.time)
            );
          }
          return this.handleRetry(
            "Necesito saber a qué hora de la noche prefieres hacer el check-in.\n" +
              'Por ejemplo: "9:00 PM" o "21:00"'
          );

        case "MORNING_CHECKIN":
          if (!message) {
            return this.getPromptForStep("MORNING_CHECKIN");
          }

          if (message.toLowerCase().includes("no")) {
            this.state.data.morningCheckInTime = null;
            this.state.step = "RECOVERY_DATE";
            return this.getPromptForStep("RECOVERY_DATE");
          }

          interpretedData = await this.interpretWithClaude(
            message,
            "Extract morning time in 24-hour format. Return { time: string, confidence: 'high'|'low' }"
          );
          if (interpretedData?.time && interpretedData.confidence === "high") {
            this.state.data.morningCheckInTime = interpretedData.time;
            this.state.step = "RECOVERY_DATE";
            return this.getPromptForStep("RECOVERY_DATE");
          }

          return this.handleRetry(
            'Si quieres un check-in matutino, dime a qué hora. Por ejemplo: "8:00 AM" o "08:00".\n' +
              'Si no lo deseas, simplemente di "no".'
          );

        case "RECOVERY_DATE":
          if (!message) {
            return this.getPromptForStep("RECOVERY_DATE");
          }

          interpretedData = await this.interpretWithClaude(
            message,
            "Extract date or 'today'. Return { date: string, isToday: boolean, confidence: 'high'|'low' }"
          );
          if (interpretedData?.confidence === "high") {
            this.state.data.sobrietyStartDate = interpretedData.isToday
              ? new Date()
              : new Date(interpretedData.date);
            this.state.step = "COMPLETED";
            await this.createUserProfile();
            return this.getPromptForStep("COMPLETED");
          }
          return this.handleRetry(
            'Puedes decirme "hoy" o una fecha específica para iniciar tu proceso.\n' +
              'Por ejemplo: "1 de abril" o "hoy mismo"'
          );

        case "COMPLETED":
          return [
            "Estoy aquí para apoyarte. ¿Hay algo específico en lo que pueda ayudarte ahora?",
          ];

        default:
          console.error("Invalid step:", this.state.step);
          return ["Lo siento, ha ocurrido un error. Volvamos a empezar."];
      }
    } catch (error) {
      console.error("Error in handleMessage:", error);
      return [
        "Lo siento, ha ocurrido un error inesperado.",
        "¿Te gustaría continuar desde donde estábamos o preferirías comenzar de nuevo?",
      ];
    }
  }
}
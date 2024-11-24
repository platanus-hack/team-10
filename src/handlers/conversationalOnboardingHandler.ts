import type {
  ContentBlock,
  Message,
  MessageParam,
  Tool,
  ToolUseBlock,
} from "@anthropic-ai/sdk/src/resources/messages.js";
import config from "../config/config";
import Anthropic from "@anthropic-ai/sdk";
import type { TimeTrigger, User } from "@prisma/client";
import { z } from "zod";
import prisma from "../lib/prisma";

const SYSTEM_PROMPT =
  "Eres un chatbot de onboarding para una app diseñada que asiste a personas adictas al alcohol. Quiero que me ayudes a interactivamente extraer algunos datos del usuario.";

function task_specific_instructions(user_input: string) {
  return `
Sigue estas pautas para la interacción:

La interacción tiene tres etapas. La primera consiste de los siguientes pasos

1. Saluda amistosamente y presentate como una ayuda en el camino de la sobriedad. Te voy a ayudar de tres formas distintas: con check-ins diarios, con extra atención en fechas de alto riesgo y estando siempre para ti cuando lo necesites.
2. Explica brevemente el propósito de las preguntas.
3. Haz una pregunta a la vez, esperando la respuesta del usuario antes de pasar a la siguiente.
4. Usa un tono cálido y respetuoso en todo momento.
5. Si el usuario proporciona información adicional o irrelevante, agradécele pero mantén el enfoque en los datos requeridos.
6. Si el usuario no responde la pregunta, reitera sobre esta.
7. Cuando hayas completado la primera etapa gatilla la tool user_profile (no le digas al usuario que acabas de gatillar esta tool)
8. En ese mismo mensaje donde llamas a la tool, quiero que hagas la primera pregunta de la segunda etapa

La segunda consiste de los siguiente pasos:
1. Haz una pregunta a la vez, esperando la respuesta del usuario antes de pasar a la siguiente.
2. Cuando tengas todos los datos gatilla la tool user_tuning_details, luego, continúa la conversación

La tercera consiste de los siguientes pasos:
1. Explicar lo que hay horarios de mayor riesgo de consumo, como los viernes en la noche o los sábados en la noche
2. preguntar acerca de posibles horarios de la semana en que el usuario desea recibir mensajes adicionales, sugerir horarios específicos para que el usuario pueda solo asentir.
3. seguir preguntan hasta que el usuario deje de entregar horarios
4. gatillar la tool user_weekly_reminders
5. Despedirse y decirle dos cosas. Que el usuario te puede contactar en cualquier momento y que el asistente le escribirá en el próximo check-in

datos a conseguir de la primera etapa:
nombre, genero, edad, ocupación, situación marital, convivientes

datos a consegiur en la segunda estapa:
1) hora del check-in nocturno proactivo nocturno. esto es una hora en la tarde/noche en la cuál el usuario desea que el asistente lo asista con su problema de alcoholismo. dilo como a qué hora quieres que conversemos diariamente. sugiere que sea antes de irse a dormir.
2) hora del check-in proactivo diurno. esto es una hora en la tarde/noche en la cuál el usuario desea que el asistente lo asista con su problema de alcoholismo. Es opcional, preguntar si desea este check-in.
3)Cuanto tiempo lleva el usuario sin beber, no seas juzgador.

Actualiza el JSON después de cada interacción, rellenando los campos correspondientes con la información proporcionada por el usuario. Si un dato aún no se ha obtenido, déjalo vacío (para strings) o null (para números).

Ejemplo de interacción:

Asistente: ¡Hola! Soy un asistente virtual y me gustaría hacerte algunas preguntas para conocerte mejor. ¿Podrías decirme tu nombre, por favor?

Usuario: Me llamo María.

Asistente: ¡Encantado de conocerte, María! Gracias por compartir tu nombre conmigo. Ahora, ¿podrías decirme con qué género te identificas?

Usuario: Soy mujer.

Asistente: Entendido, María. Gracias por compartir esa información. ¿Me podrías decir cuántos años tienes?

Usuario: Tengo 28 años.

Asistente: Gracias, María. ¿podrías decirme cuál es tu ocupación actual? puede ser trabajando, estudiando o ninguna de estas

Usuario: actualmente estudio.

Asistente: ¡Genial, María! Gracias por compartir esa información. Otra duda, de momento tienes pareja o estás viendo a alguien. Tranquila que tu privacidad se mantendrá intacta.

Usuario: Salgo con alguien hace 3 meses

Asistente: Súper, espero que eso pueda llegar a puerto. Respecto a tu hogar, vives con alguien?

Usuario: Vivo con mi madre

JSON FINAL:

user_profile{
  "name": "María",
  "gender": "FEMALE",
  "age": 28,
  "workStatus": STUDENT,
  "relationshipStatus": COMPLICATED
  "homeStatus": LIVES_WITH_FAMILY
}

Asistente: Muchas gracias! A qué hora de la tarde o noche te gustaría que te escribiese?

User: a las 8 suena bien

Asistente: Y en la mañana deseas que te escriba también o no lo ves necesario? por ejemplo a las 9am

User: No , no es necesario

Asistente: Otra cosa más, recuerda que este es un tema que se queda entre nosotros dos y que no hay respuestas incorrectas. Cuántos días de sobriedad llevas en este momento?

User: Como 5

JSON FINAL:

user_tuning_details({
  "day_check": "NULL",
  "sober_days": "5",
  "night_check": "20:00"
})

Asistente: María, esos 5 días son un gran logro. Ahora, me gustaría hablar sobre algo importante. Sabemos que hay momentos de la semana que pueden ser más desafiantes que otros, donde podríamos necesitar un apoyo extra. Por ejemplo, los viernes o sábados en la noche suelen ser momentos más complicados para muchas personas. 

¿Te gustaría que te acompañe en algún momento específico de la semana? Por ejemplo, ¿los viernes a las 7 de la noche podría ser un buen momento?

User: bueno

Asistente: Perfecto, anotado los viernes a las 21:00. ¿Hay algún otro momento de la semana que sientas que podría ser desafiante y te gustaría que estuviera ahí para apoyarte? Por ejemplo, ¿los sábados por la noche también?


User: okey

JSON final:

user_weekly_reminders({
  "weekly_reminders": [
    "21:00, FRIDAY",
    "21:00, SATURDAY"
  ]
})

Asistente: María, ha sido muy valioso conocerte y que me hayas compartido tu historia. Recuerda que puedes escribirme en cualquier momento si necesitas conversar, no solo en los horarios que acordamos. Estaré aquí para escucharte y apoyarte.

Nos vemos esta noche a las 9 para nuestro primer check-in. ¡Que tengas un excelente día!


Recuerda mantener este estilo de interacción amigable y actualizar el JSON después de cada respuesta del usuario. 

Todos lo mensjaes siguinetes provienen del usuario. Es importante que no sea evidente que estás tratando de extraer sus datos, debe ser lo más natural posible.

Puedes mencionar que esta conversación es totalmente confidencial, no seas repetitivo respecto a ese punto. El usuario es chileno, para que no ocupes expresiones de otras partes de hispanoamérica. podrías llegar a ocupar algún slang o dicho pero no abuses.

Además, evita mensajes como "ya casi estamos" o "perfecto, solo me queda un dato más". Tu nombre es SoBuddy. No siempre des las gracias a cada instante, se ve un poco forzado.

<user_input>
{{USER_INPUT}}
</user_input>`;
}

const TOOLS: Tool[] = [
  {
    name: "user_profile",
    description: "Genera el perfil del usuario",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "nombre del usuario, es una string",
        },
        gender: {
          type: "string",
          description:
            "género del usuario, debe ser una de estas opciones: MALE, FEMALE, NON_BINARY, OTHER, PREFER_NOT_TO_SAY",
        },
        age: {
          type: "number",
          description: "edad del usuario",
        },
        workStatus: {
          type: "string",
          description:
            "ocupación del usuario, debe ser: EMPLOYED, UNEMPLOYED, STUDENT, RETIRED, OTHER",
        },
        relationshipStatus: {
          type: "string",
          description:
            "situación marital del usuario, debe ser: SINGLE, MARRIED, DIVORCED, WIDOWED, IN_RELATIONSHIP, COMPLICATED, OTHER",
        },
        homeStatus: {
          type: "string",
          description:
            "vivienda del usuario, debe ser: LIVES_ALONE, LIVES_WITH_FAMILY, LIVES_WITH_ROOMMATES, HOMELESS, OTHER",
        },
      },
      required: [
        "name",
        "gender",
        "age",
        "workStatus",
        "relationshipStatus",
        "homeStatus",
      ],
    },
  },
  {
    name: "user_tuning_details",
    description:
      "Genera los detalles del usuario, en particular, obtiene los datos de hora del check-in nocturno, hora del check-in diurno, y número de días de sobriedad",
    input_schema: {
      type: "object",
      properties: {
        night_check: {
          type: "string",
          description:
            "Hora del usuario para el inicio nocturno de su conversación. Ejemplo: 13:00",
        },
        day_check: {
          type: ["string", "null"],
          description:
            "Hora del usuario para el inicio diurno de su conversación (opcional). Pasar `null` en caso de que no desee check-in diurno. Ejemplo: 13:00",
        },
        sober_days: {
          type: "number",
          description:
            "Cantidad de días que el usuario lleva en estado de sobriedad",
        },
      },
      required: ["night_check", "sober_days"],
    },
  },
  {
    name: "user_weekly_reminders",
    description:
      "Obtiene los triggers del usuario, es decir, horarios de alto riesgo para recaer en el consumo de alcohol.",
    input_schema: {
      type: "object",
      properties: {
        weekly_reminders: {
          type: "array",
          description:
            "Lista de horarios de la semana que representan un alto riesgo para recaer en el consumo de alcohol. debe ser en el formato 'HOUR, DAY' Ejemplo: ['19:00, FRIDAY', '22:00, SATURDAY']",
          items: {
            type: "string",
            description:
              "Hora de la semana específica en la que el usuario es probable que recaiga en el alcohol",
          },
        },
      },
      required: ["weekly_reminders"],
    },
  },
];

const BasicUserProfile = z.object({
  name: z.string().min(1),
  gender: z.enum([
    "MALE",
    "FEMALE",
    "NON_BINARY",
    "OTHER",
    "PREFER_NOT_TO_SAY",
  ]),
  age: z.number().int().positive(),
  workStatus: z.enum(["EMPLOYED", "UNEMPLOYED", "STUDENT", "RETIRED", "OTHER"]),
  relationshipStatus: z.enum([
    "SINGLE",
    "MARRIED",
    "DIVORCED",
    "WIDOWED",
    "IN_RELATIONSHIP",
    "COMPLICATED",
    "OTHER",
  ]),
  homeStatus: z.enum([
    "LIVES_ALONE",
    "LIVES_WITH_FAMILY",
    "LIVES_WITH_ROOMMATES",
    "HOMELESS",
    "OTHER",
  ]),
});

const UserTuningDetails = z.object({
  night_check: z.string().regex(/^\d{2}:\d{2}$/),
  day_check: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  sober_days: z.number().int().positive(),
});

const UserWeeklyReminders = z.object({
  weekly_reminders: z.array(
    z
      .string()
      .regex(
        /^\d{2}:\d{2}, (MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)$/
      )
  ),
});

class OnboardingHandler {
  state: "ACTIVE" | "COMPLETED" = "ACTIVE";
  private messages: MessageParam[];
  private readonly claude: Anthropic;
  private basicUserProfile: z.infer<typeof BasicUserProfile>;
  private userTuningDetails: z.infer<typeof UserTuningDetails>;
  private userWeeklyReminders: z.infer<typeof UserWeeklyReminders>;
  private phoneNumber: string;

  constructor(phoneNumber: string) {
    this.phoneNumber = phoneNumber;
    this.claude = new Anthropic({
      apiKey: config.claude.apiKey,
    });
    this.messages = [];
  }

  /**
   * Handles incoming messages and adds them to the message chain
   * @param message - The message text from the user
   * @returns Promise with the assistant's response
   */
  public async handleMessage(message: string | undefined): Promise<string[]> {
    if (this.messages.length === 0 && message) {
      this.addUserMessage(task_specific_instructions(message));
    } else if (message) {
      this.addUserMessage(message);
    }

    const response = await this.promptModel();

    const responseMessages: string[] = [];

    for (const block of response.content) {
      switch (block.type) {
        case "text":
          this.addAssistantMessage(block.text);
          responseMessages.push(...block.text.split("\n"));
          break;
        case "tool_use":
          switch (block.name) {
            case "user_profile":
              console.debug("Inputted user profile:", block.input);
              const basicUserProfileResult = BasicUserProfile.safeParse(
                block.input
              );
              if (basicUserProfileResult.success) {
                this.basicUserProfile = basicUserProfileResult.data;
                this.addToolResult(block, "success");
              } else {
                this.addToolResult(block, `error (please retry): ${basicUserProfileResult.error.errors}`);
                console.error(
                  "Error parsing basic user profile: ",
                  basicUserProfileResult.error.errors
                );
              }
              return this.handleMessage(undefined);
            case "user_tuning_details":
              console.debug("Inputted user tuning details:", block.input);
              const userTuningDetailsResult = UserTuningDetails.safeParse(
                block.input
              );
              if (userTuningDetailsResult.success) {
                this.userTuningDetails = userTuningDetailsResult.data;
                this.addToolResult(block, "success");
              } else {
                this.addToolResult(block, `error (please retry): ${userTuningDetailsResult.error.errors}`);
                console.error(
                  "Error parsing user tuning details: ",
                  userTuningDetailsResult.error.errors
                );
              }
              return this.handleMessage(undefined);
            case "user_weekly_reminders":
              console.debug(
                "Inputted user weekly reminders:",
                block.input
              );
              const userWeeklyRemindersResult = UserWeeklyReminders.safeParse(
                block.input
              );
              if (userWeeklyRemindersResult.success) {
                this.userWeeklyReminders = userWeeklyRemindersResult.data;
                this.addToolResult(block, "success");
              } else {
                this.addToolResult(block, `error (please retry): ${userWeeklyRemindersResult.error.errors}`);
                console.error(
                  "Error parsing user weekly reminders: ",
                  userWeeklyRemindersResult.error.errors
                );
              }
              return this.handleMessage(undefined);
            default:
              throw new Error(`Unknown tool: ${block.name}`);
          }
      }
    }

    // Termination condition
    if (
      this.basicUserProfile &&
      this.userTuningDetails &&
      this.userWeeklyReminders
    ) {
      await this.createUserProfile();
      this.state = "COMPLETED";
    }

    return responseMessages;
  }

  private async createUserProfile(): Promise<User> {
    console.debug("Creating user profile in database");
    // Today - sober_days
    const sobrietyStartDate = new Date();
    sobrietyStartDate.setDate(
      sobrietyStartDate.getDate() - this.userTuningDetails.sober_days
    );

    // Parse night_check and day_check into times of the day
    const nightCheckInTime = new Date();
    const [nightHours, nightMinutes] =
      this.userTuningDetails.night_check.split(":");
    nightCheckInTime.setHours(parseInt(nightHours, 10));
    nightCheckInTime.setMinutes(parseInt(nightMinutes, 10));
    // TODO: Account for timezone
    const dayCheckInTime = this.userTuningDetails.day_check ? new Date() : null;
    if (dayCheckInTime) {
      const [dayHours, dayMinutes] =
        this.userTuningDetails.day_check.split(":");
      dayCheckInTime.setHours(parseInt(dayHours, 10));
      dayCheckInTime.setMinutes(parseInt(dayMinutes, 10));
    }

    return prisma.user.create({
      data: {
        phoneNumber: this.phoneNumber,
        name: this.basicUserProfile.name,
        gender: this.basicUserProfile.gender,
        age: this.basicUserProfile.age,
        workStatus: this.basicUserProfile.workStatus,
        relationshipStatus: this.basicUserProfile.relationshipStatus,
        homeStatus: this.basicUserProfile.homeStatus,
        sobrietyStartDate: sobrietyStartDate,
        eveningCheckInTime: nightCheckInTime,
        morningCheckInTime: dayCheckInTime,
      },
    });
  }

  private addUserMessage(message: string): void {
    this.messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: message,
        },
      ],
    });
  }

  private addAssistantMessage(message: string): void {
    this.messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: message,
        },
      ],
    });
  }

  private addToolResult(tool_block: ToolUseBlock, result: string): void {
    this.messages.push({
      role: "assistant",
      content: [
        {
          ...tool_block,          
        },
      ],
    });
    this.messages.push({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: tool_block.id,
          content: result,
        },
      ],
    });
  }

  private async promptModel(): Promise<Message> {
    const response = await this.claude.messages.create({
      system: SYSTEM_PROMPT,
      model: config.claude.model,
      max_tokens: config.claude.maxTokens,
      temperature: config.claude.temperature,
      messages: this.messages,
      tools: TOOLS,
    });

    return response;
  }
}

export default OnboardingHandler;

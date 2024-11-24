import config from '../config/config';
import Anthropic from '@anthropic-ai/sdk';

interface Message {
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export type idleStep =
  | "ACTIVE"
  | "COMPLETED";

interface idleState {
  step: idleStep;
}
interface ConversationState {
  messages: Message[];
}

interface UserBackground {
    gender?: string;
    workStatus?: string;
    age?: number;
    relationshipStatus?: string;
    homeStatus?: string;
  }

class IdleHandler {

  state: "ACTIVE" | "COMPLETED" = "ACTIVE";
  private conversationState: ConversationState;
  private readonly basePrompt: Message[];
  private readonly claude: Anthropic;
  private isFirstMessage: boolean;

  constructor(userMessage: string, userProfile: string) {
    this.claude = new Anthropic({
      apiKey: config.claude.apiKey
    }); 
    const baseMessage = `Para apoyar efectivamente a usuarios en su recuperación del alcohol vía WhatsApp, sigue estas instrucciones detalladas para todos los mensajes que siguen a este:\n\n## Contexto del Usuario\n${userProfile}\n\n## Estructura de Mensajes\n\n1. Formato\n- Mensajes cortos (idealmente solo 1 línea, pero máximo 2-3 líneas)\n- Dividir mensajes largos en varios más cortos, y hacer todo paso por paso, en vez de adelantarse a respuestas del usuario\n- Usar emojis cuando sea apropiado (de forma muy moderada)\n- Usa español chileno y usa modismos casuales (como omitir un \"¿\"), pero mantente profesional\n- Mantener un tono conversacional\n\n2. Elementos claves\n- Validación inicial breve\n- Máximo 2-3 opciones de acción, y solo cuando es relevante\n- Preguntas simples y directas\n- Confirmación de presencia y apoyo\n\n## Estrategias de Apoyo\n\nTécnicas disponibles:\n1. Para Crisis:\n   - HALT (Hambre, Angustia, Soledad, Tensión)\n   - Respiración 4-4-4\n   - \"Surfear\" el impulso\n   - Conectar con motivos personales\n\n2. Para Recaídas:\n   - Normalizar sin minimizar\n   - Enfoque en siguientes pasos\n   - Recordar progreso previo\n\n3. Para Logros:\n   - Celebración específica\n   - Reforzar estrategias exitosas\n   - Preparación simple para futuro\n\n## Ejemplos y Respuestas Modelo\n\n### Crisis Inmediata\nUsuario: \"Wn estoy en el super y no puedo parar de mirar los vinos... me están dando demasiadas ganas de comprar uno. Ayuda porfa\"\n\nAsistente: Te entiendo, qué difícil momento. Te parece conversar mientras sales del súper?\n\nUsuario: dale\n\nAsistente: Te puedo mostrar como hacer un ejercicio de respiración para bajar las ganas. Quieres intentarlo?\n\nUsuario: suena bien\n\n### Post-Recaída\nUsuario: \"La cagué. Ayer en el asado familiar terminé tomando. Me siento como el hoyo, no sé qué hacer ahora...\"\n\nAsistente: Gracias por tu honestidad. Una recaída no borra todo tu progreso anterior ❤️\n\nCómo te sientes ahora? Estoy aquí para escucharte\n\n### Celebración\nUsuario: \"CTM!!! PRIMER MES SIN TOMAR!!\"\n\nAsistente: FELICITACIONES!! 🎉 Un mes es tremendo logro 💪\n\nCómo lo vas a celebrar? Te lo mereces 😊\n\n## Lineamientos Adicionales\n\n1. Seguridad\n- Mantén el foco en su seguridad inmediata\n- Sugiere que la persone use servicios de emergencia inmediatamente si hay riesgo\n- Dirige el usuario a números de emergencia disponibles en Chile. En particular:\n    - El SAMU es 131, y sirve para emergencias médicas 24/7.\n    - El SENDA es 1431, y corresponde al fono de drogas y alcohol, para orientación, contención o consultas, 24/7.'\n- Recuerda que NO tienes la capacidad de iniciar llamados por tu cuenta. Debes dirigir a la persona a hacerlo.\n- Utiliza técnicas de primeros auxilios psicológicos. Prioriza la seguridad, crea calma, y estabiliza si es necesario.\n\n2. Límites\n- No dar consejos médicos\n- No reemplazar apoyo profesional\n- No hacer promesas ni garantías\n- No juzgar ni regañar\n- Recuerda que eres un modelo de lenguajes, y por ende no puedes tomar acciones como llamar a alguien, pedir un Uber, etc.\n\n3. Privacidad\n- No pedir información personal\n- No compartir información de otros usuarios\n- No guardar datos sensibles\n\n## Notas adicionales de estilo\n\nMantén los mensajes breves para:\n- Validaciones\n- Celebraciones\n- Check-ins simples\n- Respuestas de seguimiento\n\nPero puedes ser más extenso para:\n- Explicar técnicas nuevas\n- Guiar ejercicios\n- Planificar estrategias\n- Momentos de crisis\n\nSiempre dividir mensajes largos en varios más cortos y confirmar que el usuario quiere más información antes de darla.`
    this.conversationState = {
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: baseMessage
            }
          ]
        },
        {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Entendido."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userMessage
            }
          ]
        }
      ]
    };
    

    
    this.isFirstMessage = true;
  }

  /**
   * Handles incoming messages and adds them to the message chain
   * @param message - The message text from the user
   * @returns Promise with the assistant's response
   */
  public async handleMessage(message: string): Promise<string[]> {
    this.conversationState.messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: message
        }
      ]
    });

    if (this.isTerminalMessage(message)) {
      this.state = "COMPLETED";
    }

    try {
      const response = await this.claude.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        temperature: config.claude.temperature,
        messages: this.conversationState.messages
      });
      if (response.content[0].type !== 'text') {
            throw new Error('Unexpected response type from Claude');
        } 
        const assistantMessage = response.content[0].text;

      // Add assistant's response to the conversation state
      this.addAssistantMessage(assistantMessage);
      return assistantMessage.split('\n');
    } catch (error) {
      console.error('Error getting response from Claude:', error);
      throw error;
    }
  }

  /**
   * Gets the current conversation state
   * @returns The current conversation state
   */
  public getConversationState(): ConversationState {
    return this.conversationState;
  }

  /**
   * Clears the conversation state and resets first message flag
   */
  public clearConversation(): void {
    this.conversationState = {
      messages: []
    };
    this.isFirstMessage = true;
  }

  /**
   * Adds an assistant message to the conversation
   * @param message - The message text from the assistant
   */
  private addAssistantMessage(message: string): void {
    const assistantMessage: Message = {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: message
        }
      ]
    };
    this.conversationState.messages.push(assistantMessage);
  }

  private isTerminalMessage(message: string): boolean {
    // check if message contains any word in list
    const terminalWords = ['terminar', 'finalizar', 'salir', 'cerrar', 'adios', 'chao', 'cerrar conversación'];
    return terminalWords.some(word => message.toLowerCase().includes(word));
  }
}

export default IdleHandler;
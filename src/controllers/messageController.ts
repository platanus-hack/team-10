import { OnboardingHandler } from "../handlers/onboardingHandler";
import IdleHandler from "../handlers/idleHandler";
import type { Message } from "whatsapp-web.js";
import generateUserContext from "../utils/generateUserContext";
import prisma from "../lib/prisma";
import { Client as WhatsappClient } from "whatsapp-web.js";
import _ from 'lodash';

const CONVERSATION_TIMEOUT = 45 * 60 * 1000; // 45 minutes
const MESSAGE_DELAY = 700;
const DEBOUNCE_DELAY = 2000;
const CONTACT_WHITELIST = [
  "56966600989@c.us",
  "56986885166@c.us",
  "56993203847@c.us",
];

interface ConversationState {
  handler: OnboardingHandler | IdleHandler;
  lastInteraction: Date;
  messageQueue: string[];
  isProcessing: boolean;
}

interface MessageBatch {
  messages: string[];
  timestamp: Date;
}

class MessageController {
  private whatsappClient: WhatsappClient;
  private activeConversations: Map<string, ConversationState>;
  private messageBuffer: Map<string, MessageBatch>;
  private debouncedProcessBuffer: Map<string, _.DebouncedFunc<() => void>>;

  constructor(whatsappClient: WhatsappClient) {
    this.whatsappClient = whatsappClient;
    this.activeConversations = new Map();
    this.messageBuffer = new Map();
    this.debouncedProcessBuffer = new Map();
  }

  async initializeBot() {
    console.log("Initializing bot...");
    console.log("Bot initialization complete! 🤖✨");
  }

  private async sendQueuedMessages(userId: string, messages: string[]) {
    const conversation = this.activeConversations.get(userId);
    if (!conversation) return;

    conversation.isProcessing = true;
    
    for (const message of messages) {
      try {
        await this.whatsappClient.sendMessage(userId, message);
        await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY));
      } catch (error) {
        console.error(`Error sending message to ${userId}:`, error);
      }
    }
    
    conversation.isProcessing = false;
    
    // Process any remaining messages in the queue
    if (conversation.messageQueue.length > 0) {
      const remainingMessages = [...conversation.messageQueue];
      conversation.messageQueue = [];
      await this.sendQueuedMessages(userId, remainingMessages);
    }
  }

  private getOrCreateDebouncedProcessor(userId: string) {
    if (!this.debouncedProcessBuffer.has(userId)) {
      this.debouncedProcessBuffer.set(
        userId,
        _.debounce(async () => {
          const batch = this.messageBuffer.get(userId);
          if (!batch) return;

          const conversation = this.activeConversations.get(userId);
          if (!conversation) return;

          // Process the batched messages together
          const response = await conversation.handler.handleMessage(
            batch.messages.join("\n")
          );

          // Queue the responses
          if (conversation.isProcessing) {
            conversation.messageQueue.push(...response);
          } else {
            await this.sendQueuedMessages(userId, response);
          }

          // Clear the buffer after processing
          this.messageBuffer.delete(userId);
        }, DEBOUNCE_DELAY)
      );
    }
    return this.debouncedProcessBuffer.get(userId)!;
  }

  async handleMessage(msg: Message) {
    try {
      if (!CONTACT_WHITELIST.includes(msg.from)) {
        console.log("Unauthorized user:", msg.from);
        return;
      }

      // Buffer the incoming message
      const currentBatch = this.messageBuffer.get(msg.from) || {
        messages: [],
        timestamp: new Date()
      };
      currentBatch.messages.push(msg.body);
      this.messageBuffer.set(msg.from, currentBatch);

      if (this.activeConversations.has(msg.from)) {
        const conversation = this.activeConversations.get(msg.from)!;
        const timeDiff = new Date().getTime() - conversation.lastInteraction.getTime();

        if (conversation.handler.state === "COMPLETED" || timeDiff > CONVERSATION_TIMEOUT) {
          this.activeConversations.delete(msg.from);
          this.messageBuffer.delete(msg.from);
          return;
        }

        conversation.lastInteraction = new Date();
        // Trigger debounced processing
        this.getOrCreateDebouncedProcessor(msg.from)();
      } else {
        // Handle new conversation setup
        const user = await prisma.user.findUnique({
          where: { phoneNumber: msg.from },
        });

        if (!user) {
          // Onboarding flow - immediate processing for first message
          console.log("Starting onboarding", msg.from);
          await prisma.user.create({
            data: {
              name: "Agustín",
              phoneNumber: msg.from,
              gender: "MALE",
              age: 23,
              relationshipStatus: "SINGLE",
              workStatus: "STUDENT",
              homeStatus: "LIVES_WITH_FAMILY",
              triggers: [],
              copingStrategies: [],
              sobrietyStartDate: new Date(),
              eveningCheckInTime: new Date(),
              morningCheckInTime: new Date(),
            },
          });
          await this.whatsappClient.sendMessage(msg.from, "Bienvenido");
        } else {
          // Start new conversation with idle handler
          console.log("Starting user-initiated conversation:", msg.from);
          this.activeConversations.set(msg.from, {
            handler: new IdleHandler(msg.from, generateUserContext(user)),
            lastInteraction: new Date(),
            messageQueue: [],
            isProcessing: false
          });
          
          // Trigger debounced processing for the first message
          this.getOrCreateDebouncedProcessor(msg.from)();
        }
      }
    } catch (error) {
      console.error("Error:", error);
      await this.whatsappClient.sendMessage(
        msg.from,
        "Lo siento, algo salió mal. Por favor, inténtalo de nuevo más tarde."
      );
    }
  }
}

export default MessageController;
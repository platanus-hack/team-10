import OnboardingHandler from "../handlers/conversationalOnboardingHandler";
import IdleHandler from "../handlers/idleHandler";
import type { Message } from "whatsapp-web.js";
import generateUserContext from "../utils/generateUserContext";
import prisma from "../lib/prisma";
import { Client as WhatsappClient } from "whatsapp-web.js";
import ClaudeHandler from "../handlers/claudeHandler";
import { HolidayService } from "../services/holidayService";
import { HolidayHandler } from "../handlers/holidayHandler";
import { holidays } from "../data/holidays.ts";

const CONVERSATION_TIMEOUT = 45 * 60 * 1000; // 45 minutes
const MESSAGE_DELAY = 0;
const CONTACT_WHITELIST = [
  "56966600989@c.us",
  "56986885166@c.us",
  "56993203847@c.us",
];

interface ConversationState {
  handler: OnboardingHandler | IdleHandler | ClaudeHandler;
  lastInteraction: Date;
  messageQueue: string[];
  isProcessing: boolean;
}

class MessageController {
  private whatsappClient: WhatsappClient;
  private activeConversations: Map<string, ConversationState>;
  private holidayService: HolidayService;

  constructor(whatsappClient: WhatsappClient) {
    this.whatsappClient = whatsappClient;
    this.activeConversations = new Map();
    this.holidayService = new HolidayService(whatsappClient);
  }

  private calculateSobrietyStreak(sobrietyStartDate: Date): number {
    const today = new Date();
    const startDate = new Date(sobrietyStartDate);
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  private async checkAndSendMilestoneMessage(user: any): Promise<void> {
    const streak = this.calculateSobrietyStreak(user.sobrietyStartDate);
    const milestones = [0, 1, 30, 60, 90, 180, 365];

    if (milestones.includes(streak)) {
      const message = `¡Felicidades! Has alcanzado ${streak} días sin beber alcohol. ¡Sigue así! 🎉`;
      await this.whatsappClient.sendMessage(user.phoneNumber, message);
    }
  }

  private async sendReminderMessage(userId: string) {
    const reminderMessage = "No olvides escribir antes de que termine la conversación.";
    try {
      await this.whatsappClient.sendMessage(userId, reminderMessage);
    } catch (error) {
      console.error(`Error sending reminder message to ${userId}:`, error);
    }
  }

  private scheduleReminder(userId: string, delay: number) {
    setTimeout(async () => {
      const conversation = this.activeConversations.get(userId);
      if (conversation && !conversation.isProcessing) {
        await this.sendReminderMessage(userId);
      }
    }, delay);
  }

  async initializeBot() {
    console.log("Initializing bot...");
    console.log("Bot initialization complete! 🤖✨");
  }

  private async sendMessages(userId: string, messages: string[]) {
    const conversation = this.activeConversations.get(userId);
    if (!conversation) return;

    conversation.isProcessing = true;

    for (const message of messages) {
      try {
        await this.whatsappClient.sendMessage(userId, message);
        if (MESSAGE_DELAY > 0) {
          await new Promise((resolve) => setTimeout(resolve, MESSAGE_DELAY));
        }
      } catch (error) {
        console.error(`Error sending message to ${userId}:`, error);
      }
    }

    conversation.isProcessing = false;
  }

  public getActiveConversations() {
    return this.activeConversations;
  }

  async handleMessage(msg: Message) {
    try {
      if (!CONTACT_WHITELIST.includes(msg.from)) {
        console.log("Unauthorized user:", msg.from);
        return;
      }

      if (this.activeConversations.has(msg.from)) {
        const conversation = this.activeConversations.get(msg.from)!;
        const timeDiff = new Date().getTime() - conversation.lastInteraction.getTime();

        if (conversation.handler.state === "COMPLETED" || timeDiff > CONVERSATION_TIMEOUT) {
          this.activeConversations.delete(msg.from);
          return;
        }

        conversation.lastInteraction = new Date();
        const response = await conversation.handler.handleMessage(msg.body);
        await this.sendMessages(msg.from, response);
      } else {
        const user = await prisma.user.findUnique({
          where: { phoneNumber: msg.from },
        });

        if (!user) {
          console.log("Starting onboarding", msg.from);
          const onboardingHandler = new OnboardingHandler(msg.from);

          this.activeConversations.set(msg.from, {
            handler: onboardingHandler,
            lastInteraction: new Date(),
            messageQueue: [],
            isProcessing: false,
          });

          const response = await onboardingHandler.handleMessage(msg.body);
          await this.sendMessages(msg.from, response);
        } else {
          console.log("Starting user-initiated conversation:", msg.from);
          await this.checkAndSendMilestoneMessage(user);
          
          const idleHandler = new IdleHandler(msg.from, generateUserContext(user));
          this.activeConversations.set(msg.from, {
            handler: idleHandler,
            lastInteraction: new Date(),
            messageQueue: [],
            isProcessing: false,
          });

          const response = await idleHandler.handleMessage(msg.body);
          await this.sendMessages(msg.from, response);
          
          // Schedule reminder message after 5 minutes of inactivity
          this.scheduleReminder(msg.from, 5 * 60 * 1000);
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

  async handleStartConversation(userPhone: string) {
    try {
      if (!CONTACT_WHITELIST.includes(userPhone)) {
        console.log("Unauthorized user:", userPhone);
        return;
      }
      
      if (this.activeConversations.has(userPhone)) {
        return; // Conversation already active
      }

      const user = await prisma.user.findUnique({
        where: { phoneNumber: userPhone },
      });

      const claudeHandler = new ClaudeHandler(generateUserContext(user), 'system');
      console.log("Starting system initiated convo:", userPhone);
      
      this.activeConversations.set(userPhone, {
        handler: claudeHandler,
        lastInteraction: new Date(),
        messageQueue: [],
        isProcessing: false,
      });

      const response = await claudeHandler.startConversation();
      await this.whatsappClient.sendMessage(userPhone, response);
    } catch (error) {
      console.error("Error:", error);
      await this.whatsappClient.sendMessage(
        userPhone,
        "Lo siento, algo salió mal. Por favor, inténtalo de nuevo más tarde."
      );
    }
  }

  private async checkHolidays(): Promise<void> {
    const today = new Date();
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);
    
    const formatDate = (date: Date) => {
      return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    const todayFormatted = formatDate(today);
    const twoDaysFormatted = formatDate(twoDaysFromNow);
    
    const upcomingHolidays = holidays.filter(holiday => 
      holiday.date === todayFormatted || holiday.date === twoDaysFormatted
    );
    
    if (upcomingHolidays.length > 0) {
      const activeUsers = await prisma.user.findMany({
        where: { isActive: true }
      });
      
      for (const user of activeUsers) {
        if (this.activeConversations.has(user.phoneNumber)) {
          continue;
        }
        
        for (const holiday of upcomingHolidays) {
          const handler = new HolidayHandler(user.id, holiday);
          const messages = await handler.handleMessage(null);
          await this.sendMessages(user.phoneNumber, messages);
        }
      }
    }
  }
}

export default MessageController;
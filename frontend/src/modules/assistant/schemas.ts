import { z } from "zod";

export const ChatMessageSenderSchema = z.enum(["user", "assistant"]);

export const ChatHistoryItemSchema = z.object({
  sender: ChatMessageSenderSchema,
  text: z.string(),
});

export const AdminAssistantRequestSchema = z.object({
  message: z.string().min(1, "Message is required").max(3000, "Message cannot exceed 3000 characters"),
  history: z.array(ChatHistoryItemSchema).optional().default([]),
});

export type AdminAssistantRequest = z.infer<typeof AdminAssistantRequestSchema>;
export type ChatHistoryItem = z.infer<typeof ChatHistoryItemSchema>;

export type AdminCommandType =
  | "churn"
  | "revenue"
  | "subscriptions"
  | "payments"
  | "customers"
  | "forecast";

export interface ParsedCommand {
  isCommand: boolean;
  command?: AdminCommandType;
  filterText?: string;
  dateRange: {
    start: Date;
    end: Date;
    label: string;
  };
  rawQuery: string;
  isUnknownCommand?: boolean;
  unknownCommandName?: string;
}

export interface AssistantResponse {
  reply: string;
  isCommand: boolean;
  command?: AdminCommandType;
  dataSummary?: Record<string, unknown>;
  generatedAt: string;
}


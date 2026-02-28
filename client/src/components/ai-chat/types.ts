/**
 * AI Chat Types
 * TypeScript interfaces for the AVA AI Chat system
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokens_used?: number | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages_count: number;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface QuotaInfo {
  plan: string;
  messages_used: number;
  messages_limit: number;
  period_start: string;
  period_end: string;
}

export interface SSETokenEvent {
  type: "token";
  content: string;
}

export interface SSEDoneEvent {
  type: "done";
  message_id: string;
  tokens_used: number;
  quota_remaining: number;
}

export interface SSEErrorEvent {
  type: "error";
  code: string;
  message: string;
}

export interface SSEStartEvent {
  type: "start";
  conversation_id: string;
  model: string;
}

export type SSEEvent =
  | SSETokenEvent
  | SSEDoneEvent
  | SSEErrorEvent
  | SSEStartEvent;

export interface StreamChatRequest {
  conversation_id: string | null;
  message: string;
  context?: {
    comune_id?: number;
    user_role?: string;
    current_tab?: string;
  };
}

export type UserRoleType = "pa" | "impresa" | "cittadino";

export interface SuggestionItem {
  label: string;
  prompt: string;
}

export type ConversationSummary = {
  id: number;
  title: string;
  updated_at: string;
};

export type ChatMessage = {
  id?: number;
  role: "user" | "assistant";
  content: string;
};

export type Theme = "dark" | "light";

export type DatasetSummary = {
  id: number;
  name: string;
  description: string;
  updated_at: string;
  source_count: number;
  version_count: number;
};

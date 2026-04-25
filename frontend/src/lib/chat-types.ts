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
  chunk_count: number;
};

export type DatasetSource = {
  id: number;
  file_name: string;
  file_path: string;
  content_hash: string;
  created_at: string;
};

export type DatasetVersion = {
  id: number;
  version_label: string;
  notes: string;
  created_at: string;
};

export type DatasetChunk = {
  id: number;
  source_id: number;
  chunk_index: number;
  chunk_text: string;
};

export type DatasetDetail = DatasetSummary & {
  sources: DatasetSource[];
  versions: DatasetVersion[];
  chunks: DatasetChunk[];
};

export type MemorySummary = {
  id: number;
  name: string;
  original_filename: string;
  updated_at: string;
  chunk_count: number;
};

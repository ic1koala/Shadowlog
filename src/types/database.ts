export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface PracticeSessionRow {
  id: string;
  user_id: string | null;
  sentence: string;
  transcription: string;
  word_count: number;
  matched_word_count: number;
  accuracy_score: number;
  created_at: string;
}

export interface PracticeSessionInsert {
  id?: string;
  user_id?: string | null;
  sentence: string;
  transcription: string;
  word_count: number;
  matched_word_count: number;
  accuracy_score: number;
  created_at?: string;
}

export interface PracticeSessionUpdate {
  id?: string;
  user_id?: string | null;
  sentence?: string;
  transcription?: string;
  word_count?: number;
  matched_word_count?: number;
  accuracy_score?: number;
  created_at?: string;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  industry: string;
  difficulty_level: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  email?: string | null;
  industry?: string;
  difficulty_level?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  id?: string;
  email?: string | null;
  industry?: string;
  difficulty_level?: string;
  updated_at?: string;
}

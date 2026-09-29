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
  sentence_id?: string | null;
  text_en: string;
  text_jp?: string | null;
  transcribed_text?: string | null;
  accuracy_score: number;
  wpm?: number | null;
  diff_result?: Json;
  coach_feedback?: Json;
  created_at: string;
  // Backward compatibility with mock or older usages
  sentence?: string;
  transcription?: string;
  word_count?: number;
  matched_word_count?: number;
}

export interface PracticeSessionInsert {
  id?: string;
  user_id?: string | null;
  sentence_id?: string | null;
  text_en: string;
  text_jp?: string | null;
  transcribed_text?: string | null;
  accuracy_score: number;
  wpm?: number | null;
  diff_result?: Json;
  coach_feedback?: Json;
  created_at?: string;
  // Backward compatibility with mock or older usages
  sentence?: string;
  transcription?: string;
  word_count?: number;
  matched_word_count?: number;
}

export interface PracticeSessionUpdate {
  id?: string;
  user_id?: string | null;
  sentence_id?: string | null;
  text_en?: string;
  text_jp?: string | null;
  transcribed_text?: string | null;
  accuracy_score?: number;
  wpm?: number | null;
  diff_result?: Json;
  coach_feedback?: Json;
  created_at?: string;
  // Backward compatibility
  sentence?: string;
  transcription?: string;
  word_count?: number;
  matched_word_count?: number;
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

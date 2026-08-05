export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      attempt_answers: {
        Row: {
          attempt_id: string
          awarded: number
          created_at: string
          exemplar: string | null
          feedback: string | null
          id: string
          is_mistake: boolean
          max_marks: number
          missing_keywords: Json
          qtype: string
          question_id: string | null
          question_prompt: string
          resolved: boolean
          response: string
          subject: string | null
          topic: string | null
          user_id: string
        }
        Insert: {
          attempt_id: string
          awarded?: number
          created_at?: string
          exemplar?: string | null
          feedback?: string | null
          id?: string
          is_mistake?: boolean
          max_marks?: number
          missing_keywords?: Json
          qtype?: string
          question_id?: string | null
          question_prompt?: string
          resolved?: boolean
          response?: string
          subject?: string | null
          topic?: string | null
          user_id: string
        }
        Update: {
          attempt_id?: string
          awarded?: number
          created_at?: string
          exemplar?: string | null
          feedback?: string | null
          id?: string
          is_mistake?: boolean
          max_marks?: number
          missing_keywords?: Json
          qtype?: string
          question_id?: string | null
          question_prompt?: string
          resolved?: boolean
          response?: string
          subject?: string | null
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          awarded_marks: number
          completed_at: string | null
          id: string
          paper_id: string
          paper_title: string
          started_at: string
          subject: string
          total_marks: number
          user_id: string
        }
        Insert: {
          awarded_marks?: number
          completed_at?: string | null
          id?: string
          paper_id: string
          paper_title?: string
          started_at?: string
          subject?: string
          total_marks?: number
          user_id: string
        }
        Update: {
          awarded_marks?: number
          completed_at?: string | null
          id?: string
          paper_id?: string
          paper_title?: string
          started_at?: string
          subject?: string
          total_marks?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "exam_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_papers: {
        Row: {
          created_at: string
          description: string | null
          exam_type: string
          id: string
          is_library: boolean
          owner_id: string | null
          subject: string
          title: string
          year: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          exam_type?: string
          id?: string
          is_library?: boolean
          owner_id?: string | null
          subject: string
          title: string
          year?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          exam_type?: string
          id?: string
          is_library?: boolean
          owner_id?: string | null
          subject?: string
          title?: string
          year?: number | null
        }
        Relationships: []
      }
      exam_questions: {
        Row: {
          correct_option: number | null
          created_at: string
          criteria: string | null
          exemplar: string | null
          id: string
          marks: number
          options: Json
          paper_id: string
          position: number
          prompt: string
          qtype: string
          topic: string | null
        }
        Insert: {
          correct_option?: number | null
          created_at?: string
          criteria?: string | null
          exemplar?: string | null
          id?: string
          marks?: number
          options?: Json
          paper_id: string
          position?: number
          prompt: string
          qtype?: string
          topic?: string | null
        }
        Update: {
          correct_option?: number | null
          created_at?: string
          criteria?: string | null
          exemplar?: string | null
          id?: string
          marks?: number
          options?: Json
          paper_id?: string
          position?: number
          prompt?: string
          qtype?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "exam_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          cosmetics: Json
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_active_date: string | null
          level: number
          streak: number
          streak_days: number
          updated_at: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          cosmetics?: Json
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          last_active_date?: string | null
          level?: number
          streak?: number
          streak_days?: number
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          cosmetics?: Json
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_active_date?: string | null
          level?: number
          streak?: number
          streak_days?: number
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_exams: {
        Row: {
          color: string
          created_at: string
          exam_at: string
          id: string
          note: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          exam_at: string
          id?: string
          note?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          exam_at?: string
          id?: string
          note?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_state: {
        Row: {
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          meta: Json
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          meta?: Json
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

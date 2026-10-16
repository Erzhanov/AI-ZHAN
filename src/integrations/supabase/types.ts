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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_usage_limits: {
        Row: {
          created_at: string
          id: string
          limit_exhausted_at: string | null
          updated_at: string
          used_count: number
          user_id: string
          window_started_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          limit_exhausted_at?: string | null
          updated_at?: string
          used_count?: number
          user_id: string
          window_started_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          limit_exhausted_at?: string | null
          updated_at?: string
          used_count?: number
          user_id?: string
          window_started_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          ai_response: string
          created_at: string
          id: string
          mode: string
          user_id: string
          user_message: string
        }
        Insert: {
          ai_response?: string
          created_at?: string
          id?: string
          mode?: string
          user_id: string
          user_message: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          id?: string
          mode?: string
          user_id?: string
          user_message?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          ai_feedback: string | null
          completed_at: string
          created_at: string
          goal_id: string | null
          id: string
          meals_done: boolean
          mood_score: number | null
          sleep_done: boolean
          updated_at: string
          user_id: string
          water_done: boolean
          workout_done: boolean
        }
        Insert: {
          ai_feedback?: string | null
          completed_at?: string
          created_at?: string
          goal_id?: string | null
          id?: string
          meals_done?: boolean
          mood_score?: number | null
          sleep_done?: boolean
          updated_at?: string
          user_id: string
          water_done?: boolean
          workout_done?: boolean
        }
        Update: {
          ai_feedback?: string | null
          completed_at?: string
          created_at?: string
          goal_id?: string | null
          id?: string
          meals_done?: boolean
          mood_score?: number | null
          sleep_done?: boolean
          updated_at?: string
          user_id?: string
          water_done?: boolean
          workout_done?: boolean
        }
        Relationships: []
      }
      lifestyle_reminders: {
        Row: {
          channel: string
          created_at: string
          goal_id: string | null
          id: string
          is_enabled: boolean
          message_template: string | null
          reminder_type: string
          scheduled_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          goal_id?: string | null
          id?: string
          is_enabled?: boolean
          message_template?: string | null
          reminder_type: string
          scheduled_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          goal_id?: string | null
          id?: string
          is_enabled?: boolean
          message_template?: string | null
          reminder_type?: string
          scheduled_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medicine_searches: {
        Row: {
          created_at: string
          id: string
          query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          metadata: Json | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allergies: string[] | null
          blood_pressure: Json | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          phone: string | null
          pro_expires_at: string | null
          pro_payment_provider: string | null
          pro_payment_reference: string | null
          subscription_plan: string
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          blood_pressure?: Json | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          pro_expires_at?: string | null
          pro_payment_provider?: string | null
          pro_payment_reference?: string | null
          subscription_plan?: string
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          blood_pressure?: Json | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          pro_expires_at?: string | null
          pro_payment_provider?: string | null
          pro_payment_reference?: string | null
          subscription_plan?: string
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          id: string
          purchased_at: string
          user_id: string
          website_id: string
        }
        Insert: {
          id?: string
          purchased_at?: string
          user_id: string
          website_id: string
        }
        Update: {
          id?: string
          purchased_at?: string
          user_id?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          status: string
          stripe_event_id: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          status?: string
          stripe_event_id?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          status?: string
          stripe_event_id?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          activity_level: string
          age: number
          created_at: string
          gender: string
          goal_type: string
          height_cm: number
          id: string
          notification_channels: Json | null
          plan_data: Json | null
          start_weight_kg: number
          target_calories: number | null
          target_carbs_g: number | null
          target_fat_g: number | null
          target_protein_g: number | null
          telegram_chat_id: string | null
          telegram_link_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_level: string
          age: number
          created_at?: string
          gender: string
          goal_type: string
          height_cm: number
          id?: string
          notification_channels?: Json | null
          plan_data?: Json | null
          start_weight_kg: number
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          telegram_chat_id?: string | null
          telegram_link_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_level?: string
          age?: number
          created_at?: string
          gender?: string
          goal_type?: string
          height_cm?: number
          id?: string
          notification_channels?: Json | null
          plan_data?: Json | null
          start_weight_kg?: number
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          telegram_chat_id?: string | null
          telegram_link_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      websites: {
        Row: {
          category_id: string | null
          created_at: string
          demo_url: string
          description: string
          full_url: string
          id: string
          image_url: string | null
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          demo_url: string
          description: string
          full_url: string
          id?: string
          image_url?: string | null
          price: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          demo_url?: string
          description?: string
          full_url?: string
          id?: string
          image_url?: string | null
          price?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "websites_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_history: {
        Row: {
          created_at: string
          goal_id: string | null
          id: string
          recorded_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          goal_id?: string | null
          id?: string
          recorded_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          goal_id?: string | null
          id?: string
          recorded_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const

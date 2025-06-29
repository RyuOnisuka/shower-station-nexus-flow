export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          id: string
          admin_user_id: string
          session_token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          session_token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          session_token?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_users: {
        Row: {
          id: string
          username: string
          email: string
          password_hash: string
          role: "super_admin" | "admin" | "staff"
          is_active: boolean
          last_login: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          password_hash: string
          role?: "super_admin" | "admin" | "staff"
          is_active?: boolean
          last_login?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          password_hash?: string
          role?: "super_admin" | "admin" | "staff"
          is_active?: boolean
          last_login?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          admin_user_id: string | null
          action: string
          table_name: string | null
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id?: string | null
          action: string
          table_name?: string | null
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string | null
          action?: string
          table_name?: string | null
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_stats: {
        Row: {
          id: string
          date: string
          total_queues: number
          completed_queues: number
          cancelled_queues: number
          total_revenue: number
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          total_queues: number
          completed_queues: number
          cancelled_queues: number
          total_revenue: number
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          total_queues?: number
          completed_queues?: number
          cancelled_queues?: number
          total_revenue?: number
          created_at?: string
        }
        Relationships: []
      }
      locker_history: {
        Row: {
          id: string
          locker_id: string
          user_id: string
          queue_id: string
          action: "occupied" | "released"
          created_at: string
        }
        Insert: {
          id?: string
          locker_id: string
          user_id: string
          queue_id: string
          action: "occupied" | "released"
          created_at?: string
        }
        Update: {
          id?: string
          locker_id?: string
          user_id?: string
          queue_id?: string
          action?: "occupied" | "released"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locker_history_locker_id_fkey"
            columns: ["locker_id"]
            isOneToOne: false
            referencedRelation: "lockers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locker_history_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locker_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      lockers: {
        Row: {
          id: string
          locker_number: string
          status: "available" | "occupied" | "maintenance"
          user_id: string | null
          current_queue_id: string | null
          occupied_at: string | null
          released_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          locker_number: string
          status?: "available" | "occupied" | "maintenance"
          user_id?: string | null
          current_queue_id?: string | null
          occupied_at?: string | null
          released_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          locker_number?: string
          status?: "available" | "occupied" | "maintenance"
          user_id?: string | null
          current_queue_id?: string | null
          occupied_at?: string | null
          released_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lockers_current_queue_id_fkey"
            columns: ["current_queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lockers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          queue_id: string
          amount: number
          payment_method: "cash" | "transfer" | "qr"
          status: "pending" | "approved" | "rejected"
          slip_url: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          queue_id: string
          amount: number
          payment_method: "cash" | "transfer" | "qr"
          status?: "pending" | "approved" | "rejected"
          slip_url?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          queue_id?: string
          amount?: number
          payment_method?: "cash" | "transfer" | "qr"
          status?: "pending" | "approved" | "rejected"
          slip_url?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          }
        ]
      }
      queues: {
        Row: {
          id: string
          queue_number: string
          user_id: string
          service_type: "shower" | "locker_only"
          time_slot: string
          status: "waiting" | "called" | "processing" | "completed" | "cancelled"
          locker_number: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
          genkey: string
        }
        Insert: {
          id?: string
          queue_number: string
          user_id: string
          service_type: "shower" | "locker_only"
          time_slot: string
          status?: "waiting" | "called" | "processing" | "completed" | "cancelled"
          locker_number?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          genkey?: string
        }
        Update: {
          id?: string
          queue_number?: string
          user_id?: string
          service_type?: "shower" | "locker_only"
          time_slot?: string
          status?: "waiting" | "called" | "processing" | "completed" | "cancelled"
          locker_number?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          genkey?: string
        }
        Relationships: [
          {
            foreignKeyName: "queues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          description: string
          updated_by: string
          updated_at: string
          category: string
          settings: Json | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          description?: string
          updated_by?: string
          updated_at?: string
          category?: string
          settings?: Json | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          description?: string
          updated_by?: string
          updated_at?: string
          category?: string
          settings?: Json | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          phone: string
          name: string
          gender: "male" | "female" | "other" | null
          restroom_pref: "male" | "female" | "unisex" | null
          status: "pending" | "active" | "rejected"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          name: string
          gender?: "male" | "female" | "other" | null
          restroom_pref?: "male" | "female" | "unisex" | null
          status?: "pending" | "active" | "rejected"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          name?: string
          gender?: "male" | "female" | "other" | null
          restroom_pref?: "male" | "female" | "unisex" | null
          status?: "pending" | "active" | "rejected"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          id: string
          username: string
          ip_address: string
          user_agent: string | null
          success: boolean
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          ip_address: string
          user_agent?: string | null
          success?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          ip_address?: string
          user_agent?: string | null
          success?: boolean
          created_at?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          id: string
          type: "failed_login" | "suspicious_activity" | "unauthorized_access" | "data_breach"
          severity: "low" | "medium" | "high" | "critical"
          message: string
          details: Json | null
          created_at: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          type: "failed_login" | "suspicious_activity" | "unauthorized_access" | "data_breach"
          severity: "low" | "medium" | "high" | "critical"
          message: string
          details?: Json | null
          created_at?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          type?: "failed_login" | "suspicious_activity" | "unauthorized_access" | "data_breach"
          severity?: "low" | "medium" | "high" | "critical"
          message?: string
          details?: Json | null
          created_at?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

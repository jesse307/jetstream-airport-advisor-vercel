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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aircraft: {
        Row: {
          aviapages_name: string | null
          cabin_height: number | null
          cabin_length: number | null
          cabin_width: number | null
          category: string
          created_at: string
          cruise_speed_long_range: number
          cruise_speed_max: number
          cruise_speed_normal: number
          empty_weight: number
          engine_manufacturer: string | null
          engine_model: string | null
          engines_count: number | null
          fuel_burn_climb: number
          fuel_burn_cruise: number
          fuel_burn_descent: number
          fuel_burn_taxi: number | null
          fuel_burn_vs_altitude: Json | null
          fuel_burn_vs_weight: Json | null
          fuel_capacity: number
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          is_active: boolean | null
          landing_distance: number
          manufacturer: string
          max_landing_weight: number
          max_passengers: number
          max_payload: number
          max_range: number
          max_range_with_reserves: number | null
          max_takeoff_weight: number
          min_runway: number
          model: string
          notes: string | null
          range_vs_payload: Json | null
          rate_of_climb: number
          rate_of_descent: number | null
          service_ceiling: number
          takeoff_distance: number
          thrust_per_engine: number | null
          time_to_climb_fl410: number | null
          typical_passengers: number
          unusable_fuel: number | null
          updated_at: string
          variant: string | null
        }
        Insert: {
          aviapages_name?: string | null
          cabin_height?: number | null
          cabin_length?: number | null
          cabin_width?: number | null
          category: string
          created_at?: string
          cruise_speed_long_range: number
          cruise_speed_max: number
          cruise_speed_normal: number
          empty_weight: number
          engine_manufacturer?: string | null
          engine_model?: string | null
          engines_count?: number | null
          fuel_burn_climb: number
          fuel_burn_cruise: number
          fuel_burn_descent: number
          fuel_burn_taxi?: number | null
          fuel_burn_vs_altitude?: Json | null
          fuel_burn_vs_weight?: Json | null
          fuel_capacity: number
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          is_active?: boolean | null
          landing_distance: number
          manufacturer: string
          max_landing_weight: number
          max_passengers: number
          max_payload: number
          max_range: number
          max_range_with_reserves?: number | null
          max_takeoff_weight: number
          min_runway: number
          model: string
          notes?: string | null
          range_vs_payload?: Json | null
          rate_of_climb: number
          rate_of_descent?: number | null
          service_ceiling: number
          takeoff_distance: number
          thrust_per_engine?: number | null
          time_to_climb_fl410?: number | null
          typical_passengers: number
          unusable_fuel?: number | null
          updated_at?: string
          variant?: string | null
        }
        Update: {
          aviapages_name?: string | null
          cabin_height?: number | null
          cabin_length?: number | null
          cabin_width?: number | null
          category?: string
          created_at?: string
          cruise_speed_long_range?: number
          cruise_speed_max?: number
          cruise_speed_normal?: number
          empty_weight?: number
          engine_manufacturer?: string | null
          engine_model?: string | null
          engines_count?: number | null
          fuel_burn_climb?: number
          fuel_burn_cruise?: number
          fuel_burn_descent?: number
          fuel_burn_taxi?: number | null
          fuel_burn_vs_altitude?: Json | null
          fuel_burn_vs_weight?: Json | null
          fuel_capacity?: number
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          is_active?: boolean | null
          landing_distance?: number
          manufacturer?: string
          max_landing_weight?: number
          max_passengers?: number
          max_payload?: number
          max_range?: number
          max_range_with_reserves?: number | null
          max_takeoff_weight?: number
          min_runway?: number
          model?: string
          notes?: string | null
          range_vs_payload?: Json | null
          rate_of_climb?: number
          rate_of_descent?: number | null
          service_ceiling?: number
          takeoff_distance?: number
          thrust_per_engine?: number | null
          time_to_climb_fl410?: number | null
          typical_passengers?: number
          unusable_fuel?: number | null
          updated_at?: string
          variant?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          analysis_data: Json | null
          arrival_airport: string
          call_notes: string | null
          created_at: string
          departure_airport: string
          departure_date: string
          departure_time: string | null
          email: string
          email_valid: boolean | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          passengers: number
          phone: string | null
          phone_valid: boolean | null
          return_date: string | null
          return_time: string | null
          status: string
          trip_type: string
          updated_at: string
        }
        Insert: {
          analysis_data?: Json | null
          arrival_airport: string
          call_notes?: string | null
          created_at?: string
          departure_airport: string
          departure_date: string
          departure_time?: string | null
          email: string
          email_valid?: boolean | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          passengers?: number
          phone?: string | null
          phone_valid?: boolean | null
          return_date?: string | null
          return_time?: string | null
          status?: string
          trip_type: string
          updated_at?: string
        }
        Update: {
          analysis_data?: Json | null
          arrival_airport?: string
          call_notes?: string | null
          created_at?: string
          departure_airport?: string
          departure_date?: string
          departure_time?: string | null
          email?: string
          email_valid?: boolean | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          passengers?: number
          phone?: string | null
          phone_valid?: boolean | null
          return_date?: string | null
          return_time?: string | null
          status?: string
          trip_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      pending_lead_imports: {
        Row: {
          created_at: string
          id: string
          processed: boolean
          processed_at: string | null
          raw_data: string
          source: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          raw_data: string
          source?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          raw_data?: string
          source?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          lead_id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          success: boolean
          webhook_url: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_url: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
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

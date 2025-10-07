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
      aircraft_locations: {
        Row: {
          country_code: string | null
          created_at: string
          home_airport_iata: string | null
          home_airport_icao: string | null
          home_airport_name: string | null
          id: string
          last_updated: string
          operator_name: string | null
          tail_number: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          home_airport_iata?: string | null
          home_airport_icao?: string | null
          home_airport_name?: string | null
          id?: string
          last_updated?: string
          operator_name?: string | null
          tail_number: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          home_airport_iata?: string | null
          home_airport_icao?: string | null
          home_airport_name?: string | null
          id?: string
          last_updated?: string
          operator_name?: string | null
          tail_number?: string
        }
        Relationships: []
      }
      aircraft_operators: {
        Row: {
          aircraft_type: string | null
          callsign_prefix: string | null
          created_at: string | null
          id: string
          last_seen_airport: string | null
          last_updated: string | null
          operator_name: string | null
          tail_number: string
        }
        Insert: {
          aircraft_type?: string | null
          callsign_prefix?: string | null
          created_at?: string | null
          id?: string
          last_seen_airport?: string | null
          last_updated?: string | null
          operator_name?: string | null
          tail_number: string
        }
        Update: {
          aircraft_type?: string | null
          callsign_prefix?: string | null
          created_at?: string | null
          id?: string
          last_seen_airport?: string | null
          last_updated?: string | null
          operator_name?: string | null
          tail_number?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          template_content: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          template_content: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          template_content?: string
          updated_at?: string
          user_id?: string | null
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
          departure_datetime: string | null
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
          return_datetime: string | null
          return_time: string | null
          source: string | null
          status: string
          trip_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analysis_data?: Json | null
          arrival_airport: string
          call_notes?: string | null
          created_at?: string
          departure_airport: string
          departure_date: string
          departure_datetime?: string | null
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
          return_datetime?: string | null
          return_time?: string | null
          source?: string | null
          status?: string
          trip_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          arrival_airport?: string
          call_notes?: string | null
          created_at?: string
          departure_airport?: string
          departure_date?: string
          departure_datetime?: string | null
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
          return_datetime?: string | null
          return_time?: string | null
          source?: string | null
          status?: string
          trip_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      nfl_teams: {
        Row: {
          created_at: string | null
          id: string
          stadium_latitude: number
          stadium_longitude: number
          stadium_name: string
          team_api_id: number | null
          team_city: string
          team_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stadium_latitude: number
          stadium_longitude: number
          stadium_name: string
          team_api_id?: number | null
          team_city: string
          team_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stadium_latitude?: number
          stadium_longitude?: number
          stadium_name?: string
          team_api_id?: number | null
          team_city?: string
          team_name?: string
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
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          raw_data: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          raw_data?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string
          extracted_data: Json | null
          id: string
          processed: boolean
          raw_email_data: Json | null
          sender_email: string | null
          status: string
          subject: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          extracted_data?: Json | null
          id?: string
          processed?: boolean
          raw_email_data?: Json | null
          sender_email?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          extracted_data?: Json | null
          id?: string
          processed?: boolean
          raw_email_data?: Json | null
          sender_email?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const

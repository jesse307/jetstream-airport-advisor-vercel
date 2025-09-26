import { supabase } from "@/integrations/supabase/client";

export interface FlightTimeResult {
  success: boolean;
  flightTime?: {
    duration: number; // in minutes
    distance?: number; // in nautical miles
    aircraftType: string;
    departure: string;
    arrival: string;
  };
  error?: string;
}

export async function calculateFlightTimeWithAviapages(
  departure: string,
  arrival: string,
  aircraftType: string
): Promise<FlightTimeResult> {
  try {
    const { data, error } = await supabase.functions.invoke('search-airports', {
      body: {
        calculateFlightTime: true,
        departure,
        arrival,
        aircraftType
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to call aviapages API'
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Unknown error from aviapages API'
      };
    }

    return {
      success: true,
      flightTime: data.flightTime
    };
  } catch (error) {
    console.error('Error calling aviapages API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
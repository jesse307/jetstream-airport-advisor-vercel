import { supabase } from "@/integrations/supabase/client";

export interface AviapagesFlightTime {
  time?: {
    airway?: number;
    great_circle?: number;
  };
  distance?: {
    airway?: number;
    great_circle?: number;
  };
  fuel?: {
    airway?: number;
    great_circle?: number;
  };
  airport?: {
    departure_airport: string;
    arrival_airport: string;
  };
  aircraft?: string;
}

export interface FlightTimeResult {
  success: boolean;
  flightTime?: AviapagesFlightTime;
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
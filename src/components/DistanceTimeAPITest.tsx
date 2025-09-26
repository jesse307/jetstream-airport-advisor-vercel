import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const DistanceTimeAPITest: React.FC = () => {
  const [fromAirport, setFromAirport] = useState('KJFK');
  const [toAirport, setToAirport] = useState('KLAX');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testDistanceTimeAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('search-airports', {
        body: { 
          testDistanceTime: true, 
          fromAirport: fromAirport.toUpperCase(), 
          toAirport: toAirport.toUpperCase() 
        }
      });

      if (functionError) {
        setError(`Function error: ${functionError.message}`);
      } else if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(`Request failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>AeroDataBox Distance-Time API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fromAirport">From Airport (ICAO)</Label>
            <Input
              id="fromAirport"
              value={fromAirport}
              onChange={(e) => setFromAirport(e.target.value)}
              placeholder="KJFK"
            />
          </div>
          <div>
            <Label htmlFor="toAirport">To Airport (ICAO)</Label>
            <Input
              id="toAirport"
              value={toAirport}
              onChange={(e) => setToAirport(e.target.value)}
              placeholder="KLAX"
            />
          </div>
        </div>
        
        <Button 
          onClick={testDistanceTimeAPI} 
          disabled={loading || !fromAirport || !toAirport}
          className="w-full"
        >
          {loading ? 'Testing API...' : 'Test Distance-Time API'}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="font-medium text-red-800">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-medium text-green-800 mb-2">API Response:</h3>
            <pre className="text-sm text-green-700 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export const ApiTest = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const testApiKey = async () => {
    setTesting(true);
    try {
      // Test the API by making a search call and checking the logs
      const { data, error } = await supabase.functions.invoke('search-airports', {
        body: { query: 'JFK' }
      });
      
      if (error) {
        setTestResult({ 
          error: error.message,
          success: false,
          testType: 'search_function_error'
        });
      } else {
        // Check if we got results and what type
        const hasResults = data?.airports && data.airports.length > 0;
        const resultType = hasResults 
          ? (data.airports[0].code === 'KJFK' ? 'fallback_database' : 'api_success')
          : 'no_results';
        
        setTestResult({
          success: hasResults,
          resultType,
          airportCount: data?.airports?.length || 0,
          firstAirport: data?.airports?.[0] || null,
          testType: 'search_function_test',
          message: resultType === 'fallback_database' 
            ? 'API may be failing, using fallback database'
            : resultType === 'api_success' 
            ? 'API appears to be working correctly'
            : 'No results returned - check API configuration'
        });
      }
    } catch (err) {
      setTestResult({ 
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false,
        testType: 'fetch_error'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>AeroDataBox API Key Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testApiKey} disabled={testing} className="mb-4">
          {testing ? 'Testing API Key...' : 'Test API Key'}
        </Button>
        
        {testResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
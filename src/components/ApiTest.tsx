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
      // Test with a code that should trigger the API (not in fallback)
      const testCode = 'LHR'; // London Heathrow - not in fallback list
      const { data, error } = await supabase.functions.invoke('search-airports', {
        body: { query: testCode }
      });
      
      if (error) {
        setTestResult({ 
          error: error.message,
          success: false,
          testType: 'function_error'
        });
        return;
      }

      // Check if we got API error details in the results
      const apiError = data?.airports?.find(a => a.code === 'API_ERROR');
      const fetchError = data?.airports?.find(a => a.code === 'FETCH_ERROR');
      
      if (apiError) {
        setTestResult({
          success: false,
          errorType: 'API_ERROR',
          statusCode: apiError.name.match(/\d+/)?.[0] || 'unknown',
          errorMessage: apiError.city,
          fullError: apiError.name,
          testCode: testCode,
          testType: 'api_error_detected'
        });
      } else if (fetchError) {
        setTestResult({
          success: false,
          errorType: 'FETCH_ERROR', 
          errorMessage: fetchError.city,
          fullError: fetchError.name,
          testCode: testCode,
          testType: 'fetch_error_detected'
        });
      } else {
        // Check if results came from API or fallback
        const hasResults = data?.airports && data.airports.length > 0;
        const isFromFallback = hasResults && data.airports.some(a => 
          a.code === 'KJFK' || a.code === 'KLAX' || a.code === 'KEWR'
        );
        
        if (hasResults && !isFromFallback) {
          setTestResult({
            success: true,
            resultType: 'api_working',
            airportCount: data.airports.length,
            firstAirport: data.airports[0],
            testCode: testCode,
            message: 'AeroDataBox API is working correctly!'
          });
        } else if (hasResults && isFromFallback) {
          setTestResult({
            success: false,
            resultType: 'using_fallback',
            airportCount: data.airports.length,
            testCode: testCode,
            message: 'API failed silently - check your RapidAPI key configuration',
            suggestion: 'Verify your API key is valid and has remaining quota'
          });
        } else {
          setTestResult({
            success: false,
            resultType: 'no_results',
            testCode: testCode,
            message: 'No results found - API may be completely broken'
          });
        }
      }
    } catch (err) {
      setTestResult({ 
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false,
        testType: 'client_error'
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
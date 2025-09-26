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
      // First, let's test if the function returns any debugging info
      console.log('Testing with diagnostic query...');
      const { data, error } = await supabase.functions.invoke('search-airports', {
        body: { query: 'DEBUG_TEST_LHR' }
      });
      
      console.log('Function response:', { data, error });
      
      if (error) {
        setTestResult({ 
          error: error.message,
          success: false,
          testType: 'function_error',
          rawError: error
        });
        return;
      }

      // Log the full response for debugging
      setTestResult({
        success: false,
        testType: 'debug_response',
        fullResponse: data,
        airports: data?.airports || [],
        airportCount: data?.airports?.length || 0,
        message: 'Check the full response below for debugging info',
        hasApiError: data?.airports?.some(a => a.code === 'API_ERROR'),
        hasFetchError: data?.airports?.some(a => a.code === 'FETCH_ERROR'),
        testQuery: 'DEBUG_TEST_LHR'
      });
      
    } catch (err) {
      setTestResult({ 
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false,
        testType: 'client_error',
        stack: err instanceof Error ? err.stack : undefined
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
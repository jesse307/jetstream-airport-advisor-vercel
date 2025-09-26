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
      const { data, error } = await supabase.functions.invoke('test-api');
      
      if (error) {
        setTestResult({ error: error.message });
      } else {
        setTestResult(data);
      }
    } catch (err) {
      setTestResult({ error: err instanceof Error ? err.message : 'Unknown error' });
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
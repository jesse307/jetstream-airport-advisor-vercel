import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";

interface ImportRecord {
  id: string;
  raw_data: string;
  processed: boolean;
  source: string;
  created_at: string;
  processed_at: string | null;
}

const ImportHistory = () => {
  const navigate = useNavigate();
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImports();
  }, []);

  const fetchImports = async () => {
    try {
      const { data, error } = await supabase
        .from("pending_lead_imports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImports(data || []);
    } catch (error) {
      console.error("Error fetching imports:", error);
      toast.error("Failed to load import history");
    } finally {
      setLoading(false);
    }
  };

  const handleViewImport = (importRecord: ImportRecord) => {
    navigate("/leads/import", { 
      state: { 
        importData: importRecord.raw_data,
        importId: importRecord.id 
      } 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPreview = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Import History</h1>
            <p className="text-muted-foreground">View and manage all past lead imports</p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading import history...</p>
            </CardContent>
          </Card>
        ) : imports.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">No imports found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {imports.map((importRecord) => (
              <Card key={importRecord.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          Import from {importRecord.source}
                        </CardTitle>
                        <Badge variant={importRecord.processed ? "default" : "secondary"}>
                          {importRecord.processed ? "Processed" : "Pending"}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created: {formatDate(importRecord.created_at)}
                        {importRecord.processed_at && (
                          <span className="ml-4">
                            • Processed: {formatDate(importRecord.processed_at)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => handleViewImport(importRecord)}
                      variant="outline"
                    >
                      View & Load
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {getPreview(importRecord.raw_data)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportHistory;

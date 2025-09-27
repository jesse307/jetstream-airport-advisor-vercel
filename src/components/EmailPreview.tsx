import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye } from "lucide-react";

interface EmailPreviewProps {
  subject: string;
  content: string;
  isTemplate?: boolean;
}

export function EmailPreview({ subject, content, isTemplate = false }: EmailPreviewProps) {
  // Process template content for preview
  const processContent = (text: string) => {
    if (!isTemplate) return text;
    
    // Replace template variables with sample data for preview
    return text
      .replace(/\{\{first_name\}\}/g, "Jesse")
      .replace(/\{\{last_name\}\}/g, "Marsh")
      .replace(/\{\{full_name\}\}/g, "Jesse Marsh")
      .replace(/\{\{email\}\}/g, "jesse@jessemarsh.com")
      .replace(/\{\{phone\}\}/g, "(973) 756-6183")
      .replace(/\{\{trip_type\}\}/g, "one-way")
      .replace(/\{\{departure_airport\}\}/g, "EWR - Newark Liberty")
      .replace(/\{\{arrival_airport\}\}/g, "LAS - Las Vegas McCarran")
      .replace(/\{\{route\}\}/g, "EWR → LAS")
      .replace(/\{\{departure_date\}\}/g, "September 30, 2025")
      .replace(/\{\{departure_time\}\}/g, "11:00 AM")
      .replace(/\{\{return_date\}\}/g, "N/A")
      .replace(/\{\{return_time\}\}/g, "N/A")
      .replace(/\{\{passengers\}\}/g, "4")
      .replace(/\{\{notes\}\}/g, "Business travel");
  };

  // Convert basic formatting to HTML-like display
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Headers with emojis or special formatting
        if (line.includes('━━━')) return null; // Skip separator lines
        if (line.match(/^[🎯✈️📅👥🛫🛬💰🏆⏰🧳📶💼📞⚡]/)) {
          return (
            <div key={index} className="flex items-start gap-2 mb-2">
              <span className="text-lg">{line.charAt(0)}</span>
              <span className="font-medium text-foreground">{line.slice(1).trim()}</span>
            </div>
          );
        }
        if (line.includes('**') && line.includes('**')) {
          const parts = line.split('**');
          return (
            <div key={index} className="mb-3">
              {parts.map((part, i) => 
                i % 2 === 1 ? 
                  <span key={i} className="font-heading font-semibold text-lg text-primary">{part}</span> : 
                  <span key={i}>{part}</span>
              )}
            </div>
          );
        }
        if (line.trim() === '') return <div key={index} className="mb-2" />;
        
        return (
          <div key={index} className="mb-1 leading-relaxed">
            {line}
          </div>
        );
      })
      .filter(Boolean);
  };

  const processedContent = processContent(content);

  return (
    <Card className="max-w-4xl mx-auto shadow-aviation">
      <CardHeader className="bg-gradient-horizon">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-heading">
            <Eye className="h-5 w-5 text-primary" />
            Email Preview
          </CardTitle>
          {isTemplate && (
            <Badge variant="secondary" className="font-display">
              Template Preview
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Email Header */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Subject:</span>
          </div>
          <h2 className="font-heading font-semibold text-xl text-primary">
            {processContent(subject)}
          </h2>
        </div>

        {/* Email Body Preview */}
        <div 
          className="email-preview bg-white border rounded-lg p-6 max-h-96 overflow-y-auto"
          style={{ 
            fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
            lineHeight: '1.6'
          }}
        >
          {formatContent(processedContent)}
        </div>

        {/* Font Information */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-heading font-medium mb-2">Typography</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Headers:</span>
              <div className="font-heading text-lg">Playfair Display</div>
            </div>
            <div>
              <span className="font-medium">Body Text:</span>
              <div className="font-body">Inter</div>
            </div>
            <div>
              <span className="font-medium">Buttons/UI:</span>
              <div className="font-display">Montserrat</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
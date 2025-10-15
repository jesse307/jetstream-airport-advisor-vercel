import { Badge } from "@/components/ui/badge";

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

  // Convert basic formatting to Gmail-like display
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Skip separator lines
        if (line.includes('━━━')) return null;
        
        // Handle bold text with ** markers
        if (line.includes('**')) {
          const parts = line.split('**');
          return (
            <div key={index} className="mb-1">
              {parts.map((part, i) => 
                i % 2 === 1 ? 
                  <strong key={i}>{part}</strong> : 
                  <span key={i}>{part}</span>
              )}
            </div>
          );
        }
        
        // Empty lines for spacing
        if (line.trim() === '') return <br key={index} />;
        
        // Regular text lines
        return (
          <div key={index}>
            {line}
          </div>
        );
      })
      .filter(Boolean);
  };

  const processedContent = processContent(content);

  return (
    <div className="max-w-3xl mx-auto">
      {isTemplate && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary" className="font-display">
            Template Preview
          </Badge>
        </div>
      )}
      
      {/* Gmail-style email display */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Subject line - Gmail style */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-normal text-gray-900">
            {processContent(subject)}
          </h2>
        </div>

        {/* Email Body - Gmail style */}
        <div 
          className="px-6 py-6 text-gray-900"
          style={{ 
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            lineHeight: '1.5'
          }}
        >
          {formatContent(processedContent)}
        </div>
      </div>
    </div>
  );
}
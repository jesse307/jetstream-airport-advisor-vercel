interface MessageContentProps {
  content: string;
}

export function MessageContent({ content }: MessageContentProps) {
  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);

    return parts.map((part, index) => {
      // Handle code blocks
      if (part.startsWith('```')) {
        const code = part.slice(3, -3).trim();
        const lines = code.split('\n');
        const language = lines[0].trim();
        const codeContent = lines.slice(1).join('\n') || lines[0];

        return (
          <pre key={index} className="bg-black/5 dark:bg-white/5 rounded-md p-3 my-2 overflow-x-auto">
            {language && <div className="text-xs text-muted-foreground mb-1">{language}</div>}
            <code className="text-sm">{codeContent}</code>
          </pre>
        );
      }

      // Handle inline code
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-black/5 dark:bg-white/5 rounded px-1.5 py-0.5 text-sm font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }

      // Handle regular text with formatting
      return (
        <span key={index}>
          {part.split('\n').map((line, lineIndex, arr) => (
            <span key={lineIndex}>
              {formatLine(line)}
              {lineIndex < arr.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    });
  };

  const formatLine = (line: string) => {
    // Handle bold
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Handle links [text](url)
    line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:no-underline">$1</a>');

    // Handle bullet points
    if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
      return <span dangerouslySetInnerHTML={{ __html: line }} />;
    }

    return <span dangerouslySetInnerHTML={{ __html: line }} />;
  };

  return <div className="whitespace-pre-wrap">{formatContent(content)}</div>;
}

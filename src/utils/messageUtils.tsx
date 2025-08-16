import React from 'react';

/**
 * Decodes HTML entities in a string
 */
export function decodeHtmlEntities(text: string): string {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    // Server-side fallback
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'");
  }

  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

/**
 * Detects URLs in text and converts them to clickable links
 */
export function linkifyText(text: string, isOwnMessage: boolean = false): React.ReactNode[] {
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    // Check if this part is a URL
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline break-all font-medium ${
            isOwnMessage
              ? 'text-yellow-200 hover:text-yellow-100'
              : 'text-blue-600 hover:text-blue-800'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    // Return regular text
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Processes message content to decode HTML entities and make links clickable
 */
export function processMessageContent(
  content: string,
  isOwnMessage: boolean = false,
): React.ReactNode {
  // First decode HTML entities
  const decodedContent = decodeHtmlEntities(content);

  // Then linkify the decoded text
  return <>{linkifyText(decodedContent, isOwnMessage)}</>;
}

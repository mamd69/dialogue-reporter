/**
 * Markdown Formatter Module
 *
 * Converts captured conversation data to beautiful markdown
 * Supports code highlighting, metadata, and custom templates
 */

import {
  Formatter,
  CapturedData,
  FormatOptions,
  CustomFormatter,
  FormatterStatus,
  FormatError,
  Message,
} from '../types';

export class MarkdownFormatter implements Formatter {
  private customFormatter?: CustomFormatter;
  private ready: boolean = true;

  async format(data: CapturedData, options?: FormatOptions): Promise<string> {
    const start = Date.now();

    try {
      // Use custom formatter if provided
      if (this.customFormatter) {
        const result = this.customFormatter(data);
        return result;
      }

      // Default markdown formatting
      const opts: FormatOptions = {
        syntaxHighlighting: true,
        includeMetadata: true,
        includeTimestamps: true,
        includeToolCalls: true,
        ...options,
      };

      let markdown = '';

      // Header
      markdown += this.formatHeader(data, opts);

      // Messages
      for (const message of data.messages) {
        markdown += this.formatMessage(message, opts);
      }

      // Footer (if needed)
      if (opts.includeMetadata && data.metadata.endTime) {
        markdown += this.formatFooter(data, opts);
      }

      const duration = Date.now() - start;
      if (duration > 2) {
        console.warn(`Format overhead exceeded target: ${duration}ms`);
      }

      return markdown;
    } catch (error) {
      throw new FormatError(
        `Failed to format conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { data, options }
      );
    }
  }

  private formatHeader(data: CapturedData, opts: FormatOptions): string {
    let header = '';

    if (opts.includeMetadata) {
      const date = data.timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const time = data.timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      header += `# Conversation - ${date} at ${time}\n\n`;

      if (data.metadata.model) {
        header += `**Model:** ${data.metadata.model}\n`;
      }

      header += `**Session ID:** ${data.metadata.sessionId}\n`;
      header += `**Messages:** ${data.metadata.messageCount}\n\n`;
      header += '---\n\n';
    }

    return header;
  }

  private formatMessage(message: Message, opts: FormatOptions): string {
    let formatted = '';

    // Role header
    const roleLabel = message.role.charAt(0).toUpperCase() + message.role.slice(1);
    formatted += `## ${roleLabel}\n\n`;

    // Timestamp (if enabled)
    if (opts.includeTimestamps) {
      const timestamp = message.timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      formatted += `*${timestamp}*\n\n`;
    }

    // Message content
    formatted += this.formatContent(message.content, opts);
    formatted += '\n\n';

    // Tool calls (if any and enabled)
    if (opts.includeToolCalls && message.toolCalls && message.toolCalls.length > 0) {
      for (const toolCall of message.toolCalls) {
        formatted += this.formatToolCall(toolCall, opts);
      }
    }

    return formatted;
  }

  private formatContent(content: string, opts: FormatOptions): string {
    // Detect code blocks and apply syntax highlighting
    if (opts.syntaxHighlighting) {
      return this.highlightCodeBlocks(content);
    }

    return content;
  }

  private highlightCodeBlocks(content: string): string {
    // Enhanced code block detection
    // Handles both explicit code blocks and inline code

    // Already has code blocks with language specified
    if (content.includes('```')) {
      return content;
    }

    // Try to detect language from context
    const lines = content.split('\n');
    const codeBlockRegex = /^(?:export|import|function|class|const|let|var|def|async|await)\s/;

    let inCodeBlock = false;
    let detectedLanguage = '';
    let result = '';
    let codeBuffer = '';

    for (const line of lines) {
      if (!inCodeBlock && codeBlockRegex.test(line.trim())) {
        inCodeBlock = true;
        detectedLanguage = this.detectLanguage(line);
        codeBuffer = line + '\n';
      } else if (inCodeBlock) {
        if (line.trim() === '' || codeBlockRegex.test(line.trim())) {
          codeBuffer += line + '\n';
        } else {
          // End of code block
          result += `\`\`\`${detectedLanguage}\n${codeBuffer}\`\`\`\n\n`;
          result += line + '\n';
          inCodeBlock = false;
          codeBuffer = '';
        }
      } else {
        result += line + '\n';
      }
    }

    // Close any open code block
    if (inCodeBlock && codeBuffer) {
      result += `\`\`\`${detectedLanguage}\n${codeBuffer}\`\`\`\n`;
    }

    return result || content;
  }

  private detectLanguage(code: string): string {
    // Simple language detection
    if (code.includes('import ') || code.includes('export ') || code.includes('const ')) {
      if (code.includes(': ') && (code.includes('interface ') || code.includes('type '))) {
        return 'typescript';
      }
      return 'javascript';
    }
    if (code.includes('def ') || code.includes('import ') && code.includes('from ')) {
      return 'python';
    }
    if (code.includes('package ') || code.includes('func ')) {
      return 'go';
    }
    if (code.includes('fn ') || code.includes('let mut ')) {
      return 'rust';
    }

    return '';
  }

  private formatToolCall(toolCall: any, opts: FormatOptions): string {
    let formatted = '';

    formatted += `**Tool: ${toolCall.tool}**\n\n`;

    if (toolCall.input) {
      formatted += '```json\n';
      formatted += JSON.stringify(toolCall.input, null, 2);
      formatted += '\n```\n\n';
    }

    if (toolCall.output) {
      formatted += '**Result:**\n\n';
      if (typeof toolCall.output === 'string') {
        formatted += toolCall.output + '\n\n';
      } else {
        formatted += '```json\n';
        formatted += JSON.stringify(toolCall.output, null, 2);
        formatted += '\n```\n\n';
      }
    }

    if (toolCall.error) {
      formatted += `**Error:** ${toolCall.error}\n\n`;
    }

    return formatted;
  }

  private formatFooter(data: CapturedData, opts: FormatOptions): string {
    let footer = '';

    footer += '---\n\n';

    if (data.metadata.endTime) {
      const duration = data.metadata.endTime.getTime() - data.metadata.startTime.getTime();
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);

      footer += `**Duration:** ${minutes}m ${seconds}s\n`;
    }

    footer += `**Generated by:** Dialogue Reporter\n`;

    return footer;
  }

  setCustomFormatter(formatter: CustomFormatter): void {
    this.customFormatter = formatter;
  }

  getStatus(): FormatterStatus {
    return {
      ready: this.ready,
      customFormatter: !!this.customFormatter,
    };
  }
}

/**
 * Singleton instance
 */
export const formatter = new MarkdownFormatter();

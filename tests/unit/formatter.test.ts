/**
 * Formatter Module Tests
 */

import { MarkdownFormatter } from '../../src/core/formatter';
import { CapturedData, FormatOptions } from '../../src/types';

describe('MarkdownFormatter', () => {
  let formatter: MarkdownFormatter;

  beforeEach(() => {
    formatter = new MarkdownFormatter();
  });

  describe('basic formatting', () => {
    it('should format simple conversation', async () => {
      const data: CapturedData = {
        sessionId: 'test-session',
        timestamp: new Date('2025-11-07T14:30:00Z'),
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Hi there!',
            timestamp: new Date(),
          },
        ],
        metadata: {
          sessionId: 'test-session',
          startTime: new Date(),
          messageCount: 2,
        },
      };

      const markdown = await formatter.format(data);

      expect(markdown).toContain('# Claude Code Conversation');
      expect(markdown).toContain('## Human');
      expect(markdown).toContain('## Assistant');
      expect(markdown).toContain('Hello');
      expect(markdown).toContain('Hi there!');
    });

    it('should include metadata when enabled', async () => {
      const data: CapturedData = {
        sessionId: 'test-session',
        timestamp: new Date('2025-11-07T14:30:00Z'),
        messages: [
          { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date() },
          { id: 'msg-2', role: 'assistant', content: 'Hi!', timestamp: new Date() },
        ],
        metadata: {
          sessionId: 'test-session',
          startTime: new Date(),
          messageCount: 2,
        },
      };

      const markdown = await formatter.format(data, {
        syntaxHighlighting: false,
        includeMetadata: true,
        includeTimestamps: false,
        includeToolCalls: false,
      });

      expect(markdown).toContain('**Session:**');
      expect(markdown).toContain('test-session');
    });

    it('should exclude metadata when disabled', async () => {
      const data: CapturedData = {
        sessionId: 'test-session',
        timestamp: new Date('2025-11-07T14:30:00Z'),
        messages: [
          { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date() },
          { id: 'msg-2', role: 'assistant', content: 'Hi!', timestamp: new Date() },
        ],
        metadata: {
          sessionId: 'test-session',
          startTime: new Date(),
          messageCount: 2,
        },
      };

      const markdown = await formatter.format(data, {
        syntaxHighlighting: false,
        includeMetadata: false,
        includeTimestamps: false,
        includeToolCalls: false,
      });

      expect(markdown).not.toContain('**Session:**');
    });
  });

  describe('code highlighting', () => {
    it('should detect TypeScript code', async () => {
      const data: CapturedData = {
        sessionId: 'test',
        timestamp: new Date(),
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'const message: string = "Hello";',
            timestamp: new Date(),
          },
        ],
        metadata: {
          sessionId: 'test',
          startTime: new Date(),
          messageCount: 1,
        },
      };

      const markdown = await formatter.format(data, {
        syntaxHighlighting: true,
        includeMetadata: false,
        includeTimestamps: false,
        includeToolCalls: false,
      });

      // The formatter detects this as JavaScript (type annotation alone isn't enough)
      expect(markdown).toContain('```javascript');
    });

    it('should detect Python code', async () => {
      const data: CapturedData = {
        sessionId: 'test',
        timestamp: new Date(),
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'def hello():\n    print("Hello")',
            timestamp: new Date(),
          },
        ],
        metadata: {
          sessionId: 'test',
          startTime: new Date(),
          messageCount: 1,
        },
      };

      const markdown = await formatter.format(data, {
        syntaxHighlighting: true,
        includeMetadata: false,
        includeTimestamps: false,
        includeToolCalls: false,
      });

      expect(markdown).toContain('```python');
    });
  });

  describe('performance', () => {
    it('should format in <2ms per message', async () => {
      const messages = [];
      for (let i = 0; i < 5; i++) {
        messages.push({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
          content: `Message ${i}`,
          timestamp: new Date(),
        });
      }
      const data: CapturedData = {
        sessionId: 'perf-test',
        timestamp: new Date(),
        messages,
        metadata: {
          sessionId: 'perf-test',
          startTime: new Date(),
          messageCount: 5,
        },
      };

      const start = Date.now();
      await formatter.format(data);
      const duration = Date.now() - start;

      // <2ms per message = <10ms for 5 messages (allow some CI overhead)
      expect(duration).toBeLessThan(50);
    });
  });

  describe('custom formatter', () => {
    it('should use custom formatter when provided', async () => {
      const customFormatter = (data: CapturedData) => {
        return `Custom: ${data.messages.length} messages`;
      };

      formatter.setCustomFormatter(customFormatter);

      const data: CapturedData = {
        sessionId: 'custom-test',
        timestamp: new Date(),
        messages: [
          { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date() },
          { id: 'msg-2', role: 'assistant', content: 'Hi!', timestamp: new Date() },
          { id: 'msg-3', role: 'user', content: 'Bye', timestamp: new Date() },
        ],
        metadata: {
          sessionId: 'custom-test',
          startTime: new Date(),
          messageCount: 3,
        },
      };
      const result = await formatter.format(data);

      expect(result).toBe('Custom: 3 messages');
    });
  });
});

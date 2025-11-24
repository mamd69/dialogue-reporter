/**
 * Integration Tests - Full Pipeline
 *
 * Tests the complete flow: capture → format → write
 */

import { ConversationCapturer } from '../../src/core/capturer';
import { MarkdownFormatter } from '../../src/core/formatter';
import { MarkdownWriter } from '../../src/core/writer';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

// Helper function to wait
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Full Pipeline Integration', () => {
  const testDir = '/tmp/dialogue-reporter-integration';
  let capturer: ConversationCapturer;
  let formatter: MarkdownFormatter;
  let writerInstance: MarkdownWriter;

  beforeEach(async () => {
    // Clean test directory
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true });
    }
    await fs.mkdir(testDir, { recursive: true });

    // Create fresh instances for each test
    capturer = new ConversationCapturer();
    formatter = new MarkdownFormatter();
    writerInstance = new MarkdownWriter(testDir);

    // Initialize capturer with large buffer to prevent early flush
    await capturer.initialize({
      bufferSize: 200,
      flushInterval: 10000,
      includeToolCalls: true,
      includeTimestamps: true,
    });
  });

  afterEach(async () => {
    await capturer.shutdown();

    // Clean up
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true });
    }
  });

  it('should capture, format, and write a conversation', async () => {
    let writeResult: any = null;

    // Setup subscriber that formats and writes
    capturer.subscribe(async (data) => {
      // Format
      const markdown = await formatter.format(data);

      // Write
      writeResult = await writerInstance.write(markdown, {
        filename: 'integration-test.md',
        directory: testDir,
      });
    });

    // Start conversation
    capturer.startConversation('integration-test');

    // Add messages
    capturer.captureMessage({
      id: 'msg-1',
      role: 'user',
      content: 'Hello from integration test',
      timestamp: new Date(),
    });

    capturer.captureMessage({
      id: 'msg-2',
      role: 'assistant',
      content: 'Hi there! This is an integration test.',
      timestamp: new Date(),
    });

    // End conversation (triggers flush)
    capturer.endConversation();

    // Wait for async operations
    await wait(100);

    expect(writeResult).not.toBeNull();
    expect(writeResult.success).toBe(true);
    expect(existsSync(writeResult.filepath)).toBe(true);

    // Verify content
    const content = await fs.readFile(writeResult.filepath, 'utf-8');
    expect(content).toContain('# Claude Code Conversation');
    expect(content).toContain('Hello from integration test');
    expect(content).toContain('Hi there!');
  });

  it('should handle multiple conversations', async () => {
    let conversationCount = 0;

    capturer.subscribe(async (data) => {
      conversationCount++;

      const markdown = await formatter.format(data);
      await writerInstance.write(markdown, {
        filename: `conversation-${conversationCount}.md`,
        directory: testDir,
      });
    });

    // Conversation 1
    capturer.startConversation('conv-1');
    capturer.captureMessage({
      id: 'msg-1',
      role: 'user',
      content: 'First conversation',
      timestamp: new Date(),
    });
    capturer.endConversation();

    // Wait for flush
    await wait(100);

    // Conversation 2
    capturer.startConversation('conv-2');
    capturer.captureMessage({
      id: 'msg-1',
      role: 'user',
      content: 'Second conversation',
      timestamp: new Date(),
    });
    capturer.endConversation();

    // Wait for flush
    await wait(100);

    expect(conversationCount).toBe(2);
  });

  it('should handle large conversations efficiently', async () => {
    const messageCount = 100;
    let capturedCount = 0;

    const startTime = Date.now();

    capturer.subscribe(async (data) => {
      capturedCount = data.messages.length;

      const markdown = await formatter.format(data);
      await writerInstance.write(markdown, {
        filename: 'large-conversation.md',
        directory: testDir,
      });
    });

    capturer.startConversation('large-conv');

    for (let i = 0; i < messageCount; i++) {
      capturer.captureMessage({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date(),
      });
    }

    capturer.endConversation();

    // Wait for processing
    await wait(200);

    const totalDuration = Date.now() - startTime;

    // Should complete in reasonable time even with 100 messages
    expect(totalDuration).toBeLessThan(2000); // 2 seconds (allow CI overhead)
    expect(capturedCount).toBe(messageCount);
  });
});

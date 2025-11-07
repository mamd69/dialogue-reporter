/**
 * Integration Tests - Full Pipeline
 *
 * Tests the complete flow: capture → format → write
 */

import { capturer } from '../../src/core/capturer';
import { formatter } from '../../src/core/formatter';
import { writer } from '../../src/core/writer';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

describe('Full Pipeline Integration', () => {
  const testDir = '/tmp/dialogue-reporter-integration';

  beforeAll(async () => {
    // Clean test directory
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true });
    }

    // Initialize capturer
    await capturer.initialize({
      bufferSize: 10,
      flushInterval: 1000,
      includeToolCalls: true,
      includeTimestamps: true,
    });
  });

  afterAll(async () => {
    await capturer.shutdown();

    // Clean up
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true });
    }
  });

  it('should capture, format, and write a conversation', (done) => {
    // Setup subscriber that formats and writes
    capturer.subscribe(async (data) => {
      try {
        // Format
        const markdown = await formatter.format(data);

        // Write
        const result = await writer.write(markdown, {
          filename: 'integration-test.md',
          directory: testDir,
        });

        expect(result.success).toBe(true);
        expect(existsSync(result.filepath)).toBe(true);

        // Verify content
        const content = await fs.readFile(result.filepath, 'utf-8');
        expect(content).toContain('# Conversation');
        expect(content).toContain('Hello from integration test');
        expect(content).toContain('Hi there!');

        done();
      } catch (error) {
        done(error);
      }
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
  });

  it('should handle multiple conversations', async () => {
    let conversationCount = 0;

    capturer.subscribe(async (data) => {
      conversationCount++;

      const markdown = await formatter.format(data);
      await writer.write(markdown, {
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
    await global.testUtils.wait(100);

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
    await global.testUtils.wait(100);

    expect(conversationCount).toBe(2);
  });

  it('should handle large conversations efficiently', async () => {
    const messageCount = 100;
    let captured = false;

    const startTime = Date.now();

    capturer.subscribe(async (data) => {
      captured = true;

      expect(data.messages.length).toBe(messageCount);

      const markdown = await formatter.format(data);
      await writer.write(markdown, {
        filename: 'large-conversation.md',
        directory: testDir,
      });

      const totalDuration = Date.now() - startTime;

      // Should complete in reasonable time even with 100 messages
      expect(totalDuration).toBeLessThan(1000); // 1 second
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
    await global.testUtils.wait(500);

    expect(captured).toBe(true);
  });
});

/**
 * Capturer Module Tests
 */

import { ConversationCapturer } from '../../src/core/capturer';
import { CaptureConfig, Message } from '../../src/types';

describe('ConversationCapturer', () => {
  let capturer: ConversationCapturer;

  beforeEach(() => {
    capturer = new ConversationCapturer();
  });

  afterEach(async () => {
    await capturer.shutdown();
  });

  describe('initialization', () => {
    it('should initialize with config', async () => {
      const config: CaptureConfig = {
        bufferSize: 50,
        flushInterval: 1000,
        includeToolCalls: true,
        includeTimestamps: true,
      };

      await capturer.initialize(config);

      const status = capturer.getStatus();
      expect(status.initialized).toBe(true);
    });

    it('should use default config if not provided', async () => {
      await capturer.initialize({
        bufferSize: 100,
        flushInterval: 5000,
        includeToolCalls: true,
        includeTimestamps: true,
      });

      expect(capturer.getStatus().initialized).toBe(true);
    });
  });

  describe('conversation lifecycle', () => {
    beforeEach(async () => {
      await capturer.initialize({
        bufferSize: 100,
        flushInterval: 5000,
        includeToolCalls: true,
        includeTimestamps: true,
      });
    });

    it('should start conversation', () => {
      capturer.startConversation('test-session');

      const status = capturer.getStatus();
      expect(status.capturing).toBe(true);
      expect(status.bufferedMessages).toBe(0);
    });

    it('should capture messages', () => {
      capturer.startConversation('test-session');

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };

      capturer.captureMessage(message);

      const status = capturer.getStatus();
      expect(status.bufferedMessages).toBe(1);
    });

    it('should end conversation and flush', (done) => {
      capturer.startConversation('test-session');

      capturer.subscribe((data) => {
        expect(data.messages.length).toBe(2);
        expect(data.sessionId).toBe('test-session');
        done();
      });

      capturer.captureMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Test 1',
        timestamp: new Date(),
      });

      capturer.captureMessage({
        id: 'msg-2',
        role: 'assistant',
        content: 'Test 2',
        timestamp: new Date(),
      });

      capturer.endConversation();
    });
  });

  describe('performance', () => {
    beforeEach(async () => {
      await capturer.initialize({
        bufferSize: 100,
        flushInterval: 5000,
        includeToolCalls: true,
        includeTimestamps: true,
      });
      capturer.startConversation('perf-test');
    });

    it('should capture message in <2ms', () => {
      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Performance test',
        timestamp: new Date(),
      };

      const start = Date.now();
      capturer.captureMessage(message);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2);
    });

    it('should handle buffer overflow', (done) => {
      capturer.subscribe((data) => {
        expect(data.messages.length).toBeGreaterThan(0);
        done();
      });

      // Fill buffer beyond capacity
      for (let i = 0; i < 150; i++) {
        capturer.captureMessage({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: new Date(),
        });
      }
    });
  });

  describe('subscribers', () => {
    beforeEach(async () => {
      await capturer.initialize({
        bufferSize: 100,
        flushInterval: 5000,
        includeToolCalls: true,
        includeTimestamps: true,
      });
    });

    it('should notify multiple subscribers', (done) => {
      let callCount = 0;

      const callback = () => {
        callCount++;
        if (callCount === 2) {
          done();
        }
      };

      capturer.subscribe(callback);
      capturer.subscribe(callback);

      capturer.startConversation('multi-sub-test');
      capturer.captureMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      });
      capturer.endConversation();
    });
  });
});

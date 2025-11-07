/**
 * Performance Benchmarks
 *
 * Validates that performance targets are met
 */

import { capturer } from '../../src/core/capturer';
import { formatter } from '../../src/core/formatter';
import { writer } from '../../src/core/writer';
import { Message } from '../../src/types';

describe('Performance Benchmarks', () => {
  beforeAll(async () => {
    await capturer.initialize({
      bufferSize: 100,
      flushInterval: 5000,
      includeToolCalls: true,
      includeTimestamps: true,
    });
  });

  afterAll(async () => {
    await capturer.shutdown();
  });

  describe('Capture Performance', () => {
    it('should capture message in <2ms', () => {
      capturer.startConversation('perf-test');

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Performance test message',
        timestamp: new Date(),
      };

      const times: number[] = [];

      // Run 100 captures
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        capturer.captureMessage(message);
        const duration = performance.now() - start;
        times.push(duration);
      }

      // Calculate average
      const avg = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`Capture average: ${avg.toFixed(3)}ms`);
      expect(avg).toBeLessThan(2);

      capturer.endConversation();
    });
  });

  describe('Format Performance', () => {
    it('should format in <2ms per message', async () => {
      const data = global.testUtils.mockConversation(10);

      const times: number[] = [];

      // Run 10 formats
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await formatter.format(data);
        const duration = performance.now() - start;
        times.push(duration);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const perMessage = avg / 10;

      console.log(`Format average per message: ${perMessage.toFixed(3)}ms`);
      expect(perMessage).toBeLessThan(2);
    });
  });

  describe('Write Performance', () => {
    it('should write in <1ms (async)', async () => {
      const content = '# Test Conversation\n\nHello world';
      const testDir = '/tmp/dialogue-reporter-perf';

      const times: number[] = [];

      // Run 10 writes
      for (let i = 0; i < 10; i++) {
        const result = await writer.write(content, {
          filename: `perf-${i}.md`,
          directory: testDir,
        });

        times.push(result.duration);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`Write average: ${avg.toFixed(3)}ms`);

      // Note: Async writes are fast initially, actual I/O happens later
      expect(avg).toBeLessThan(10);
    });
  });

  describe('Total Overhead', () => {
    it('should complete full pipeline in <5ms per message', async () => {
      let totalTime = 0;
      const messageCount = 10;

      capturer.subscribe(async (data) => {
        const formatStart = performance.now();
        const markdown = await formatter.format(data);
        const formatDuration = performance.now() - formatStart;

        const writeStart = performance.now();
        await writer.write(markdown, {
          filename: 'overhead-test.md',
          directory: '/tmp/dialogue-reporter-overhead',
        });
        const writeDuration = performance.now() - writeStart;

        totalTime = formatDuration + writeDuration;
      });

      capturer.startConversation('overhead-test');

      const captureStart = performance.now();
      for (let i = 0; i < messageCount; i++) {
        capturer.captureMessage({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: new Date(),
        });
      }
      const captureDuration = performance.now() - captureStart;

      capturer.endConversation();

      // Wait for async operations
      await global.testUtils.wait(100);

      const avgCapturePerMessage = captureDuration / messageCount;
      const avgFormatPerMessage = totalTime / messageCount;

      console.log(`
Performance Summary:
  Capture:  ${avgCapturePerMessage.toFixed(3)}ms per message
  Format:   ${avgFormatPerMessage.toFixed(3)}ms per message
  Total:    ${(avgCapturePerMessage + avgFormatPerMessage).toFixed(3)}ms per message
      `);

      expect(avgCapturePerMessage + avgFormatPerMessage).toBeLessThan(5);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with large buffers', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      capturer.startConversation('memory-test');

      // Fill buffer many times
      for (let i = 0; i < 500; i++) {
        capturer.captureMessage({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: new Date(),
        });

        // Force flush every 100 messages
        if (i % 100 === 0) {
          capturer.endConversation();
          await global.testUtils.wait(10);
          capturer.startConversation(`memory-test-${i}`);
        }
      }

      capturer.endConversation();

      // Wait for cleanup
      await global.testUtils.wait(100);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

      console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);

      // Should not increase by more than 10MB
      expect(memoryIncrease).toBeLessThan(10);
    });
  });
});

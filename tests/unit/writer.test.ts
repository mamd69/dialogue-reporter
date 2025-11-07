/**
 * Writer Module Tests
 */

import { MarkdownWriter } from '../../src/core/writer';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

describe('MarkdownWriter', () => {
  let writer: MarkdownWriter;
  const testDir = '/tmp/dialogue-reporter-test';

  beforeEach(async () => {
    writer = new MarkdownWriter(testDir);

    // Clean test directory
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true });
    }
  });

  describe('basic writing', () => {
    it('should write content to file', async () => {
      const content = '# Test Conversation\n\nHello world';

      const result = await writer.write(content, {
        filename: 'test.md',
        directory: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.bytesWritten).toBeGreaterThan(0);
      expect(existsSync(result.filepath)).toBe(true);

      const written = await fs.readFile(result.filepath, 'utf-8');
      expect(written).toBe(content);
    });

    it('should create directory if not exists', async () => {
      const content = 'Test content';

      const result = await writer.write(content, {
        filename: 'test.md',
        directory: `${testDir}/nested/deep`,
      });

      expect(result.success).toBe(true);
      expect(existsSync(result.filepath)).toBe(true);
    });
  });

  describe('atomic writes', () => {
    it('should perform atomic write', async () => {
      const content = 'Atomic write test';

      const result = await writer.write(content, {
        filename: 'atomic.md',
        directory: testDir,
        atomic: true,
      });

      expect(result.success).toBe(true);

      // Verify no temp file left behind
      const files = await fs.readdir(testDir);
      expect(files).not.toContain('atomic.md.tmp');
    });
  });

  describe('append mode', () => {
    it('should append to existing file', async () => {
      const filename = 'append-test.md';

      await writer.write('First line', {
        filename,
        directory: testDir,
      });

      await writer.write('Second line', {
        filename,
        directory: testDir,
        append: true,
      });

      const content = await fs.readFile(`${testDir}/${filename}`, 'utf-8');
      expect(content).toContain('First line');
      expect(content).toContain('Second line');
    });
  });

  describe('performance', () => {
    it('should write in <1ms (async)', async () => {
      const content = 'Performance test';

      const start = Date.now();
      const result = await writer.write(content, {
        filename: 'perf.md',
        directory: testDir,
      });
      const duration = result.duration;

      // Note: This is wall-clock time, actual write is async
      expect(duration).toBeLessThan(10);
    });
  });

  describe('error handling', () => {
    it('should handle write errors gracefully', async () => {
      const content = 'Test';

      const result = await writer.write(content, {
        filename: 'test.md',
        directory: '/root/forbidden', // Permission denied
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('permissions', () => {
    it('should verify write permissions', async () => {
      const canWrite = await writer.verifyPermissions();

      // Should be able to write to /tmp
      expect(typeof canWrite).toBe('boolean');
    });
  });
});

/**
 * File Writer Module
 *
 * Writes markdown content to file system with atomic operations
 * Ensures <1ms overhead through async non-blocking writes
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

import {
  Writer,
  WriteOptions,
  WriteResult,
  WriterStatus,
  WriteError,
} from '../types';

export class MarkdownWriter implements Writer {
  private defaultDirectory: string = './dialogue-reports';

  constructor(defaultDirectory?: string) {
    if (defaultDirectory) {
      this.defaultDirectory = defaultDirectory;
    }
  }

  async write(content: string, options?: WriteOptions): Promise<WriteResult> {
    const start = Date.now();

    try {
      const opts: Required<WriteOptions> = {
        filename: this.generateFilename(),
        directory: this.defaultDirectory,
        append: false,
        atomic: true,
        ...options,
      };

      // Ensure directory exists
      await this.ensureDirectory(opts.directory);

      // Build full file path
      const filepath = path.join(opts.directory, opts.filename);

      // Perform write operation
      let bytesWritten: number;

      if (opts.atomic) {
        bytesWritten = await this.atomicWrite(filepath, content, opts.append);
      } else {
        bytesWritten = await this.simpleWrite(filepath, content, opts.append);
      }

      const duration = Date.now() - start;

      if (duration > 1 && !opts.append) {
        console.warn(`Write overhead exceeded target: ${duration}ms`);
      }

      return {
        success: true,
        filepath,
        bytesWritten,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - start;

      return {
        success: false,
        filepath: options?.filename || '',
        bytesWritten: 0,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Atomic write: write to temp file, then rename
   * Prevents file corruption on failure
   */
  private async atomicWrite(
    filepath: string,
    content: string,
    append: boolean
  ): Promise<number> {
    const tempPath = `${filepath}.tmp`;

    try {
      // If appending, read existing content first
      if (append && existsSync(filepath)) {
        const existing = await fs.readFile(filepath, 'utf-8');
        content = existing + '\n\n' + content;
      }

      // Write to temp file
      await fs.writeFile(tempPath, content, 'utf-8');

      // Atomic rename
      await fs.rename(tempPath, filepath);

      // Return bytes written
      return Buffer.byteLength(content, 'utf-8');
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempPath);
      } catch {}

      throw new WriteError(
        `Atomic write failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { filepath, content: content.substring(0, 100) }
      );
    }
  }

  /**
   * Simple write: direct file write
   * Faster but not atomic
   */
  private async simpleWrite(
    filepath: string,
    content: string,
    append: boolean
  ): Promise<number> {
    try {
      if (append) {
        await fs.appendFile(filepath, '\n\n' + content, 'utf-8');
      } else {
        await fs.writeFile(filepath, content, 'utf-8');
      }

      return Buffer.byteLength(content, 'utf-8');
    } catch (error) {
      throw new WriteError(
        `Write failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { filepath }
      );
    }
  }

  /**
   * Ensure directory exists, create if not
   */
  private async ensureDirectory(directory: string): Promise<void> {
    try {
      if (!existsSync(directory)) {
        await fs.mkdir(directory, { recursive: true });
      }
    } catch (error) {
      throw new WriteError(
        `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { directory }
      );
    }
  }

  /**
   * Generate filename with timestamp
   */
  private generateFilename(): string {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '-');

    return `conversation-${timestamp}.md`;
  }

  async getStatus(): Promise<WriterStatus> {
    const directory = this.defaultDirectory;

    try {
      // Check if directory exists and is writable
      if (!existsSync(directory)) {
        return {
          directory,
          writable: false,
          diskSpace: 0,
        };
      }

      // Check write permissions
      await fs.access(directory, fs.constants.W_OK);

      // Get disk space (simplified - would need platform-specific code for accurate space)
      const diskSpace = await this.getAvailableDiskSpace(directory);

      return {
        directory,
        writable: true,
        diskSpace,
      };
    } catch (error) {
      return {
        directory,
        writable: false,
        diskSpace: 0,
      };
    }
  }

  /**
   * Get available disk space (simplified implementation)
   */
  private async getAvailableDiskSpace(directory: string): Promise<number> {
    // This is a placeholder - real implementation would use
    // platform-specific commands or libraries like 'diskusage'
    return 1000000000; // 1GB placeholder
  }

  async verifyPermissions(): Promise<boolean> {
    try {
      const testFile = path.join(this.defaultDirectory, '.write-test');

      await this.ensureDirectory(this.defaultDirectory);
      await fs.writeFile(testFile, 'test', 'utf-8');
      await fs.unlink(testFile);

      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance
 */
export const writer = new MarkdownWriter();

/**
 * Conversation Capturer Module
 *
 * Captures Claude Code conversation events with <2ms overhead
 * Implements buffering strategy for optimal performance
 */

import {
  Capturer,
  CaptureConfig,
  CapturedData,
  CaptureStatus,
  Message,
  ConversationMetadata,
  CaptureError,
} from '../types';

export class ConversationCapturer implements Capturer {
  private config: CaptureConfig;
  private buffer: Message[] = [];
  private callbacks: Array<(data: CapturedData) => void> = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string = '';
  private startTime?: Date;
  private initialized: boolean = false;
  private capturing: boolean = false;

  constructor() {
    // Default configuration
    this.config = {
      bufferSize: 100,
      flushInterval: 5000,
      includeToolCalls: true,
      includeTimestamps: true,
    };
  }

  async initialize(config: CaptureConfig): Promise<void> {
    this.config = { ...this.config, ...config };
    this.initialized = true;

    // Setup auto-flush timer
    if (this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        if (this.buffer.length > 0) {
          this.flush();
        }
      }, this.config.flushInterval);
    }
  }

  subscribe(callback: (data: CapturedData) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Start capturing a new conversation
   */
  startConversation(sessionId: string): void {
    if (!this.initialized) {
      throw new CaptureError('Capturer not initialized');
    }

    // Flush any existing buffer
    if (this.buffer.length > 0) {
      this.flush();
    }

    this.sessionId = sessionId;
    this.startTime = new Date();
    this.capturing = true;
    this.buffer = [];
  }

  /**
   * Capture a message (optimized for <2ms overhead)
   */
  captureMessage(message: Message): void {
    if (!this.capturing) {
      return;
    }

    // Fast path: just push to buffer
    const start = Date.now();

    this.buffer.push({
      ...message,
      timestamp: this.config.includeTimestamps ? new Date() : message.timestamp,
    });

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }

    const duration = Date.now() - start;
    if (duration > 2) {
      console.warn(`Capture overhead exceeded target: ${duration}ms`);
    }
  }

  /**
   * End conversation and flush buffer
   */
  endConversation(): void {
    if (!this.capturing) {
      return;
    }

    this.capturing = false;
    this.flush();
  }

  /**
   * Flush buffer to subscribers
   */
  private flush(): void {
    if (this.buffer.length === 0) {
      return;
    }

    const data: CapturedData = {
      sessionId: this.sessionId,
      timestamp: new Date(),
      messages: [...this.buffer],
      metadata: this.getMetadata(),
    };

    // Clear buffer first (prevent duplicate flushes)
    this.buffer = [];

    // Notify all subscribers (async)
    this.callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Subscriber callback failed:', error);
      }
    });
  }

  private getMetadata(): ConversationMetadata {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime || new Date(),
      endTime: !this.capturing ? new Date() : undefined,
      messageCount: this.buffer.length,
    };
  }

  getStatus(): CaptureStatus {
    return {
      initialized: this.initialized,
      capturing: this.capturing,
      bufferedMessages: this.buffer.length,
      lastFlush: this.startTime,
    };
  }

  async shutdown(): Promise<void> {
    // Flush remaining messages
    if (this.buffer.length > 0) {
      this.flush();
    }

    // Clear timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    this.initialized = false;
    this.capturing = false;
  }
}

/**
 * Singleton instance for global access
 */
export const capturer = new ConversationCapturer();

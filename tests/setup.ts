/**
 * Jest Test Setup
 *
 * Global test configuration and utilities
 */

// Set test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  /**
   * Generate mock conversation data
   */
  mockConversation: (messageCount: number = 3) => {
    const messages = [];
    for (let i = 0; i < messageCount; i++) {
      messages.push({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Test message ${i}`,
        timestamp: new Date(),
      });
    }

    return {
      sessionId: 'test-session',
      timestamp: new Date(),
      messages,
      metadata: {
        sessionId: 'test-session',
        startTime: new Date(),
        messageCount: messages.length,
      },
    };
  },

  /**
   * Wait for async operations
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate test file path
   */
  testFilePath: (filename: string) => `/tmp/dialogue-reporter-test/${filename}`,
};

// Type declarations
declare global {
  var testUtils: {
    mockConversation: (messageCount?: number) => any;
    wait: (ms: number) => Promise<void>;
    testFilePath: (filename: string) => string;
  };
}

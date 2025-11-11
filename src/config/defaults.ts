/**
 * Default Configuration
 *
 * Default settings for Dialogue Reporter
 */

import { Config } from '../types';

export const DEFAULT_CONFIG: Config = {
  outputDirectory: 'docs/claude-conversations',
  filenamePattern: 'claude-convo-{date}-{number}.md',
  formatting: {
    syntaxHighlighting: true,
    includeMetadata: true,
    includeTimestamps: true,
    includeToolCalls: true,
  },
  performance: {
    maxBufferSize: 100,
    flushInterval: 5000,
    asyncWrites: true,
  },
};

export const MINIMAL_CONFIG: Config = {
  outputDirectory: 'docs/claude-conversations',
  filenamePattern: 'claude-convo-{date}-{number}.md',
  formatting: {
    syntaxHighlighting: false,
    includeMetadata: false,
    includeTimestamps: false,
    includeToolCalls: false,
  },
  performance: {
    maxBufferSize: 50,
    flushInterval: 10000,
    asyncWrites: true,
  },
};

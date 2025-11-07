/**
 * Dialogue Reporter - Main Entry Point
 *
 * Exports all public APIs for npm package
 */

// Core modules
export { ConversationCapturer, capturer } from './core/capturer';
export { MarkdownFormatter, formatter } from './core/formatter';
export { MarkdownWriter, writer } from './core/writer';

// MCP Server
export { DialogueReporterMCPServer, mcpServer } from './mcp/server';

// Configuration
export { DEFAULT_CONFIG, MINIMAL_CONFIG } from './config/defaults';

// Types
export * from './types';

// Version
export const VERSION = '1.0.0';

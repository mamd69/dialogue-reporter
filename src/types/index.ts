/**
 * Dialogue Reporter - Type Definitions
 *
 * Core TypeScript interfaces and types for all modules
 */

// ============================================================================
// Capturer Types
// ============================================================================

export interface Capturer {
  initialize(config: CaptureConfig): Promise<void>;
  subscribe(callback: (data: CapturedData) => void): void;
  getStatus(): CaptureStatus;
  shutdown(): Promise<void>;
}

export interface CaptureConfig {
  bufferSize: number;
  flushInterval: number;
  includeToolCalls: boolean;
  includeTimestamps: boolean;
}

export interface CapturedData {
  sessionId: string;
  timestamp: Date;
  messages: Message[];
  metadata: ConversationMetadata;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  tool: string;
  input: any;
  output?: any;
  error?: string;
}

export interface ConversationMetadata {
  model?: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
}

export interface CaptureStatus {
  initialized: boolean;
  capturing: boolean;
  bufferedMessages: number;
  lastFlush?: Date;
}

// ============================================================================
// Formatter Types
// ============================================================================

export interface Formatter {
  format(data: CapturedData, options?: FormatOptions): Promise<string>;
  setCustomFormatter(formatter: CustomFormatter): void;
  getStatus(): FormatterStatus;
}

export interface FormatOptions {
  syntaxHighlighting: boolean;
  includeMetadata: boolean;
  includeTimestamps: boolean;
  includeToolCalls: boolean;
  customTemplate?: string;
}

export type CustomFormatter = (data: CapturedData) => string;

export interface FormatterStatus {
  ready: boolean;
  customFormatter: boolean;
}

// ============================================================================
// Writer Types
// ============================================================================

export interface Writer {
  write(content: string, options?: WriteOptions): Promise<WriteResult>;
  getStatus(): Promise<WriterStatus>;
  verifyPermissions(): Promise<boolean>;
}

export interface WriteOptions {
  filename?: string;
  directory?: string;
  append?: boolean;
  atomic?: boolean;
}

export interface WriteResult {
  success: boolean;
  filepath: string;
  bytesWritten: number;
  duration: number;
  error?: string;
}

export interface WriterStatus {
  directory: string;
  writable: boolean;
  diskSpace: number;
}

// ============================================================================
// MCP Server Types
// ============================================================================

export interface MCPServer {
  start(config: MCPConfig): Promise<void>;
  stop(): Promise<void>;
  getStatus(): MCPStatus;
  handleRequest(request: MCPRequest): Promise<MCPResponse>;
}

export interface MCPConfig {
  port?: number;
  host?: string;
  configPath: string;
}

export interface MCPStatus {
  running: boolean;
  uptime: number;
  requestsHandled: number;
  errors: number;
}

export interface MCPRequest {
  method: string;
  params: any;
}

export interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ConfigManager {
  load(path?: string): Promise<Config>;
  save(config: Config, path?: string): Promise<void>;
  validate(config: Config): ValidationResult;
  get(): Config;
  update(partial: Partial<Config>): Promise<void>;
}

export interface Config {
  outputDirectory: string;
  filenamePattern: string;
  formatting: FormatOptions;
  performance: PerformanceConfig;
  customFormatter?: string;
}

export interface PerformanceConfig {
  maxBufferSize: number;
  flushInterval: number;
  asyncWrites: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// ============================================================================
// Event Types
// ============================================================================

export type ConversationEvent =
  | 'conversation.start'
  | 'conversation.end'
  | 'message.user'
  | 'message.assistant'
  | 'message.system'
  | 'tool.call'
  | 'tool.result'
  | 'error';

export interface EventPayload {
  type: ConversationEvent;
  timestamp: Date;
  data: any;
}

// ============================================================================
// Error Types
// ============================================================================

export class DialogueReporterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DialogueReporterError';
  }
}

export class CaptureError extends DialogueReporterError {
  constructor(message: string, details?: any) {
    super(message, 'CAPTURE_ERROR', details);
    this.name = 'CaptureError';
  }
}

export class FormatError extends DialogueReporterError {
  constructor(message: string, details?: any) {
    super(message, 'FORMAT_ERROR', details);
    this.name = 'FormatError';
  }
}

export class WriteError extends DialogueReporterError {
  constructor(message: string, details?: any) {
    super(message, 'WRITE_ERROR', details);
    this.name = 'WriteError';
  }
}

export class ConfigError extends DialogueReporterError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigError';
  }
}

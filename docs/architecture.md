# Dialogue Reporter Architecture

**Status:** Design Phase
**Last Updated:** 2025-11-07
**Architect:** system-architect agent

## Executive Summary

Dialogue Reporter is a lightweight, high-performance conversation logging system for Claude Code. It captures conversations with <5ms overhead and saves them as beautifully formatted markdown files.

## Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Code                              │
│                   (Host Application)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │ Events
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                   MCP Server                                 │
│              (dialogue-reporter)                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Event Hook System                       │   │
│  │  • conversation.start                                │   │
│  │  • message.user                                      │   │
│  │  • message.assistant                                 │   │
│  │  • tool.call                                         │   │
│  │  • conversation.end                                  │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     ↓                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Core Pipeline                             │   │
│  │                                                       │   │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐        │   │
│  │  │ Capturer │ → │ Formatter│ → │  Writer  │        │   │
│  │  └──────────┘   └──────────┘   └──────────┘        │   │
│  │                                                       │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     ↓                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Configuration Manager                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                 File System                                  │
│         ./dialogue-reports/*.md                              │
└─────────────────────────────────────────────────────────────┘
```

## Module Interfaces

### 1. Capturer Module

**Purpose:** Intercept and capture conversation data from Claude Code events

**Interface:**
```typescript
interface Capturer {
  // Initialize capturer with event subscriptions
  initialize(config: CaptureConfig): Promise<void>;

  // Subscribe to conversation events
  subscribe(callback: (data: CapturedData) => void): void;

  // Get current capture status
  getStatus(): CaptureStatus;

  // Cleanup and shutdown
  shutdown(): Promise<void>;
}

interface CaptureConfig {
  bufferSize: number;           // Max messages to buffer
  flushInterval: number;        // Auto-flush interval (ms)
  includeToolCalls: boolean;    // Capture tool executions
  includeTimestamps: boolean;   // Add timestamps
}

interface CapturedData {
  sessionId: string;
  timestamp: Date;
  messages: Message[];
  metadata: ConversationMetadata;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  tool: string;
  input: any;
  output?: any;
  error?: string;
}
```

**Performance Requirements:**
- Capture overhead: <2ms per message
- Memory usage: <5MB buffer
- Non-blocking async operations

---

### 2. Formatter Module

**Purpose:** Convert captured conversation data to markdown format

**Interface:**
```typescript
interface Formatter {
  // Format conversation data to markdown
  format(data: CapturedData, options?: FormatOptions): Promise<string>;

  // Apply custom formatter function
  setCustomFormatter(formatter: CustomFormatter): void;

  // Get formatter status
  getStatus(): FormatterStatus;
}

interface FormatOptions {
  syntaxHighlighting: boolean;  // Enable code syntax highlighting
  includeMetadata: boolean;     // Include session metadata
  includeTimestamps: boolean;   // Add timestamps to messages
  includeToolCalls: boolean;    // Show tool executions
  customTemplate?: string;      // Custom markdown template
}

type CustomFormatter = (data: CapturedData) => string;

interface FormatterStatus {
  ready: boolean;
  customFormatter: boolean;
}
```

**Performance Requirements:**
- Format overhead: <2ms per message
- Support for code blocks with syntax highlighting
- Handle special characters and escaping

---

### 3. Writer Module

**Purpose:** Write formatted markdown to file system

**Interface:**
```typescript
interface Writer {
  // Write markdown to file
  write(content: string, options?: WriteOptions): Promise<WriteResult>;

  // Get output directory status
  getStatus(): WriterStatus;

  // Verify write permissions
  verifyPermissions(): Promise<boolean>;
}

interface WriteOptions {
  filename?: string;            // Custom filename
  directory?: string;           // Output directory
  append?: boolean;             // Append vs overwrite
  atomic?: boolean;             // Atomic write operation
}

interface WriteResult {
  success: boolean;
  filepath: string;
  bytesWritten: number;
  duration: number;
  error?: string;
}

interface WriterStatus {
  directory: string;
  writable: boolean;
  diskSpace: number;
}
```

**Performance Requirements:**
- Write overhead: <1ms (async, non-blocking)
- Atomic writes to prevent corruption
- Handle concurrent writes safely

---

### 4. MCP Server

**Purpose:** Implement MCP protocol for Claude Code integration

**Interface:**
```typescript
interface MCPServer {
  // Start MCP server
  start(config: MCPConfig): Promise<void>;

  // Stop MCP server gracefully
  stop(): Promise<void>;

  // Get server status
  getStatus(): MCPStatus;

  // Handle MCP requests
  handleRequest(request: MCPRequest): Promise<MCPResponse>;
}

interface MCPConfig {
  port?: number;
  host?: string;
  configPath: string;
}

interface MCPStatus {
  running: boolean;
  uptime: number;
  requestsHandled: number;
  errors: number;
}

interface MCPRequest {
  method: string;
  params: any;
}

interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}
```

**MCP Endpoints:**
- `initialize` - Setup server connection
- `conversation/start` - Begin conversation capture
- `conversation/message` - Capture message
- `conversation/end` - Finalize and save conversation
- `config/get` - Get current configuration
- `config/set` - Update configuration
- `status/get` - Get server status
- `verify` - Run verification test

---

### 5. Configuration Manager

**Purpose:** Load, validate, and manage user configuration

**Interface:**
```typescript
interface ConfigManager {
  // Load configuration from file
  load(path?: string): Promise<Config>;

  // Save configuration to file
  save(config: Config, path?: string): Promise<void>;

  // Validate configuration
  validate(config: Config): ValidationResult;

  // Get current configuration
  get(): Config;

  // Update configuration
  update(partial: Partial<Config>): Promise<void>;
}

interface Config {
  outputDirectory: string;
  filenamePattern: string;
  formatting: FormatOptions;
  performance: PerformanceConfig;
  customFormatter?: string;
}

interface PerformanceConfig {
  maxBufferSize: number;
  flushInterval: number;
  asyncWrites: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## Data Flow

### Happy Path: Normal Conversation

```
1. User starts conversation
   ↓
2. MCP Server receives 'conversation.start' event
   ↓
3. Capturer initializes buffer for new conversation
   ↓
4. User sends message
   ↓
5. MCP Server receives 'message.user' event
   ↓
6. Capturer buffers message data (<2ms)
   ↓
7. Assistant responds
   ↓
8. MCP Server receives 'message.assistant' event
   ↓
9. Capturer buffers response (<2ms)
   ↓
10. [Steps 4-9 repeat for each message]
   ↓
11. Conversation ends
   ↓
12. MCP Server receives 'conversation.end' event
   ↓
13. Capturer flushes buffer to Formatter
   ↓
14. Formatter converts to markdown (<2ms per message)
   ↓
15. Writer saves to file (<1ms, async)
   ↓
16. File available: ./dialogue-reports/conversation-{timestamp}.md
```

**Total Overhead:** <5ms per interaction (non-blocking)

---

## Error Handling Strategy

### Graceful Degradation

```typescript
// Capturer errors: Continue capturing, log error
try {
  capturer.capture(data);
} catch (error) {
  logger.error('Capture failed', error);
  // Continue processing, don't block Claude Code
}

// Formatter errors: Use fallback plain text
try {
  markdown = formatter.format(data);
} catch (error) {
  logger.error('Format failed', error);
  markdown = data.messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
}

// Writer errors: Retry with backoff
try {
  await writer.write(markdown);
} catch (error) {
  logger.error('Write failed', error);
  await retryWithBackoff(() => writer.write(markdown), 3);
}
```

### Error Recovery

- **Capture errors:** Buffer in memory, retry on next message
- **Format errors:** Fall back to plain text format
- **Write errors:** Retry up to 3 times with exponential backoff
- **MCP errors:** Log and continue, don't crash host application

---

## Performance Optimizations

### 1. Buffering Strategy
- Buffer messages in memory (configurable size)
- Flush buffer on conversation end or interval
- Prevents excessive file system operations

### 2. Async Operations
- All I/O operations are async and non-blocking
- Use worker threads for heavy formatting if needed
- Never block Claude Code's main thread

### 3. Memory Management
- Limit buffer size to prevent memory leaks
- Clear buffers after successful flush
- Use weak references where appropriate

### 4. File System Optimization
- Atomic writes prevent corruption
- Batch multiple writes if possible
- Use append mode for incremental updates

---

## Security Considerations

### 1. Input Validation
- Sanitize all user input before processing
- Validate file paths to prevent directory traversal
- Escape special characters in markdown

### 2. File System Security
- Verify write permissions before attempting write
- Check disk space before writing
- Use secure file permissions (0644)

### 3. Configuration Security
- Validate configuration schema
- Sanitize file paths
- Prevent code injection in custom formatters

---

## Testing Strategy

### Unit Tests (90%+ coverage target)
- Test each module independently
- Mock dependencies
- Cover edge cases and error conditions

### Integration Tests
- Test full pipeline (capture → format → write)
- Test MCP server endpoints
- Simulate real conversations

### Performance Tests
- Benchmark each module
- Verify <5ms total overhead
- Test under load (concurrent conversations)

### Edge Case Tests
- Very large conversations (1000+ messages)
- Special characters and unicode
- Concurrent conversations
- Disk full scenarios
- Permission errors

---

## Deployment Architecture

### Installation Flow

```
1. User runs: npm install -g dialogue-reporter
   ↓
2. Postinstall script runs
   ↓
3. Detect Claude Flow installation
   ↓
4. Detect Claude Code project
   ↓
5. Register MCP server in .mcprc.json
   ↓
6. Create default config (.dialogue-reporter.json)
   ↓
7. Setup output directory (./dialogue-reports/)
   ↓
8. Run verification test
   ↓
9. Success! Ready to capture conversations
```

### Runtime Architecture

```
Claude Code Process
├── MCP Client (built-in)
│   └── Connects to dialogue-reporter MCP server
│
dialogue-reporter Process (Node.js)
├── MCP Server (listening)
├── Capturer (active)
├── Formatter (on-demand)
└── Writer (async)
```

---

## Module Dependencies

```
MCP Server
├── Capturer
├── Formatter
└── Writer

Capturer
├── Configuration Manager
└── Event Hook System

Formatter
├── Configuration Manager
└── Markdown Utils

Writer
├── Configuration Manager
└── File Manager

Configuration Manager
└── (no dependencies)
```

**Dependency Rules:**
- No circular dependencies
- Core modules are independent
- MCP Server coordinates all modules
- Configuration Manager is shared utility

---

## Success Metrics

### Performance Targets
- ✅ Capture overhead: <2ms per message
- ✅ Format overhead: <2ms per message
- ✅ Write overhead: <1ms per message
- ✅ Total overhead: <5ms per interaction
- ✅ Memory usage: <10MB
- ✅ Zero data loss

### Quality Targets
- ✅ Test coverage: 90%+
- ✅ All tests passing
- ✅ No security vulnerabilities
- ✅ Clean static analysis

### Usability Targets
- ✅ One-command installation
- ✅ Automatic MCP registration
- ✅ Zero manual configuration required
- ✅ Verification test passes

---

## Future Enhancements (v1.1+)

### Potential Features
- Cloud sync support
- Search and indexing
- Export to PDF/HTML
- Conversation analytics
- Team collaboration
- Integration with other tools

### Scalability Considerations
- Support for very long conversations (10,000+ messages)
- Multi-user/team deployments
- Distributed storage options
- Real-time collaboration features

---

## Appendix A: File Structure

```
dialogue-reporter/
├── src/
│   ├── core/
│   │   ├── capturer.ts         # Conversation capturer
│   │   ├── formatter.ts        # Markdown formatter
│   │   ├── writer.ts           # File writer
│   │   └── event-hooks.ts      # Event handling
│   │
│   ├── mcp/
│   │   ├── server.ts           # MCP server
│   │   ├── handlers.ts         # Request handlers
│   │   └── lifecycle.ts        # Lifecycle management
│   │
│   ├── config/
│   │   ├── loader.ts           # Config loading
│   │   ├── validator.ts        # Config validation
│   │   └── defaults.ts         # Default config
│   │
│   ├── hooks/
│   │   └── integration.ts      # Claude Code hooks
│   │
│   ├── cli/
│   │   └── index.ts            # CLI tool
│   │
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   │
│   └── index.ts                # Main entry
│
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   ├── performance/            # Performance tests
│   └── edge-cases/             # Edge case tests
│
└── docs/
    ├── api/                    # API documentation
    └── architecture.md         # This document
```

---

**Architecture Status:** ✅ Complete
**Ready for Implementation:** Yes
**Estimated Implementation Time:** 6 hours (with 2 hour buffer)

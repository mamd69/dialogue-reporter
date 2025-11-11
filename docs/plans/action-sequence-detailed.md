# Detailed Action Sequence for Dialogue Reporter Implementation

**Generated:** 2025-11-11
**Plan Reference:** goap-implementation-plan.md
**Methodology:** GOAP Action Decomposition

---

## Action Execution Details

This document provides implementation details for each action in the GOAP plan, including code snippets, file structures, and verification steps.

---

## Phase 1: Core Module Implementation

### Action 1.1: IMPLEMENT_FORMATTER

**Duration:** 60 minutes
**Priority:** Critical
**Dependencies:** capturer.ts (exists)

#### Implementation Details

**File:** `/workspaces/dialogue-reporter/src/core/formatter.ts`

**Required Interface:**
```typescript
interface Formatter {
  format(data: CapturedData, options?: FormatOptions): Promise<string>;
  setCustomFormatter(formatter: CustomFormatter): void;
  getStatus(): FormatterStatus;
}
```

**Key Features to Implement:**
1. Markdown header with metadata
2. Message formatting with role labels
3. Code block syntax highlighting
4. Tool call formatting
5. Timestamp formatting
6. Custom template support
7. Special character escaping

**Code Structure:**
```typescript
export class MarkdownFormatter implements Formatter {
  private customFormatter?: CustomFormatter;

  async format(data: CapturedData, options?: FormatOptions): Promise<string> {
    // 1. Generate header with metadata
    // 2. Format each message
    // 3. Handle tool calls
    // 4. Apply syntax highlighting
    // 5. Return complete markdown
  }

  private formatHeader(data: CapturedData): string { }
  private formatMessage(message: Message): string { }
  private formatToolCall(toolCall: ToolCall): string { }
  private escapeMarkdown(text: string): string { }
  private highlightCode(code: string, lang: string): string { }
}
```

**Verification:**
```bash
# Create test file
cat > /workspaces/dialogue-reporter/tests/unit/formatter.test.ts << 'EOF'
import { MarkdownFormatter } from '../../src/core/formatter';

describe('MarkdownFormatter', () => {
  test('formats basic conversation', async () => {
    // Test implementation
  });

  test('handles code blocks', async () => {
    // Test implementation
  });

  test('escapes special characters', async () => {
    // Test implementation
  });
});
EOF

npm test -- formatter.test.ts
```

**State Changes:**
- `formatter_module_exists: false → true`
- `markdown_generation_working: false → true`

---

### Action 1.2: IMPLEMENT_WRITER

**Duration:** 45 minutes
**Priority:** Critical
**Dependencies:** None

#### Implementation Details

**File:** `/workspaces/dialogue-reporter/src/core/writer.ts`

**Required Interface:**
```typescript
interface Writer {
  write(content: string, options?: WriteOptions): Promise<WriteResult>;
  getStatus(): Promise<WriterStatus>;
  verifyPermissions(): Promise<boolean>;
}
```

**Key Features to Implement:**
1. Atomic file writes (write to temp, then rename)
2. Directory creation with proper permissions
3. Filename pattern substitution
4. Async I/O operations
5. Error handling with retries
6. Disk space checking
7. Concurrent write safety

**Code Structure:**
```typescript
export class FileSystemWriter implements Writer {
  private outputDir: string;
  private filenamePattern: string;

  async write(content: string, options?: WriteOptions): Promise<WriteResult> {
    // 1. Generate filename from pattern
    // 2. Ensure output directory exists
    // 3. Write to temp file
    // 4. Atomic rename
    // 5. Return result
  }

  private async ensureDirectory(dir: string): Promise<void> { }
  private async atomicWrite(path: string, content: string): Promise<void> { }
  private generateFilename(pattern: string): string { }
  private async checkDiskSpace(dir: string): Promise<number> { }
}
```

**Verification:**
```bash
# Test atomic writes
npm test -- writer.test.ts

# Verify file creation
ls -la ./dialogue-reports/test-*.md

# Check permissions
stat ./dialogue-reports/test-*.md
```

**State Changes:**
- `writer_module_exists: false → true`
- `file_output_working: false → true`
- `atomic_writes_enabled: false → true`

---

### Action 1.3: IMPLEMENT_EVENT_HOOKS

**Duration:** 30 minutes
**Priority:** High
**Dependencies:** capturer.ts (exists)

#### Implementation Details

**File:** `/workspaces/dialogue-reporter/src/core/event-hooks.ts`

**Required Functionality:**
1. Hook into Claude Code conversation events
2. Event filtering and transformation
3. Error handling (don't crash host)
4. Event buffering
5. Lifecycle management

**Code Structure:**
```typescript
export class EventHookSystem {
  private capturer: Capturer;
  private eventBuffer: Event[] = [];

  initialize(capturer: Capturer): void {
    // Setup event subscriptions
  }

  onConversationStart(sessionId: string): void {
    this.capturer.startConversation(sessionId);
  }

  onUserMessage(message: UserMessage): void {
    this.capturer.captureMessage(this.transformMessage(message));
  }

  onAssistantMessage(message: AssistantMessage): void {
    this.capturer.captureMessage(this.transformMessage(message));
  }

  onToolCall(toolCall: ToolCallEvent): void {
    // Capture tool execution
  }

  onConversationEnd(): void {
    this.capturer.endConversation();
  }

  private transformMessage(raw: any): Message {
    // Transform to standard format
  }
}
```

**Verification:**
```bash
# Integration test with mock events
npm test -- event-hooks.test.ts
```

**State Changes:**
- `event_hooks_implemented: false → true`
- `claude_code_integration_ready: false → true`

---

### Action 1.4: IMPLEMENT_CONFIG_SYSTEM

**Duration:** 45 minutes
**Priority:** High
**Dependencies:** None

#### Implementation Details

**Files:**
- `/workspaces/dialogue-reporter/src/config/loader.ts`
- `/workspaces/dialogue-reporter/src/config/validator.ts`
- `/workspaces/dialogue-reporter/src/config/defaults.ts`

**Required Functionality:**

**Loader:**
```typescript
export class ConfigLoader implements ConfigManager {
  async load(path?: string): Promise<Config> {
    const configPath = path || this.findConfigFile();
    if (!await this.fileExists(configPath)) {
      return this.loadDefaults();
    }
    const raw = await this.readFile(configPath);
    const parsed = JSON.parse(raw);
    return this.validate(parsed) ? parsed : this.loadDefaults();
  }

  async save(config: Config, path?: string): Promise<void> {
    const configPath = path || '.dialogue-reporter.json';
    const validated = this.validate(config);
    if (!validated.valid) {
      throw new Error(`Invalid config: ${validated.errors.join(', ')}`);
    }
    await this.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  private findConfigFile(): string {
    // Search for config in current dir, home dir, etc.
  }
}
```

**Validator:**
```typescript
export class ConfigValidator {
  validate(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!config.outputDirectory) {
      errors.push('outputDirectory is required');
    }

    // Validate types
    if (typeof config.outputDirectory !== 'string') {
      errors.push('outputDirectory must be a string');
    }

    // Validate paths
    if (config.outputDirectory && !this.isValidPath(config.outputDirectory)) {
      errors.push('outputDirectory is not a valid path');
    }

    // Validate performance settings
    if (config.performance?.maxBufferSize < 10) {
      warnings.push('maxBufferSize is very low, may impact performance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private isValidPath(path: string): boolean { }
}
```

**Defaults:**
```typescript
export const DEFAULT_CONFIG: Config = {
  outputDirectory: './dialogue-reports',
  filenamePattern: 'conversation-{timestamp}.md',
  formatting: {
    includeMetadata: true,
    syntaxHighlighting: true,
    includeToolCalls: true,
    includeTimestamps: true,
  },
  performance: {
    maxBufferSize: 100,
    flushInterval: 5000,
    asyncWrites: true,
  },
};
```

**Verification:**
```bash
# Test config loading
npm test -- config/*.test.ts

# Test config validation
echo '{"invalid": "config"}' > .test-config.json
node -e "require('./dist/config/loader').ConfigLoader.load('.test-config.json')"
```

**State Changes:**
- `config_loader_implemented: false → true`
- `config_validator_implemented: false → true`
- `configuration_system_working: false → true`

---

## Phase 2: Integration Layer

### Action 2.1: COMPLETE_MCP_SERVER

**Duration:** 60 minutes
**Priority:** Critical
**Dependencies:** Actions 1.1, 1.2, 1.3, 1.4

#### Implementation Details

**File:** `/workspaces/dialogue-reporter/src/mcp/server.ts` (enhance existing)

**Required Enhancements:**
1. Complete all MCP endpoint handlers
2. Integrate formatter, writer, event hooks
3. Add configuration management
4. Implement lifecycle management
5. Add error handling
6. Add logging

**Complete Handler Implementation:**

```typescript
export class DialogueReporterMCPServer implements MCPServer {
  private capturer: Capturer;
  private formatter: Formatter;
  private writer: Writer;
  private config: Config;
  private eventHooks: EventHookSystem;

  async start(config: MCPConfig): Promise<void> {
    // Load configuration
    this.config = await configLoader.load(config.configPath);

    // Initialize capturer with config
    await this.capturer.initialize({
      bufferSize: this.config.performance.maxBufferSize,
      flushInterval: this.config.performance.flushInterval,
      includeToolCalls: this.config.formatting.includeToolCalls,
      includeTimestamps: this.config.formatting.includeTimestamps,
    });

    // Setup event hooks
    this.eventHooks.initialize(this.capturer);

    // Subscribe to captured data
    this.capturer.subscribe(async (data) => {
      try {
        const markdown = await this.formatter.format(data, this.config.formatting);
        const result = await this.writer.write(markdown, {
          directory: this.config.outputDirectory,
          filename: this.generateFilename(data),
        });

        if (!result.success) {
          console.error('Write failed:', result.error);
        } else {
          console.log(`Saved conversation: ${result.filepath}`);
        }
      } catch (error) {
        console.error('Pipeline error:', error);
      }
    });

    this.running = true;
    console.log('MCP Server started successfully');
  }

  // Implement all endpoint handlers
  private async handleInitialize(params: any): Promise<MCPResponse> { }
  private handleConversationStart(params: any): MCPResponse { }
  private handleConversationMessage(params: any): MCPResponse { }
  private handleConversationEnd(params: any): MCPResponse { }
  private handleConfigGet(): MCPResponse { }
  private async handleConfigSet(params: any): Promise<MCPResponse> { }
  private handleStatusGet(): MCPResponse { }
  private async handleVerify(): Promise<MCPResponse> { }

  private generateFilename(data: CapturedData): string {
    // Apply filename pattern from config
  }
}
```

**Integration Testing:**
```bash
# Start MCP server
npm run start:mcp

# Test endpoints
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "initialize", "params": {}}'

# Verify conversation capture
npm test -- integration/mcp-server.test.ts
```

**State Changes:**
- `mcp_protocol_complete: false → true`
- `claude_code_hooks_integrated: false → true`
- `server_lifecycle_working: false → true`

---

### Action 2.2: CREATE_VERIFICATION_SYSTEM

**Duration:** 30 minutes
**Priority:** High
**Dependencies:** Action 2.1

#### Implementation Details

**File:** `/workspaces/dialogue-reporter/src/cli/verify.ts`

**Required Functionality:**
1. Check MCP server status
2. Verify configuration
3. Test output directory
4. Run test conversation
5. Verify markdown output
6. Check performance
7. Generate report

**Implementation:**
```typescript
export class VerificationSystem {
  async verify(verbose: boolean = false): Promise<VerificationReport> {
    const checks: CheckResult[] = [];

    // Check 1: MCP Server
    checks.push(await this.checkMCPServer());

    // Check 2: Configuration
    checks.push(await this.checkConfiguration());

    // Check 3: Output Directory
    checks.push(await this.checkOutputDirectory());

    // Check 4: Test Capture
    checks.push(await this.testConversationCapture());

    // Check 5: Performance
    checks.push(await this.checkPerformance());

    // Generate report
    return this.generateReport(checks, verbose);
  }

  private async checkMCPServer(): Promise<CheckResult> {
    try {
      const status = await mcpServer.getStatus();
      return {
        name: 'MCP Server',
        passed: status.running,
        message: status.running ? 'Server is running' : 'Server not running',
      };
    } catch (error) {
      return {
        name: 'MCP Server',
        passed: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  private async testConversationCapture(): Promise<CheckResult> {
    // Simulate conversation and verify output
  }

  private async checkPerformance(): Promise<CheckResult> {
    // Run performance benchmarks
  }

  private generateReport(checks: CheckResult[], verbose: boolean): VerificationReport {
    const passed = checks.filter(c => c.passed).length;
    const failed = checks.length - passed;

    return {
      summary: {
        total: checks.length,
        passed,
        failed,
        success: failed === 0,
      },
      checks,
      timestamp: new Date(),
    };
  }
}
```

**CLI Integration:**
```typescript
// In CLI tool
program
  .command('verify')
  .description('Verify installation and configuration')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    const verifier = new VerificationSystem();
    const report = await verifier.verify(options.verbose);

    console.log('\n=== Verification Report ===\n');
    report.checks.forEach(check => {
      const icon = check.passed ? '✓' : '✗';
      console.log(`${icon} ${check.name}: ${check.message}`);
    });

    console.log(`\n${report.summary.passed}/${report.summary.total} checks passed`);

    if (!report.summary.success) {
      process.exit(1);
    }
  });
```

**State Changes:**
- `verification_system: false → true`
- `deployment_verified: false → true`

---

## Phase 3: CLI & Installation

### Action 3.1: BUILD_CLI_TOOL

**Duration:** 90 minutes
**Priority:** Critical
**Dependencies:** Actions 1.4, 2.1

#### Implementation Details

**File:** `/workspaces/dialogue-reporter/src/cli/index.ts`

**Required Commands:**
1. `install` - Automated installation
2. `uninstall` - Remove installation
3. `configure` - Interactive configuration
4. `config show` - Display configuration
5. `config reset` - Reset to defaults
6. `verify` - Run verification
7. `test` - Test conversation capture
8. `status` - Show system status
9. `logs` - View logs

**Full CLI Implementation:**
```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { InstallCommand } from './commands/install';
import { ConfigureCommand } from './commands/configure';
import { VerifyCommand } from './commands/verify';
import { StatusCommand } from './commands/status';

const program = new Command();

program
  .name('dialogue-reporter')
  .description('Automatic Claude Code conversation logging')
  .version('1.0.0');

// Install command
program
  .command('install')
  .description('Install and setup dialogue reporter')
  .option('--manual', 'Show manual installation steps')
  .option('--force', 'Force reinstallation')
  .action(async (options) => {
    const installer = new InstallCommand();
    await installer.execute(options);
  });

// Uninstall command
program
  .command('uninstall')
  .description('Remove dialogue reporter installation')
  .action(async () => {
    const installer = new InstallCommand();
    await installer.uninstall();
  });

// Configure command
program
  .command('configure')
  .description('Interactive configuration')
  .action(async () => {
    const configurator = new ConfigureCommand();
    await configurator.execute();
  });

// Config subcommands
const configCommand = program
  .command('config')
  .description('Configuration management');

configCommand
  .command('show')
  .description('Display current configuration')
  .action(async () => {
    const configurator = new ConfigureCommand();
    await configurator.show();
  });

configCommand
  .command('reset')
  .description('Reset to default configuration')
  .action(async () => {
    const configurator = new ConfigureCommand();
    await configurator.reset();
  });

// Verify command
program
  .command('verify')
  .description('Verify installation')
  .option('-v, --verbose', 'Detailed output')
  .action(async (options) => {
    const verifier = new VerifyCommand();
    await verifier.execute(options);
  });

// Status command
program
  .command('status')
  .description('Show system status')
  .action(async () => {
    const status = new StatusCommand();
    await status.execute();
  });

// Test command
program
  .command('test')
  .description('Run test conversation')
  .action(async () => {
    // Run test conversation capture
  });

// Logs command
program
  .command('logs')
  .description('View system logs')
  .option('-n, --lines <number>', 'Number of lines', '50')
  .action(async (options) => {
    // Display logs
  });

program.parse();
```

**Command Implementations:**

See separate files:
- `/src/cli/commands/install.ts`
- `/src/cli/commands/configure.ts`
- `/src/cli/commands/verify.ts`
- `/src/cli/commands/status.ts`

**Verification:**
```bash
# Build CLI
npm run build

# Test globally
npm link
dialogue-reporter --help
dialogue-reporter install --help
dialogue-reporter verify
```

**State Changes:**
- `cli_tool_exists: false → true`
- `user_commands_working: false → true`

---

### Action 3.2: CREATE_POSTINSTALL_SCRIPT

**Duration:** 45 minutes
**Priority:** High
**Dependencies:** Action 3.1

#### Implementation Details

**File:** `/workspaces/dialogue-reporter/src/postinstall.ts`

**Required Functionality:**
1. Detect installation environment
2. Find Claude Flow installation
3. Register MCP server
4. Create default configuration
5. Setup output directory
6. Run verification
7. Display success message

**Implementation:**
```typescript
#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class PostInstallScript {
  async run(): Promise<void> {
    console.log('Setting up Dialogue Reporter...\n');

    try {
      // 1. Detect environment
      const env = await this.detectEnvironment();
      console.log(`✓ Environment detected: ${env.type}`);

      // 2. Find Claude Flow
      const claudeFlow = await this.findClaudeFlow();
      if (!claudeFlow) {
        console.log('⚠ Claude Flow not found. Install with:');
        console.log('  claude mcp add claude-flow npx claude-flow@alpha mcp start');
        return;
      }
      console.log('✓ Claude Flow found');

      // 3. Register MCP server
      await this.registerMCPServer(env);
      console.log('✓ MCP server registered');

      // 4. Create default config
      await this.createDefaultConfig(env.projectRoot);
      console.log('✓ Configuration created');

      // 5. Setup output directory
      await this.setupOutputDirectory(env.projectRoot);
      console.log('✓ Output directory created');

      // 6. Run verification
      const verified = await this.verify();
      if (verified) {
        console.log('✓ Installation verified\n');
        console.log('🎉 Dialogue Reporter is ready!');
        console.log('\nStart a Claude Code conversation and check:');
        console.log('  ./dialogue-reports/conversation-*.md\n');
      } else {
        console.log('\n⚠ Verification failed. Run:');
        console.log('  dialogue-reporter verify\n');
      }

    } catch (error) {
      console.error('\n❌ Installation failed:', error.message);
      console.log('\nFor manual installation, run:');
      console.log('  dialogue-reporter install --manual\n');
    }
  }

  private async detectEnvironment(): Promise<Environment> {
    const cwd = process.cwd();
    const hasPackageJson = await this.fileExists(path.join(cwd, 'package.json'));
    const hasGit = await this.fileExists(path.join(cwd, '.git'));

    return {
      type: hasPackageJson ? 'project' : 'global',
      projectRoot: cwd,
      hasPackageJson,
      hasGit,
    };
  }

  private async findClaudeFlow(): Promise<boolean> {
    try {
      await execAsync('which claude');
      return true;
    } catch {
      return false;
    }
  }

  private async registerMCPServer(env: Environment): Promise<void> {
    const mcprcPath = path.join(env.projectRoot, '.mcprc.json');
    let mcprc: any = {};

    if (await this.fileExists(mcprcPath)) {
      const content = await fs.readFile(mcprcPath, 'utf-8');
      mcprc = JSON.parse(content);
    }

    if (!mcprc.servers) {
      mcprc.servers = {};
    }

    mcprc.servers['dialogue-reporter'] = {
      command: 'npx',
      args: ['dialogue-reporter', 'mcp', 'start'],
      env: {},
    };

    await fs.writeFile(mcprcPath, JSON.stringify(mcprc, null, 2));
  }

  private async createDefaultConfig(projectRoot: string): Promise<void> {
    const configPath = path.join(projectRoot, '.dialogue-reporter.json');

    if (await this.fileExists(configPath)) {
      console.log('  Configuration already exists, skipping');
      return;
    }

    const defaultConfig = {
      outputDirectory: './dialogue-reports',
      filenamePattern: 'conversation-{timestamp}.md',
      formatting: {
        includeMetadata: true,
        syntaxHighlighting: true,
        includeToolCalls: true,
        includeTimestamps: true,
      },
      performance: {
        maxBufferSize: 100,
        flushInterval: 5000,
      },
    };

    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
  }

  private async setupOutputDirectory(projectRoot: string): Promise<void> {
    const outputDir = path.join(projectRoot, 'dialogue-reports');
    await fs.mkdir(outputDir, { recursive: true, mode: 0o755 });
  }

  private async verify(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('dialogue-reporter verify');
      return stdout.includes('passed');
    } catch {
      return false;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const script = new PostInstallScript();
  script.run().catch(error => {
    console.error('Postinstall error:', error);
    process.exit(0); // Don't fail npm install
  });
}

export { PostInstallScript };
```

**package.json Update:**
```json
{
  "scripts": {
    "postinstall": "node dist/postinstall.js || true"
  }
}
```

**Verification:**
```bash
# Test postinstall
npm run build
npm run postinstall

# Check outputs
ls -la .mcprc.json
ls -la .dialogue-reporter.json
ls -la dialogue-reports/
```

**State Changes:**
- `postinstall_script_exists: false → true`
- `installation_automation: false → true`

---

## Summary of Implementation Actions

This detailed action sequence provides:

1. **Complete specifications** for each module
2. **Code structure** and interfaces
3. **Implementation guidance** with examples
4. **Verification steps** for each action
5. **State change tracking** for GOAP planning

### Next Steps

1. Execute Phase 1 actions in parallel
2. Verify each phase before proceeding
3. Use OODA loop for monitoring
4. Adjust plan if issues arise
5. Complete all phases sequentially

**Total Implementation Time:** 8.25 hours
**With Buffer:** 10 hours

---

**Document Status:** ✅ Complete
**Ready for Execution:** Yes

# Dialogue Reporter

Automatically log all your Claude Code conversations to beautiful markdown files with zero configuration.

## What It Does

Dialogue Reporter captures every conversation you have with Claude Code and saves it as a well-formatted markdown file. Perfect for documentation, sharing, learning, or archiving your AI-assisted development sessions.

**Features:**
- Automatic conversation capture with <5ms overhead
- Beautiful markdown formatting with syntax highlighting
- One-command installation
- Zero configuration required (smart defaults)
- Customizable output format and location
- Works with all Claude Code features (tools, edits, bash commands)
- MCP protocol integration
- Cross-session persistence

## Quick Install (Fresh Claude Flow Project)

### Step 1: Install Claude Flow (if not already installed)
```bash
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

### Step 2: Install Dialogue Reporter
```bash
npm install -g dialogue-reporter
```

### Step 3: Setup (Automatic)
```bash
dialogue-reporter install
```

That's it! The installation script will:
- Detect your Claude Code project
- Register the MCP server automatically
- Create a default configuration
- Setup the output directory (`./dialogue-reports/`)
- Run a verification test

### Step 4: Verify
```bash
dialogue-reporter verify
```

You should see:
```
✓ MCP server responding
✓ Configuration valid
✓ Output directory writable
✓ Test conversation captured
✓ Markdown file created
✓ Performance: 3.2ms overhead
✅ All checks passed
```

## Installation in Existing Projects

Already have a Claude Code project? Just run:

```bash
cd your-project
npm install -g dialogue-reporter
dialogue-reporter install
```

The installer will integrate seamlessly with your existing setup.

## How It Works

Once installed, Dialogue Reporter automatically:

1. **Captures** - Hooks into Claude Code conversation events
2. **Formats** - Converts to markdown with proper code blocks and syntax
3. **Saves** - Writes to timestamped files in `./dialogue-reports/`

All of this happens automatically in the background with minimal performance impact (<5ms per interaction).

## Output Format

Conversations are saved as:
```
./dialogue-reports/conversation-2025-11-07-14-30-45.md
```

Example markdown output:
```markdown
# Conversation - November 7, 2025 at 2:30 PM

**Model:** claude-sonnet-4-5-20250929
**Session ID:** abc123xyz

---

## User
Can you help me implement a binary search algorithm?

## Assistant
I'll help you implement an efficient binary search algorithm...

```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1
```

This implementation...
```

## Configuration Options

While Dialogue Reporter works out-of-the-box, you can customize it:

### View Current Configuration
```bash
dialogue-reporter config show
```

### Edit Configuration
```bash
dialogue-reporter configure
```

### Configuration File (`.dialogue-reporter.json`)
```json
{
  "outputDirectory": "./dialogue-reports",
  "filenamePattern": "conversation-{timestamp}.md",
  "formatting": {
    "includeMetadata": true,
    "syntaxHighlighting": true,
    "includeToolCalls": true,
    "includeTimestamps": true
  },
  "performance": {
    "maxBufferSize": 100,
    "flushInterval": 5000
  }
}
```

### Advanced Configuration

**Custom Output Directory:**
```json
{
  "outputDirectory": "./docs/conversations"
}
```

**Custom Filename Pattern:**
```json
{
  "filenamePattern": "session-{date}-{session-id}.md"
}
```

**Minimal Format (faster):**
```json
{
  "formatting": {
    "includeMetadata": false,
    "includeTimestamps": false
  }
}
```

## CLI Commands

### Installation & Setup
```bash
dialogue-reporter install          # Automated installation
dialogue-reporter install --manual # Show manual installation steps
dialogue-reporter uninstall        # Remove installation
```

### Configuration
```bash
dialogue-reporter configure        # Interactive configuration
dialogue-reporter config show      # Display current config
dialogue-reporter config reset     # Reset to defaults
```

### Verification & Testing
```bash
dialogue-reporter verify           # Test installation
dialogue-reporter test             # Run test conversation
dialogue-reporter status           # Show current status
```

### Management
```bash
dialogue-reporter logs             # View logs
dialogue-reporter --help           # Show help
```

## Verification

After installation, start any Claude Code conversation and check your output directory:

```bash
ls -la ./dialogue-reports/
cat ./dialogue-reports/conversation-*.md
```

You should see a new markdown file for your conversation.

## Examples

### Example 1: Basic Conversation

**Input:** Simple back-and-forth with Claude Code

**Output:** `./dialogue-reports/conversation-2025-11-07-14-30-45.md`
```markdown
# Conversation - November 7, 2025 at 2:30 PM

## User
What is the time complexity of quicksort?

## Assistant
Quicksort has an average-case time complexity of O(n log n)...
```

### Example 2: Code Generation Session

**Input:** Claude generates multiple files

**Output:** Includes all tool calls and file edits
```markdown
## Assistant
I'll create the API endpoint for you...

**Tool: Write**
File: `/src/api/users.ts`

```typescript
export async function getUsers(req: Request, res: Response) {
  // Implementation...
}
```

## User
Great! Can you add authentication?

## Assistant
I'll add JWT authentication...
```

### Example 3: Custom Formatter

Create `./examples/custom-formatter.js`:
```javascript
module.exports = function customFormatter(conversation) {
  return `
# Session ${conversation.sessionId}
Date: ${conversation.timestamp}

${conversation.messages.map(msg => `
**${msg.role}**: ${msg.content}
`).join('\n')}
  `.trim();
};
```

Use in config:
```json
{
  "formatting": {
    "customFormatter": "./examples/custom-formatter.js"
  }
}
```

## Troubleshooting

### Installation Issues

**Problem:** `dialogue-reporter: command not found`

**Solution:**
```bash
# Ensure global install
npm install -g dialogue-reporter

# Check npm global path
npm config get prefix

# Add to PATH if needed (Linux/Mac)
export PATH="$PATH:$(npm config get prefix)/bin"
```

---

**Problem:** MCP server not registered

**Solution:**
```bash
# Check .mcprc.json
cat .mcprc.json

# Re-register manually
dialogue-reporter install --force

# Restart Claude Code
```

---

**Problem:** Permission denied on output directory

**Solution:**
```bash
# Check directory permissions
ls -la ./dialogue-reports/

# Fix permissions
chmod 755 ./dialogue-reports/

# Or use a different directory
dialogue-reporter configure
# Set outputDirectory to a writable location
```

---

### Runtime Issues

**Problem:** Conversations not being captured

**Solution:**
```bash
# Check status
dialogue-reporter status

# Check logs
dialogue-reporter logs

# Verify MCP server is running
ps aux | grep dialogue-reporter

# Restart MCP server (restart Claude Code)
```

---

**Problem:** Performance issues / high overhead

**Solution:**
```json
// In .dialogue-reporter.json, reduce buffer size
{
  "performance": {
    "maxBufferSize": 50,
    "flushInterval": 10000
  }
}
```

---

**Problem:** Markdown formatting issues

**Solution:**
```bash
# Reset to default configuration
dialogue-reporter config reset

# Or disable custom formatter
# Edit .dialogue-reporter.json and remove customFormatter
```

---

### Verification Failures

**Problem:** `dialogue-reporter verify` fails

**Solution:**
```bash
# Run with verbose output
dialogue-reporter verify --verbose

# Check each component
dialogue-reporter status          # MCP server status
ls -la ./dialogue-reports/        # Output directory
cat .dialogue-reporter.json       # Configuration

# Re-install if needed
dialogue-reporter uninstall
dialogue-reporter install
```

---

### Common Questions

**Q: Where are my conversation files?**

A: By default, in `./dialogue-reports/` relative to your project root. Check with:
```bash
dialogue-reporter config show
```

**Q: How do I stop capturing conversations?**

A: Either uninstall or disable the MCP server:
```bash
dialogue-reporter uninstall
# Or temporarily stop Claude Code
```

**Q: Can I exclude certain conversations?**

A: Not currently, but you can manually delete unwanted markdown files. Future versions will support filtering.

**Q: What's the performance impact?**

A: <5ms per interaction. For a typical conversation with 20 messages, total overhead is ~100ms, which is imperceptible.

**Q: Does it work offline?**

A: Yes! All processing happens locally. No data is sent to external servers.

**Q: Can I use it with other IDEs?**

A: Currently only supports Claude Code (VS Code extension). Support for other IDEs is planned.

## Performance

Dialogue Reporter is designed for minimal overhead:

- **Conversation capture:** <2ms per message
- **Markdown formatting:** <2ms per message
- **File writing:** <1ms (async, non-blocking)
- **Total overhead:** <5ms per interaction
- **Memory usage:** <10MB

Even with hundreds of messages, you won't notice any slowdown.

## Requirements

- Node.js 18.0.0 or higher
- Claude Flow installed and configured
- Claude Code (VS Code extension)

## Support

- **Issues:** [GitHub Issues](https://github.com/your-org/dialogue-reporter/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/dialogue-reporter/discussions)
- **Documentation:** [Full Docs](https://github.com/your-org/dialogue-reporter/tree/main/docs)

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Changelog

### v1.0.0 (2025-11-07)
- Initial release
- Automatic conversation capture
- Markdown formatting
- One-command installation
- MCP protocol integration
- <5ms performance overhead
- CLI tool for management

---

**Made with Claude Code** 🚀

Start capturing your conversations today:
```bash
npm install -g dialogue-reporter
dialogue-reporter install
```

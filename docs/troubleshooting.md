# Troubleshooting Guide

Complete guide for resolving common Dialogue Reporter issues.

---

## Installation Issues

### Problem: `dialogue-reporter: command not found`

**Cause:** Package not installed globally or PATH not configured

**Solutions:**

```bash
# Solution 1: Install globally
npm install -g dialogue-reporter

# Solution 2: Check npm global prefix
npm config get prefix

# Solution 3: Add to PATH (Linux/macOS)
export PATH="$PATH:$(npm config get prefix)/bin"

# Add to ~/.bashrc or ~/.zshrc for persistence
echo 'export PATH="$PATH:$(npm config get prefix)/bin"' >> ~/.bashrc

# Solution 4: Use npx
npx dialogue-reporter install
```

---

### Problem: MCP Server Not Registered

**Cause:** Registration failed or .mcprc.json not updated

**Solutions:**

```bash
# Check if registered
cat .mcprc.json | grep dialogue-reporter

# Force re-registration
dialogue-reporter install --force

# Manual registration
# Edit .mcprc.json and add:
{
  "servers": {
    "dialogue-reporter": {
      "command": "node",
      "args": ["./node_modules/dialogue-reporter/dist/mcp/server.js"],
      "env": {
        "DIALOGUE_REPORTER_CONFIG": "./.dialogue-reporter.json"
      }
    }
  }
}

# Restart Claude Code
```

---

### Problem: Permission Denied on Output Directory

**Cause:** No write permissions for output directory

**Solutions:**

```bash
# Check permissions
ls -la ./dialogue-reports/

# Fix permissions
chmod 755 ./dialogue-reports/

# Use different directory
# Edit .dialogue-reporter.json:
{
  "outputDirectory": "/path/to/writable/directory"
}

# Create with proper permissions
mkdir -p ./dialogue-reports
chmod 755 ./dialogue-reports
```

---

## Runtime Issues

### Problem: Conversations Not Being Captured

**Diagnostic Steps:**

```bash
# 1. Check status
dialogue-reporter status

# 2. Check MCP server logs
# (Location varies by system)
cat ~/.claude-code/logs/dialogue-reporter.log

# 3. Verify configuration
dialogue-reporter config show

# 4. Check output directory
ls -la ./dialogue-reports/
```

**Solutions:**

```bash
# Solution 1: Restart MCP server
# Restart Claude Code

# Solution 2: Verify installation
dialogue-reporter verify

# Solution 3: Check for errors in logs
dialogue-reporter logs

# Solution 4: Reinstall
dialogue-reporter uninstall
dialogue-reporter install
```

---

### Problem: Performance Issues / High Overhead

**Symptoms:**
- Claude Code feels slow
- High CPU usage
- Memory issues

**Solutions:**

```json
// Edit .dialogue-reporter.json
{
  "performance": {
    // Reduce buffer size
    "maxBufferSize": 50,  // Default: 100

    // Increase flush interval
    "flushInterval": 10000,  // Default: 5000 (ms)

    // Keep async writes enabled
    "asyncWrites": true
  },

  "formatting": {
    // Disable syntax highlighting for speed
    "syntaxHighlighting": false,

    // Disable timestamps
    "includeTimestamps": false
  }
}
```

**Minimal configuration for best performance:**

```json
{
  "outputDirectory": "./dialogue-reports",
  "filenamePattern": "conversation-{timestamp}.md",
  "formatting": {
    "syntaxHighlighting": false,
    "includeMetadata": false,
    "includeTimestamps": false,
    "includeToolCalls": false
  },
  "performance": {
    "maxBufferSize": 50,
    "flushInterval": 10000,
    "asyncWrites": true
  }
}
```

---

### Problem: Markdown Formatting Issues

**Symptoms:**
- Code blocks not formatted
- Special characters broken
- Syntax highlighting incorrect

**Solutions:**

```bash
# Solution 1: Reset configuration
dialogue-reporter config reset

# Solution 2: Disable custom formatter
# Edit .dialogue-reporter.json and remove customFormatter field

# Solution 3: Check custom formatter
# If using custom formatter, ensure it returns valid markdown
node /path/to/custom-formatter.js

# Solution 4: Test formatting
# Create a test conversation and check output
```

---

### Problem: Disk Space Issues

**Symptoms:**
- Write failures
- Truncated files
- Error messages about disk space

**Solutions:**

```bash
# Check disk space
df -h

# Clean old conversation files
find ./dialogue-reports/ -name "*.md" -mtime +30 -delete

# Archive old conversations
tar -czf conversations-archive-$(date +%Y%m%d).tar.gz ./dialogue-reports/
mv conversations-archive-*.tar.gz ~/archives/

# Use compressed storage (future feature)
```

---

## Verification Failures

### Problem: `dialogue-reporter verify` Fails

**Check each component:**

```bash
# Check MCP registration
cat .mcprc.json | grep dialogue-reporter
# Should show: "dialogue-reporter": { ... }

# Check configuration
cat .dialogue-reporter.json
# Should be valid JSON with required fields

# Check output directory
ls -la ./dialogue-reports/
# Should exist and be writable

# Test write
touch ./dialogue-reports/.test && rm ./dialogue-reports/.test
# Should succeed without errors
```

**Common Failures:**

1. **MCP server not registered**
   - Run: `dialogue-reporter install --force`

2. **Invalid configuration**
   - Run: `dialogue-reporter config reset`

3. **Output directory not writable**
   - Run: `chmod 755 ./dialogue-reports/`

4. **Missing dependencies**
   - Run: `npm install -g dialogue-reporter@latest`

---

## Advanced Troubleshooting

### Debug Mode

Enable detailed logging:

```bash
# Set environment variable
export DIALOGUE_REPORTER_DEBUG=1

# Restart Claude Code

# Check debug logs
tail -f ~/.claude-code/logs/dialogue-reporter-debug.log
```

---

### Manual Testing

Test each component individually:

```bash
# Test capturer
node -e "
const { capturer } = require('./node_modules/dialogue-reporter/dist/core/capturer');
capturer.initialize({ bufferSize: 10, flushInterval: 1000, includeToolCalls: true, includeTimestamps: true });
console.log('Capturer initialized:', capturer.getStatus());
"

# Test formatter
node -e "
const { formatter } = require('./node_modules/dialogue-reporter/dist/core/formatter');
const data = { sessionId: 'test', timestamp: new Date(), messages: [], metadata: {} };
formatter.format(data).then(md => console.log('Formatted:', md.length, 'bytes'));
"

# Test writer
node -e "
const { writer } = require('./node_modules/dialogue-reporter/dist/core/writer');
writer.write('Test content', { filename: 'test.md', directory: '/tmp' })
  .then(result => console.log('Write result:', result));
"
```

---

## Getting Help

If you're still experiencing issues:

1. **Check GitHub Issues**: https://github.com/dialogue-reporter/dialogue-reporter/issues
2. **Search Discussions**: https://github.com/dialogue-reporter/dialogue-reporter/discussions
3. **Create New Issue**: Include:
   - Operating system and version
   - Node.js version (`node --version`)
   - Claude Flow version (`npx claude-flow@alpha --version`)
   - Error messages
   - Output of `dialogue-reporter verify --verbose`
   - Relevant logs

---

## Common Questions

**Q: Where are my conversation files?**
A: Check `dialogue-reporter config show` for the outputDirectory path.

**Q: How do I stop capturing conversations?**
A: Run `dialogue-reporter uninstall` or stop Claude Code.

**Q: Can I exclude certain conversations?**
A: Not currently. Future versions will support filtering. For now, manually delete unwanted files.

**Q: What's the performance impact?**
A: <5ms per interaction. For a 20-message conversation, total overhead is ~100ms, which is imperceptible.

**Q: Does it work offline?**
A: Yes! All processing happens locally. No data is sent anywhere.

**Q: Can I customize the markdown format?**
A: Yes! Create a custom formatter (see examples/custom-formatter.js).

---

**Last Updated:** 2025-11-07

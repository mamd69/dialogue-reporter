# Dialogue Reporter - Hook System Documentation

Automatically captures Claude Code conversations to markdown files using Claude's hook system.

## 🚀 Quick Start

```bash
# Install and register hooks
bash .claude/hooks/install-dialogue-reporter.sh

# Verify installation
bash .claude/hooks/verify-dialogue-reporter.sh

# Restart Claude Code
# (exit and restart to activate hooks)
```

## 📋 How It Works

Dialogue-reporter uses three Claude Code hooks to capture conversations:

### 1. SessionStart Hook (`SessionStart.sh`)

**Triggers:** When a new Claude Code session starts

**Actions:**
- Creates a new markdown file with timestamp
- Initializes session-specific temp directory
- Stores metadata for other hooks

**Output:** `docs/claude-conversations/claude-convo-YYYY-MM-DD-N.md`

### 2. UserPromptSubmit Hook (`UserPromptSubmit.sh`)

**Triggers:** When you submit a message to Claude

**Actions:**
- Captures your message text
- Appends to conversation file with "## Human" header
- Handles session recovery if needed

### 3. Stop Hook (`Stop.sh`)

**Triggers:** When Claude completes a response

**Actions:**
- Reads JSONL transcript file
- Extracts assistant responses and tool usage
- Formats as markdown
- Tracks progress to prevent duplicates
- Writes metadata for recovery

## ⚙️ Configuration

Edit `.dialogue-reporter.config` in your project root:

```bash
# Timezone for conversation timestamps
TIMEZONE="America/New_York"

# Output directory for conversation files
OUTPUT_DIR="docs/claude-conversations"

# File naming pattern
FILENAME_PATTERN="claude-convo-{date}-{number}.md"

# Tool display mode: detailed, simple, or hidden
TOOL_DISPLAY="detailed"
```

### Tool Display Modes

**Detailed** (default):
```markdown
---
**Tools Used:**

• **Bash** `npm test`
  _Run test suite_
• **Read** `src/index.ts`
• **Write** `dist/output.js`

---
```

**Simple**:
```markdown
---
**Tools Used:**
---
```

**Hidden**: No tools section shown

## 🔧 Installation & Maintenance

### Initial Installation

```bash
# From your project root
bash .claude/hooks/install-dialogue-reporter.sh
```

This script:
1. ✅ Backs up `.claude/settings.json`
2. ✅ Registers all three hooks
3. ✅ Makes hook scripts executable
4. ✅ Validates dependencies (jq)

### Verification

```bash
bash .claude/hooks/verify-dialogue-reporter.sh
```

Checks:
- Hook scripts exist and are executable
- Hooks are registered in `settings.json`
- Dependencies installed (jq)
- Configuration file exists
- Output directory accessible

### Recovery

If `/tmp` files are cleared (system reboot, cleanup):

```bash
bash .claude/hooks/recover-dialogue-reporter.sh
```

This script:
- Scans conversation files for session IDs
- Rebuilds temp state from metadata
- Restores LAST_LINE markers
- **Runs automatically** when hooks detect missing state

## 🐛 Troubleshooting

### Hooks Not Running

**Symptoms:** No conversation files created, no captures

**Diagnosis:**
```bash
bash .claude/hooks/verify-dialogue-reporter.sh
```

**Fix:**
```bash
# Reinstall and re-register hooks
bash .claude/hooks/install-dialogue-reporter.sh

# Restart Claude Code
# (changes only apply to new sessions)
```

### Duplicate Content

**Symptoms:** Same messages appear multiple times

**Cause:** LAST_LINE tracking broken or /tmp cleared mid-session

**Fix:**
```bash
# Recover state
bash .claude/hooks/recover-dialogue-reporter.sh

# Or manually check metadata
tail -5 docs/claude-conversations/claude-convo-*.md
# Should show: <!-- LAST_LINE: 123 -->
```

### Missing Messages

**Symptoms:** Some Human or Assistant messages missing

**Diagnosis:**
```bash
# Check hook logs
tail -f /tmp/dialogue-reporter-debug.log
tail -f /tmp/dialogue-reporter-userprompt-debug.log
```

**Common causes:**
- Hook not registered → run `install-dialogue-reporter.sh`
- Hook not executable → run `chmod +x .claude/hooks/*.sh`
- Session mismatch → check SESSION_ID in logs

### Permission Errors

```bash
# Make all hooks executable
chmod +x .claude/hooks/SessionStart.sh
chmod +x .claude/hooks/Stop.sh
chmod +x .claude/hooks/UserPromptSubmit.sh
chmod +x .claude/hooks/install-dialogue-reporter.sh
chmod +x .claude/hooks/verify-dialogue-reporter.sh
chmod +x .claude/hooks/recover-dialogue-reporter.sh
```

## 🔗 Integration with Other Hooks

Dialogue-reporter is designed to coexist with other Claude Code hooks.

### Hook Execution Order

Hooks are executed in the order they appear in `.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [
        {"type": "script", "script": ".claude/hooks/Stop.sh"},
        {"type": "command", "command": "npx claude-flow@alpha hooks post-task"}
      ]
    }]
  }
}
```

In this example:
1. **First:** `Stop.sh` (dialogue-reporter) runs
2. **Then:** `claude-flow hooks post-task` runs

### Adding Other Hooks

The installation script **prepends** dialogue-reporter hooks, preserving existing ones:

```bash
# Before installation
"Stop": [{"hooks": [
  {"type": "command", "command": "some-other-tool"}
]}]

# After installation
"Stop": [{"hooks": [
  {"type": "script", "script": ".claude/hooks/Stop.sh"},
  {"type": "command", "command": "some-other-tool"}
]}]
```

### Manual Integration

To manually add dialogue-reporter alongside other hooks:

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [
        {"type": "script", "script": ".claude/hooks/SessionStart.sh"}
      ]
    }],
    "UserPromptSubmit": [{
      "hooks": [
        {"type": "script", "script": ".claude/hooks/UserPromptSubmit.sh"},
        {"type": "command", "command": "your-other-hook"}
      ]
    }],
    "Stop": [{
      "hooks": [
        {"type": "script", "script": ".claude/hooks/Stop.sh"},
        {"type": "command", "command": "your-other-hook"}
      ]
    }]
  }
}
```

## 📊 Architecture

### State Management

Dialogue-reporter uses **session-specific** temp directories:

```
/tmp/dialogue-reporter/{session-id}/
├── current-file.txt          # Path to conversation file
├── session-id.txt           # Claude session ID
├── transcript-path.txt       # JSONL transcript location
└── last-line-processed.txt   # Progress marker
```

### Persistence Strategy

Three layers of persistence:

1. **Temp files** (`/tmp/dialogue-reporter/{session-id}/`)
   - Fast, session-specific
   - Cleared on reboot
   - Supports concurrent sessions

2. **Metadata comments** (in conversation files)
   ```markdown
   <!-- LAST_LINE: 936 -->
   ```
   - Survives /tmp cleanup
   - Enables recovery
   - Per-conversation tracking

3. **Recovery logic** (automatic)
   - Detects missing temp files
   - Scans conversation files for session ID
   - Rebuilds state from metadata
   - Resumes from correct position

### Concurrent Session Support

Each Claude Code session:
- Gets a unique session ID (from transcript path)
- Uses its own temp directory
- Creates its own conversation file
- Tracks progress independently
- **No conflicts** between simultaneous sessions

## 🧪 Testing

### Test Hook Registration

```bash
# Check settings.json
cat .claude/settings.json | jq '.hooks'

# Should show dialogue-reporter hooks registered
```

### Test Hook Execution

```bash
# Start Claude Code session
# Submit a message
# Check conversation file
ls -lt docs/claude-conversations/
cat docs/claude-conversations/claude-convo-*.md | tail -20
```

### Test Recovery

```bash
# Clear temp files
rm -rf /tmp/dialogue-reporter/*

# Submit another message in Claude
# Hook should auto-recover and continue

# Verify recovery worked
tail -f /tmp/dialogue-reporter-debug.log
# Should show "Recovered LAST_LINE from metadata"
```

### Test Concurrent Sessions

```bash
# Terminal 1
cd my-project && claude

# Terminal 2 (same project)
cd my-project && claude

# Submit messages in both sessions
# Check that each creates its own conversation file
ls -lt docs/claude-conversations/
```

## 📚 Hook API Reference

### SessionStart Hook

**Input (stdin JSON):**
```json
{
  "session_id": "3df5ae42-ae15-48a3-a0d3-86924a76733d",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/workspaces/my-project"
}
```

**Outputs:**
- Creates conversation file
- Initializes temp directory
- Logs to stderr

### UserPromptSubmit Hook

**Input (stdin JSON):**
```json
{
  "prompt": "User's message text",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/workspaces/my-project"
}
```

**Outputs:**
- Appends Human section to conversation
- Updates conversation file
- Logs to `/tmp/dialogue-reporter-userprompt-debug.log`

### Stop Hook

**Input (stdin JSON):**
```json
{
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/workspaces/my-project"
}
```

**Outputs:**
- Reads JSONL transcript
- Extracts assistant messages and tools
- Formats markdown
- Appends to conversation file
- Updates LAST_LINE metadata
- Logs to `/tmp/dialogue-reporter-debug.log`

## 📖 Example Workflow

```bash
# 1. Install hooks
bash .claude/hooks/install-dialogue-reporter.sh

# 2. Verify installation
bash .claude/hooks/verify-dialogue-reporter.sh

# 3. Start Claude Code
claude

# 4. Have a conversation
# > "Hello Claude, can you help me?"
# > [Claude responds with code and tools]

# 5. Check captured conversation
cat docs/claude-conversations/claude-convo-$(date +%Y-%m-%d)-1.md

# 6. If /tmp gets cleared during session
bash .claude/hooks/recover-dialogue-reporter.sh

# 7. Continue conversation
# > [Conversation resumes from correct position]
```

## 🔐 Security & Privacy

- **Local only**: All data stays on your machine
- **No network calls**: Hooks don't send data anywhere
- **Readable format**: Conversations saved as plain markdown
- **Full control**: You own and control all conversation files
- **Temp isolation**: Session-specific temp directories prevent data leaks

## 📝 Maintenance Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `install-dialogue-reporter.sh` | Install and register hooks | Initial setup, after updates |
| `verify-dialogue-reporter.sh` | Check installation health | Troubleshooting, after changes |
| `recover-dialogue-reporter.sh` | Restore state from metadata | After /tmp cleanup, manual recovery |

## 🚨 Common Issues

### Issue: Hooks exist but don't run

**Cause:** Not registered in `.claude/settings.json`

**Solution:**
```bash
bash .claude/hooks/install-dialogue-reporter.sh
```

### Issue: `jq: command not found`

**Cause:** Missing dependency

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Fedora
sudo dnf install jq
```

### Issue: Conversation file not found

**Cause:** SessionStart hook didn't run or failed

**Solution:**
```bash
# Check if hooks are registered
bash .claude/hooks/verify-dialogue-reporter.sh

# Check output directory exists
ls -la docs/claude-conversations/

# Check SessionStart hook logs
# (SessionStart doesn't log to file, but check settings.json)
```

## 💡 Tips & Best Practices

1. **Always verify after installation**
   ```bash
   bash .claude/hooks/verify-dialogue-reporter.sh
   ```

2. **Restart Claude after hook changes**
   - Hooks only activate in new sessions
   - Exit and restart Claude Code

3. **Check logs when troubleshooting**
   ```bash
   tail -f /tmp/dialogue-reporter-debug.log
   ```

4. **Customize tool display for cleaner output**
   ```bash
   # Edit .dialogue-reporter.config
   TOOL_DISPLAY="simple"  # or "hidden"
   ```

5. **Backup conversation files regularly**
   ```bash
   cp -r docs/claude-conversations/ backups/$(date +%Y-%m-%d)/
   ```

## 📞 Support

- **GitHub Issues**: [dialogue-reporter/issues](https://github.com/mamd69/dialogue-reporter/issues)
- **Documentation**: Main README.md
- **Debug Logs**: `/tmp/dialogue-reporter-debug.log`, `/tmp/dialogue-reporter-userprompt-debug.log`

---

**Made with ❤️ for the Claude Code community**

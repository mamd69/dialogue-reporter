# 📝 Dialogue Reporter

> Automatically capture and save your Claude Code conversations as beautiful markdown files

[![npm version](https://img.shields.io/npm/v/dialogue-reporter.svg)](https://www.npmjs.com/package/dialogue-reporter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **🤖 Automatic Capture** - Works seamlessly with Claude Code hooks
- **📁 Organized Storage** - Saves conversations with timestamps
- **⚙️ Configurable** - Control tool display, timezone, and output location
- **🔄 Persistent** - Survives restarts and /tmp cleanups
- **🚀 Zero Config** - Works out of the box with sensible defaults
- **🐛 Debug-Friendly** - Built-in logging for troubleshooting

## 📦 Installation

### Quick Install

```bash
# Install the package globally or in your project
npm install -g dialogue-reporter

# Or use with npx (no installation needed)
npx dialogue-reporter install
```

### Step-by-Step

1. **Install the package** (if not using npx):
   ```bash
   npm install -g dialogue-reporter
   ```

2. **Navigate to your Claude Code project**:
   ```bash
   cd your-project-directory
   ```

3. **Run the installer**:
   ```bash
   dialogue-reporter install
   ```

   Or with npx:
   ```bash
   npx dialogue-reporter install
   ```

4. **Start using Claude Code** - Your conversations will automatically be saved to `docs/claude-conversations/`

## 🎯 How It Works

Dialogue Reporter uses **Claude Code hooks** to capture conversations:

1. **UserPromptSubmit Hook** - Captures your messages when you submit them
2. **Stop Hook** - Captures Claude's responses when they complete
3. **Metadata Persistence** - Stores position markers in conversation files to survive restarts

The hooks are bash scripts that:
- Parse the JSONL transcript file
- Extract Human and Assistant turns
- Format them as markdown
- Save incrementally to prevent data loss

## ⚙️ Configuration

### Default Configuration

After installation, you'll have a `.dialogue-reporter.config` file:

```bash
# Timezone for timestamps (uses TZ environment variable format)
TIMEZONE="America/New_York"

# Output directory for conversation files
OUTPUT_DIR="docs/claude-conversations"

# Filename pattern for conversation files
FILENAME_PATTERN="claude-convo-{date}-{number}.md"

# Tool display mode: "detailed", "simple", or "hidden"
TOOL_DISPLAY="detailed"
```

### Tool Display Modes

Control how tool usage is shown in conversations:

**Detailed Mode** (`TOOL_DISPLAY="detailed"`):
```markdown
---
**Tools Used:**

• **Bash** `npm test`
  _Run test suite_
• **Read** `src/index.ts`
• **Write** `dist/output.js`

---
```

**Simple Mode** (`TOOL_DISPLAY="simple"`):
```markdown
---
**Tools Used:**
---
```

**Hidden Mode** (`TOOL_DISPLAY="hidden"`):
```markdown
(no tools section shown)
```

### Customization

Edit `.dialogue-reporter.config` to customize:

```bash
# Change timezone
TIMEZONE="Europe/London"

# Change output directory
OUTPUT_DIR="conversations"

# Hide tool information
TOOL_DISPLAY="hidden"

# Custom filename pattern
FILENAME_PATTERN="chat-{date}-{number}.md"
```

## 📋 CLI Commands

### Install

Install hooks in the current project:

```bash
dialogue-reporter install

# Force reinstall (overwrites existing hooks)
dialogue-reporter install --force
```

### Status

Check installation status:

```bash
dialogue-reporter status
```

Output:
```
📊 Dialogue Reporter Status

✅ Stop.sh
✅ UserPromptSubmit.sh
✅ .dialogue-reporter.config
✅ Output directory: docs/claude-conversations

📝 5 conversation file(s) captured

✅ Dialogue Reporter is installed and ready
```

### Config

View current configuration:

```bash
dialogue-reporter config
```

### Logs

Debug hook execution:

```bash
# Show all logs
dialogue-reporter logs

# Show only Stop hook logs
dialogue-reporter logs --stop

# Show only UserPromptSubmit hook logs
dialogue-reporter logs --user
```

### Uninstall

Remove Dialogue Reporter from the project:

```bash
dialogue-reporter uninstall

# Keep conversation files when uninstalling
dialogue-reporter uninstall --keep-conversations
```

## 📖 Usage Examples

### Basic Usage

1. Install in your project:
   ```bash
   cd my-claude-project
   npx dialogue-reporter install
   ```

2. Start Claude Code and have a conversation

3. Check the output:
   ```bash
   ls docs/claude-conversations/
   # claude-convo-2025-11-12-1.md
   # claude-convo-2025-11-12-2.md
   ```

### Viewing Conversations

Conversations are saved as markdown files:

```markdown
# Conversation - November 12, 2025

## Human

Can you help me fix this bug?

## Assistant

I'll help you fix that bug. Let me start by reading the error logs.

---
**Tools Used:**

• **Read** `logs/error.log`
• **Bash** `npm test`

---

I found the issue in src/index.ts:42...
```

### Customizing Tool Display

Want cleaner output? Hide tools:

```bash
# Edit .dialogue-reporter.config
echo 'TOOL_DISPLAY="hidden"' >> .dialogue-reporter.config
```

Now conversations show only the dialogue:

```markdown
## Human

Can you help me fix this bug?

## Assistant

I'll help you fix that bug. Let me start by reading the error logs.

I found the issue in src/index.ts:42...
```

## 🔧 Troubleshooting

### Conversations Not Being Captured

1. **Check installation status**:
   ```bash
   dialogue-reporter status
   ```

2. **Check logs for errors**:
   ```bash
   dialogue-reporter logs
   ```

3. **Verify hooks are executable**:
   ```bash
   ls -la .claude/hooks/
   # Should show: -rwxr-xr-x for Stop.sh and UserPromptSubmit.sh
   ```

4. **Reinstall if needed**:
   ```bash
   dialogue-reporter install --force
   ```

### Duplicate Content in Conversations

This was a bug in earlier versions. Update to v1.0.5+:

```bash
npm install -g dialogue-reporter@latest
dialogue-reporter install --force
```

### Missing Messages

If some messages aren't being captured:

1. **Check debug logs**:
   ```bash
   dialogue-reporter logs
   ```

2. **Look for errors** in `/tmp/dialogue-reporter-debug.log`

3. **Verify LAST_LINE metadata** at the end of conversation files:
   ```bash
   tail -5 docs/claude-conversations/claude-convo-*.md
   # Should show: <!-- LAST_LINE: 123 -->
   ```

### Permission Errors

Make hooks executable:

```bash
chmod +x .claude/hooks/Stop.sh
chmod +x .claude/hooks/UserPromptSubmit.sh
```

## 🏗️ Architecture

### Hook Flow

```
Claude Code Conversation
        ↓
┌───────────────────┐
│ User types prompt │
└────────┬──────────┘
         ↓
┌──────────────────────────┐
│ UserPromptSubmit.sh Hook │  ← Captures Human message
└────────┬─────────────────┘
         ↓
┌────────────────────┐
│ Claude responds    │
└────────┬───────────┘
         ↓
┌──────────────────────────┐
│ Stop.sh Hook             │  ← Captures Assistant response
│ - Reads JSONL transcript │     and tool usage
│ - Tracks LAST_LINE       │
│ - Formats markdown       │
│ - Appends to file        │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│ Markdown file updated    │
│ with conversation turn   │
└──────────────────────────┘
```

### Persistence Strategy

Dialogue Reporter uses multiple persistence layers:

1. **Temp files**: `/tmp/dialogue-reporter/`
   - `current-file.txt` - Active conversation file path
   - `last-line-processed.txt` - Last processed line number

2. **Metadata comments**: In conversation files
   ```markdown
   <!-- LAST_LINE: 936 -->
   ```

3. **Recovery logic**: When temp files are cleared
   - Finds most recent conversation file
   - Reads LAST_LINE from metadata
   - Resumes from correct position

This triple-redundancy ensures conversations are never duplicated or lost.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup

```bash
# Clone the repo
git clone https://github.com/mamd69/dialogue-reporter.git
cd dialogue-reporter

# Install dependencies
npm install

# Build
npm run build

# Test locally
npm link
dialogue-reporter install
```

## 📄 License

MIT © Dialogue Reporter Team

## 🙏 Acknowledgments

- Built for [Claude Code](https://claude.ai/code)
- Inspired by the need for conversation history
- Uses Claude Code's powerful hook system

## 📚 Related Projects

- [Claude Code](https://claude.ai/code) - AI-powered coding assistant
- [Claude Flow](https://github.com/ruvnet/claude-flow) - Multi-agent orchestration for Claude Code

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/mamd69/dialogue-reporter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mamd69/dialogue-reporter/discussions)
- **Documentation**: [Full Docs](https://github.com/mamd69/dialogue-reporter/wiki)

---

Made with ❤️ for the Claude Code community

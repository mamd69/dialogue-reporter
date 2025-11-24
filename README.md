# 📝 Dialogue Reporter

> Automatically capture and save your Claude Code conversations as beautiful markdown files

[![npm version](https://img.shields.io/npm/v/dialogue-reporter.svg)](https://www.npmjs.com/package/dialogue-reporter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# Navigate to your Claude Code project
cd your-project

# Install (takes 5 seconds)
npx dialogue-reporter install

# That's it! Start a Claude Code conversation
# Your conversations are automatically saved to docs/claude-conversations/
```

**Updating or reinstalling?** Use `npx dialogue-reporter install --force`

## ✨ Features

- **🤖 Automatic Capture** - Works seamlessly with Claude Code hooks
- **📁 Organized Storage** - Saves conversations with timestamps
- **⚙️ Configurable** - Control tool display, timezone, and output location
- **🔄 Persistent** - Survives restarts and /tmp cleanups
- **🚀 Zero Config** - Works out of the box with sensible defaults
- **🐛 Debug-Friendly** - Built-in logging for troubleshooting
- **🔀 Concurrent Sessions** - Supports multiple Claude Code sessions simultaneously

## 📦 Installation

### Quick Install (Recommended)

```bash
# Navigate to your Claude Code project
cd your-project-directory

# Install hooks (no package installation needed)
npx dialogue-reporter install
```

That's it! Your conversations will automatically be saved to `docs/claude-conversations/`

### Reinstall / Update Hooks

If you've already installed dialogue-reporter and need to update or reinstall:

```bash
# Update hooks without uninstalling first
npx dialogue-reporter install --force
```

The `--force` flag:
- ✅ Overwrites existing hook files with latest versions
- ✅ Updates `.claude/settings.json` to register hooks
- ✅ Refreshes configuration files
- ✅ No need to uninstall first

### Global Installation (Optional)

If you prefer not to use `npx`:

```bash
# Install globally
npm install -g dialogue-reporter

# Then run from anywhere
cd your-project-directory
dialogue-reporter install
```

## 🎯 How It Works

Dialogue Reporter uses **Claude Code hooks** to capture conversations:

1. **SessionStart Hook** - Creates a new conversation file when a session starts
2. **UserPromptSubmit Hook** - Captures your messages when you submit them
3. **Stop Hook** - Captures Claude's responses when they complete
4. **Metadata Persistence** - Stores position markers in conversation files to survive restarts

The hooks are bash scripts that:
- Parse the JSONL transcript file
- Extract Human and Assistant turns
- Format them as markdown
- Save incrementally to prevent data loss
- **Isolate sessions** - Each session has its own temp directory to support concurrent usage

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
# First time installation
dialogue-reporter install

# Reinstall/update (recommended for updates)
dialogue-reporter install --force
```

**What happens during installation:**
- ✅ Creates `.claude/hooks/` directory
- ✅ Installs SessionStart.sh, Stop.sh, and UserPromptSubmit.sh hooks
- ✅ Creates `.dialogue-reporter.config` file
- ✅ **Automatically registers hooks in `.claude/settings.json`**
- ✅ Creates output directory (`docs/claude-conversations/`)

**The `--force` flag:**
- Overwrites existing hooks with latest versions
- Updates `.claude/settings.json` to ensure hooks are registered
- Refreshes configuration files
- **Use this when updating or if hooks aren't working**

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

### Concurrent Sessions

Run multiple Claude Code sessions simultaneously without conflicts:

```bash
# Terminal 1
cd my-project
claude  # Start first session

# Terminal 2 (same project)
cd my-project
claude  # Start second session - works independently!
```

Each session:
- Creates its own conversation file (e.g., `claude-convo-2025-11-24-1.md`, `claude-convo-2025-11-24-2.md`)
- Uses session-specific temp storage (`/tmp/dialogue-reporter/{session-id}/`)
- Tracks its own progress independently
- No cross-session interference or race conditions

## 🔧 Troubleshooting

### Conversations Not Being Captured

If your conversations aren't being saved, follow these steps:

1. **Check installation status**:
   ```bash
   dialogue-reporter status
   ```

   You should see all green checkmarks (✅). If not, proceed to step 4.

2. **Verify hooks are registered in settings.json**:
   ```bash
   cat .claude/settings.json | grep -A 5 "hooks"
   ```

   You should see entries for `SessionStart`, `UserPromptSubmit`, and `Stop` hooks.

   If hooks are missing from settings.json, reinstall with `--force` (step 4).

3. **Check logs for errors**:
   ```bash
   dialogue-reporter logs
   ```

4. **Reinstall with --force** (fixes most issues):
   ```bash
   npx dialogue-reporter install --force
   ```

   This will:
   - Overwrite hook files
   - **Re-register hooks in `.claude/settings.json`**
   - Refresh configuration

5. **Restart Claude Code**:

   Hooks only activate in new sessions. Exit and restart Claude Code after reinstalling.

### Hooks Not Working After Install

**Common Issue (v1.1.1 and earlier):** Hooks were copied but not registered in `.claude/settings.json`.

**Solution:** Update to v1.1.2+ which automatically registers hooks:

```bash
npx dialogue-reporter@latest install --force
```

**Verify it worked:**
```bash
dialogue-reporter status
# Should show all ✅ green checkmarks

# Or use the built-in verification script:
bash .claude/hooks/verify-dialogue-reporter.sh
```

**Advanced Troubleshooting:**

If hooks still aren't working, use the installation script directly:

```bash
# Manually install and register hooks
bash .claude/hooks/install-dialogue-reporter.sh

# Verify registration
bash .claude/hooks/verify-dialogue-reporter.sh

# If needed, recover session state
bash .claude/hooks/recover-dialogue-reporter.sh
```

See [Hook System Documentation](.claude/hooks/DIALOGUE-REPORTER-README.md) for detailed troubleshooting.

### Duplicate Content in Conversations

This was a bug in earlier versions. Update to v1.0.5+:

```bash
npx dialogue-reporter@latest install --force
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
chmod +x .claude/hooks/SessionStart.sh
chmod +x .claude/hooks/Stop.sh
chmod +x .claude/hooks/UserPromptSubmit.sh
```

### Manual Installation & Verification

If the npm-based installation isn't working, you can use the hook management scripts directly:

```bash
# Install and register hooks in settings.json
bash .claude/hooks/install-dialogue-reporter.sh

# Verify installation and configuration
bash .claude/hooks/verify-dialogue-reporter.sh

# Recover session state after /tmp cleanup
bash .claude/hooks/recover-dialogue-reporter.sh
```

**Requirements:**
- `jq` must be installed (for JSON manipulation)
- `.claude/hooks/` directory must exist
- Write permissions in project directory

For detailed documentation, see [Hook System Documentation](.claude/hooks/DIALOGUE-REPORTER-README.md).

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

1. **Session-specific temp files**: `/tmp/dialogue-reporter/{session-id}/`
   - `current-file.txt` - Active conversation file path
   - `last-line-processed.txt` - Last processed line number
   - `session-id.txt` - Session identifier
   - `transcript-path.txt` - JSONL transcript location

2. **Metadata comments**: In conversation files
   ```markdown
   <!-- LAST_LINE: 936 -->
   ```

3. **Recovery logic**: When temp files are cleared
   - Extracts session ID from transcript path
   - Finds most recent conversation file
   - Reads LAST_LINE from metadata
   - Resumes from correct position

This triple-redundancy with session isolation ensures conversations are never duplicated or lost, even with concurrent sessions.

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

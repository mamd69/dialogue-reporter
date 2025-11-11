# Claude Code Conversation Logs

This directory contains automatically generated logs of all Claude Code conversations, created by the Dialogue Reporter service.

## 📋 About

Dialogue Reporter automatically captures every conversation you have with Claude Code and saves it as a beautifully formatted markdown file. This helps you:

- **Document your development process** for future reference
- **Share conversations** with team members or for learning
- **Track your AI-assisted coding sessions** over time
- **Review complex problem-solving discussions** later
- **Create training materials** from real examples

## 📁 File Naming Convention

Conversations are saved with the following pattern:

```
claude-convo-YYYY-MM-DD-#.md
```

### Format Breakdown:
- `claude-convo-` - Prefix for all conversation files
- `YYYY-MM-DD` - Date of the conversation (e.g., `2025-11-07`)
- `-#` - Sequential number if multiple conversations occur on the same day

### Examples:
```
claude-convo-2025-11-07-1.md  ← First conversation on November 7, 2025
claude-convo-2025-11-07-2.md  ← Second conversation the same day
claude-convo-2025-11-08-1.md  ← First conversation on November 8, 2025
```

## 📄 File Format

Each conversation log is a markdown file with the following structure:

```markdown
# Claude Code Conversation

**Date:** Monday, November 7, 2025
**Time:** 2:45:30 PM
**Model:** claude-sonnet-4-5-20250929
**Session:** abc123xyz

---

## Human

[Your question or request]

## Assistant

[Claude's response, including any code, tool uses, etc.]

## Human

[Follow-up question]

## Assistant

[Follow-up response]

...
```

## 🎯 Key Features

### Automatic Capture
- **Zero manual work** - Conversations are logged automatically
- **Real-time recording** - Captured as you interact with Claude
- **Complete history** - Every message, tool call, and response

### Clean Formatting
- **Syntax highlighting** - Code blocks properly formatted
- **Tool call visibility** - See what tools Claude used
- **Metadata included** - Date, time, model, session info
- **Markdown format** - Easily readable and shareable

### Performance
- **< 5ms overhead** - Imperceptible impact on conversation speed
- **Non-blocking** - Doesn't slow down Claude's responses
- **Reliable** - Atomic file writes prevent data loss

## ⚙️ Configuration

Dialogue Reporter is configured via `.dialogue-reporter.json` in your project root.

### Current Configuration:
```json
{
  "outputDirectory": "docs/claude-conversations",
  "filenamePattern": "claude-convo-{date}-{number}.md",
  "formatting": {
    "syntaxHighlighting": true,
    "includeMetadata": true,
    "includeTimestamps": true,
    "includeToolCalls": true
  }
}
```

### Customization Options:

**Change output location:**
```json
{
  "outputDirectory": "path/to/your/logs"
}
```

**Modify filename pattern:**
```json
{
  "filenamePattern": "session-{date}-{number}.md"
}
```

**Disable timestamps:**
```json
{
  "formatting": {
    "includeTimestamps": false
  }
}
```

**Minimal logging (faster):**
```json
{
  "formatting": {
    "syntaxHighlighting": false,
    "includeMetadata": false,
    "includeToolCalls": false
  }
}
```

## 📊 Usage Examples

### Finding Conversations

**By date:**
```bash
ls claude-convo-2025-11-07-*
```

**Search content:**
```bash
grep -r "specific topic" claude-convo-*.md
```

**Count conversations:**
```bash
ls claude-convo-*.md | wc -l
```

### Sharing Conversations

Simply copy the markdown file:
```bash
cp claude-convo-2025-11-07-1.md ~/Documents/
```

Or view in your markdown viewer/editor.

### Creating Documentation

Conversation logs make excellent documentation:
1. Have a conversation about implementing a feature
2. The conversation is automatically logged
3. Edit the log file to create official documentation
4. Share with your team

## 🔧 Managing Logs

### View Latest Conversation:
```bash
ls -t claude-convo-*.md | head -1 | xargs cat
```

### Archive Old Conversations:
```bash
mkdir -p archive/2025-11
mv claude-convo-2025-11-*.md archive/2025-11/
```

### Clear All Logs:
```bash
rm claude-convo-*.md
```

⚠️ **Warning:** Deleted conversations cannot be recovered!

## 🚀 CLI Commands

Dialogue Reporter provides CLI commands for management:

```bash
# Check status
dialogue-reporter status

# View configuration
dialogue-reporter config show

# Update configuration
dialogue-reporter configure

# Verify installation
dialogue-reporter verify

# View logs location
dialogue-reporter config show | grep outputDirectory
```

## 🔒 Privacy & Security

- **Local only** - All conversations stored locally on your machine
- **No external transmission** - Nothing sent to external servers
- **Your control** - Delete or archive conversations anytime
- **Gitignore friendly** - Automatically excluded from version control (if configured)

## 📝 Tips

### Best Practices

1. **Regular archiving** - Move old conversations to dated folders monthly
2. **Selective deletion** - Remove sensitive conversations if needed
3. **Backup important sessions** - Copy critical conversations elsewhere
4. **Use grep** - Search across all conversations for specific topics

### Performance

- Logs have minimal impact (< 5ms per interaction)
- Files are written asynchronously (non-blocking)
- Atomic writes prevent corruption
- Sequential numbering avoids conflicts

### Troubleshooting

**No logs being created?**
```bash
dialogue-reporter verify
```

**Check if service is running:**
```bash
dialogue-reporter status
```

**View recent errors:**
```bash
dialogue-reporter logs
```

## 📚 Additional Resources

- **Installation Guide:** See main README.md
- **Configuration Guide:** `/docs/configuration.md`
- **Troubleshooting:** `/docs/troubleshooting.md`
- **API Documentation:** `/docs/api/`

## 🆘 Support

If you encounter issues:

1. Check `/docs/troubleshooting.md`
2. Run `dialogue-reporter verify`
3. View logs with `dialogue-reporter logs`
4. Open issue at [GitHub Issues](https://github.com/your-org/dialogue-reporter/issues)

---

**Generated by Dialogue Reporter** - Automatic conversation logging for Claude Code
Version 1.0.0 | MIT License

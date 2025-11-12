# Dialogue Reporter Configuration Guide

## Overview

Dialogue Reporter can be configured using the `.dialogue-reporter.config` file in your **project root** (not in this directory).

> **Location:** Create `.dialogue-reporter.config` in the same directory as your `.claude` folder.

## Configuration File

Create a `.dialogue-reporter.config` file in your project root:

```bash
# Dialogue Reporter Configuration

# Timezone for conversation timestamps
# Default: America/New_York (Eastern US Time)
TIMEZONE="America/New_York"

# Output directory for conversation files
# Default: docs/claude-conversations
OUTPUT_DIR="docs/claude-conversations"

# File naming pattern
# Default: claude-convo-{date}-{number}.md
FILENAME_PATTERN="claude-convo-{date}-{number}.md"

# Tool display mode
# Options: "detailed", "simple", "hidden"
# Default: detailed
TOOL_DISPLAY="detailed"
```

## Timezone Configuration

### Default Timezone

By default, conversation timestamps are displayed in **Eastern US Time** (America/New_York).

### Changing the Timezone

Edit `.dialogue-reporter.config` and set the `TIMEZONE` variable to your preferred timezone:

```bash
TIMEZONE="America/Los_Angeles"  # Pacific Time
```

### Common Timezones

| Timezone | Value |
|----------|-------|
| Eastern Time | `America/New_York` |
| Central Time | `America/Chicago` |
| Mountain Time | `America/Denver` |
| Pacific Time | `America/Los_Angeles` |
| UTC | `UTC` |
| UK Time | `Europe/London` |
| Central European Time | `Europe/Paris` |
| Tokyo Time | `Asia/Tokyo` |

For a complete list of valid timezone values, see: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

### Verifying Timezone

After changing the timezone configuration:

1. Start a new Claude Code session
2. Check the timestamp in the newly created conversation file
3. The timestamp should now reflect your configured timezone

## Output Directory

Change where conversation files are saved:

```bash
OUTPUT_DIR="my-conversations"
```

**Note:** The directory will be created automatically if it doesn't exist.

## File Naming Pattern

Customize the conversation file naming pattern:

```bash
FILENAME_PATTERN="conversation-{date}-{number}.md"
```

**Available variables:**
- `{date}` - Current date in YYYY-MM-DD format
- `{number}` - Sequential number for files on the same day

## Tool Display Configuration

Control how tool uses are shown in conversation files.

### Options

**`TOOL_DISPLAY="detailed"`** (default)
- Shows full tool information with parameters
- Example:
  ```markdown
  ---
  **Tools Used:**

  • **Bash** `chmod +x script.sh`
    _Make script executable_

  • **Read** `config.json`

  • **TodoWrite** (5 tasks)
  ---
  ```

**`TOOL_DISPLAY="simple"`**
- Shows only that tools were used, without details
- Example:
  ```markdown
  ---
  **Tools Used:**
  ---
  ```

**`TOOL_DISPLAY="hidden"`**
- Doesn't show tool indicators at all
- Clean conversation flow with only text

### Configuration

In `.dialogue-reporter.config`:

```bash
# Show detailed tool information (default)
TOOL_DISPLAY="detailed"

# Or use simple mode
TOOL_DISPLAY="simple"

# Or hide tools completely
TOOL_DISPLAY="hidden"
```

### Use Cases

**Detailed mode** - Best for:
- Learning what Claude Code did
- Debugging and troubleshooting
- Documentation and training
- Understanding tool usage patterns

**Simple mode** - Best for:
- Clean conversation logs
- Focus on dialogue, not implementation
- Minimal distraction
- Quick readability

**Hidden mode** - Best for:
- Pure conversation capture
- No technical details wanted
- Sharing with non-technical users
- Minimalist preference

## Example Configurations

### West Coast Developer

```bash
TIMEZONE="America/Los_Angeles"
OUTPUT_DIR="docs/conversations"
FILENAME_PATTERN="session-{date}-{number}.md"
```

### European Developer

```bash
TIMEZONE="Europe/London"
OUTPUT_DIR="docs/claude-sessions"
FILENAME_PATTERN="dialogue-{date}-{number}.md"
```

### UTC for Global Teams

```bash
TIMEZONE="UTC"
OUTPUT_DIR="docs/conversations"
FILENAME_PATTERN="claude-convo-{date}-{number}.md"
```

## Configuration Priority

1. `.dialogue-reporter.config` file (if exists)
2. Default values:
   - TIMEZONE: `America/New_York`
   - OUTPUT_DIR: `docs/claude-conversations`
   - FILENAME_PATTERN: `claude-convo-{date}-{number}.md`

## Troubleshooting

### Timestamps Still Wrong

If timestamps aren't reflecting your timezone:

1. Verify the timezone value is correct (check Wikipedia link above)
2. Ensure `.dialogue-reporter.config` is in your project root
3. Restart Claude Code to reload the configuration
4. Check for syntax errors in the config file

### Configuration Not Loading

```bash
# Verify config file exists and is readable
ls -la .dialogue-reporter.config
cat .dialogue-reporter.config
```

### Invalid Timezone

If you get errors about invalid timezones:

1. Check the timezone value matches the tz database format
2. Use `timedatectl list-timezones` on Linux to see available timezones
3. Common mistake: Using "EST" instead of "America/New_York"

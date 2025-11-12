#!/usr/bin/env bash
# Stop Hook - Capture complete assistant turns with detailed tool information

# Debug log file
LOG_FILE="/tmp/dialogue-reporter-debug.log"
echo "=== Stop Hook Called at $(date) ===" >> "$LOG_FILE"

# Read hook input
INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')
CONV_FILE=$(cat /tmp/dialogue-reporter/current-file.txt 2>/dev/null)
LAST_LINE=$(cat /tmp/dialogue-reporter/last-line-processed.txt 2>/dev/null || echo "0")

echo "TRANSCRIPT_PATH=$TRANSCRIPT_PATH" >> "$LOG_FILE"
echo "CONV_FILE=$CONV_FILE" >> "$LOG_FILE"
echo "LAST_LINE=$LAST_LINE" >> "$LOG_FILE"

# Load configuration FIRST
CONFIG_FILE=".dialogue-reporter.config"
if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
fi
export TZ="${TIMEZONE:-America/New_York}"
TOOL_DISPLAY="${TOOL_DISPLAY:-detailed}"
echo "TOOL_DISPLAY=$TOOL_DISPLAY (from config)" >> "$LOG_FILE"

# If no conversation file, try to find the most recent one
if [ -z "$CONV_FILE" ]; then
  echo "⚠️  No tracked conversation file. Looking for most recent file..." >> "$LOG_FILE"
  DIR="docs/claude-conversations"
  DATE=$(date +%Y-%m-%d)

  # Find the most recent conversation file for today
  RECENT_FILE=$(ls -t "$DIR/claude-convo-$DATE-"*.md 2>/dev/null | head -1)

  if [ -n "$RECENT_FILE" ]; then
    CONV_FILE="$RECENT_FILE"
    echo "✓ Found recent file: $CONV_FILE" >> "$LOG_FILE"
    # Initialize temp tracking
    mkdir -p /tmp/dialogue-reporter
    echo "$CONV_FILE" > /tmp/dialogue-reporter/current-file.txt
    echo "$LAST_LINE" > /tmp/dialogue-reporter/last-line-processed.txt
  else
    echo "❌ No conversation file found. Skipping." >> "$LOG_FILE"
    exit 0
  fi
fi

if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  echo "⚠️  Transcript file not found: $TRANSCRIPT_PATH" >> "$LOG_FILE"
  exit 0
fi

# Count total lines in JSONL file
TOTAL_LINES=$(wc -l < "$TRANSCRIPT_PATH")
echo "Total lines in transcript: $TOTAL_LINES, Last processed: $LAST_LINE" >> "$LOG_FILE"

if [ "$TOTAL_LINES" -le "$LAST_LINE" ]; then
  echo "No new lines to process" >> "$LOG_FILE"
  exit 0
fi

# Temporary file to accumulate ALL content for this Stop hook run
BUFFER_FILE="/tmp/dialogue-reporter-buffer.txt"
rm -f "$BUFFER_FILE"

# Variables to track current message
CURRENT_MSG_ID=""
HAS_CONTENT=false
IN_TOOLS=false

# Function to format tool use
format_tool_use() {
  local line="$1"
  local tool_name=$(echo "$line" | jq -r '.message.content[0].name // empty')

  if [ -z "$tool_name" ]; then
    echo "  No tool name found" >> "$LOG_FILE"
    return
  fi

  echo "  Formatting tool: $tool_name (mode: $TOOL_DISPLAY)" >> "$LOG_FILE"

  # Start tool section if first tool
  if [ "$IN_TOOLS" = false ]; then
    IN_TOOLS=true
    echo "" >> "$BUFFER_FILE"
    echo "---" >> "$BUFFER_FILE"
    echo "**Tools Used:**" >> "$BUFFER_FILE"

    # If simple mode, close immediately and skip all details
    if [ "$TOOL_DISPLAY" = "simple" ]; then
      echo "---" >> "$BUFFER_FILE"
      echo "" >> "$BUFFER_FILE"
      IN_TOOLS=false
      echo "  Simple mode - closed tools section" >> "$LOG_FILE"
      return
    fi

    echo "" >> "$BUFFER_FILE"
  fi

  # Skip detailed formatting if not in detailed mode
  if [ "$TOOL_DISPLAY" != "detailed" ]; then
    return
  fi

  # Extract tool-specific information (detailed mode only)
  case "$tool_name" in
    "Bash")
      local command=$(echo "$line" | jq -r '.message.content[0].input.command // empty')
      local description=$(echo "$line" | jq -r '.message.content[0].input.description // empty')
      echo "• **Bash** \`$command\`" >> "$BUFFER_FILE"
      if [ -n "$description" ] && [ "$description" != "null" ]; then
        echo "  _${description}_" >> "$BUFFER_FILE"
      fi
      ;;
    "Read"|"Write"|"Edit")
      local file_path=$(echo "$line" | jq -r '.message.content[0].input.file_path // .message.content[0].input.path // empty')
      echo "• **$tool_name** \`$file_path\`" >> "$BUFFER_FILE"
      ;;
    "Glob"|"Grep")
      local pattern=$(echo "$line" | jq -r '.message.content[0].input.pattern // empty')
      echo "• **$tool_name** \`$pattern\`" >> "$BUFFER_FILE"
      ;;
    "TodoWrite")
      local todo_count=$(echo "$line" | jq -r '.message.content[0].input.todos | length')
      echo "• **TodoWrite** ($todo_count tasks)" >> "$BUFFER_FILE"
      ;;
    *)
      # Generic format for other tools
      echo "• **$tool_name**" >> "$BUFFER_FILE"
      # Try to show first parameter
      local first_param=$(echo "$line" | jq -r '.message.content[0].input | to_entries[0] | "\(.key): \(.value)"' 2>/dev/null | head -c 100)
      if [ -n "$first_param" ] && [ "$first_param" != "null" ]; then
        echo "  $first_param" >> "$BUFFER_FILE"
      fi
      ;;
  esac
  echo "" >> "$BUFFER_FILE"
}

# Function to close tools section
close_tools_section() {
  if [ "$IN_TOOLS" = true ]; then
    # Only add closing separator in detailed mode (simple mode already closed)
    if [ "$TOOL_DISPLAY" = "detailed" ]; then
      echo "---" >> "$BUFFER_FILE"
      echo "" >> "$BUFFER_FILE"
    fi
    IN_TOOLS=false
    echo "  Closed tools section" >> "$LOG_FILE"
  fi
}

# Process new lines from JSONL transcript using process substitution to avoid subshell
while IFS= read -r line; do
  # Extract message info
  HAS_MESSAGE=$(echo "$line" | jq -r 'has("message")' 2>/dev/null)

  if [ "$HAS_MESSAGE" != "true" ]; then
    continue
  fi

  ROLE=$(echo "$line" | jq -r '.message.role // empty')
  MSG_ID=$(echo "$line" | jq -r '.message.id // empty')

  # Only process assistant messages
  if [ "$ROLE" != "assistant" ]; then
    continue
  fi

  echo "Processing message.id=$MSG_ID (current=$CURRENT_MSG_ID)" >> "$LOG_FILE"

  # Track message ID changes (for logging, but DON'T flush on change)
  if [ -n "$CURRENT_MSG_ID" ] && [ "$MSG_ID" != "$CURRENT_MSG_ID" ]; then
    # Close tools section when message changes, but don't flush
    close_tools_section
    echo "→ Message ID changed from $CURRENT_MSG_ID to $MSG_ID (continuing to buffer)" >> "$LOG_FILE"
    CURRENT_MSG_ID="$MSG_ID"
  elif [ -z "$CURRENT_MSG_ID" ]; then
    # First message
    CURRENT_MSG_ID="$MSG_ID"
    echo "→ First message: $MSG_ID" >> "$LOG_FILE"
  fi

  # Process content blocks
  CONTENT_TYPE=$(echo "$line" | jq -r '.message.content[0].type // empty')
  echo "  Content type: $CONTENT_TYPE" >> "$LOG_FILE"

  case "$CONTENT_TYPE" in
    "text")
      # Close tools section if open
      close_tools_section

      # Extract and append text
      TEXT=$(echo "$line" | jq -r '.message.content[0].text // empty')
      if [ -n "$TEXT" ] && [ "$TEXT" != "null" ]; then
        echo "$TEXT" >> "$BUFFER_FILE"
        echo "" >> "$BUFFER_FILE"
        HAS_CONTENT=true
        echo "  Added text (${#TEXT} chars)" >> "$LOG_FILE"
      fi
      ;;

    "tool_use")
      # Format and buffer tool use
      format_tool_use "$line"
      HAS_CONTENT=true
      ;;

    "thinking")
      # Optionally capture thinking (currently skipping)
      echo "  Skipping thinking content" >> "$LOG_FILE"
      ;;
  esac
done < <(tail -n +$((LAST_LINE + 1)) "$TRANSCRIPT_PATH")

# Close any open tools section
close_tools_section

# Write ALL buffered content with ONE "## Assistant" header
if [ "$HAS_CONTENT" = true ] && [ -f "$BUFFER_FILE" ] && [ -s "$BUFFER_FILE" ]; then
  # Write header ONCE
  echo "" >> "$CONV_FILE"
  echo "## Assistant" >> "$CONV_FILE"
  echo "" >> "$CONV_FILE"

  # Append ALL buffered content
  cat "$BUFFER_FILE" >> "$CONV_FILE"

  echo "✓ Wrote complete assistant turn ($(wc -l < "$BUFFER_FILE") lines) to $CONV_FILE" >> "$LOG_FILE"

  # Clear buffer
  rm -f "$BUFFER_FILE"
else
  echo "  No content to write (HAS_CONTENT=$HAS_CONTENT, buffer exists=$([ -f "$BUFFER_FILE" ] && echo yes || echo no))" >> "$LOG_FILE"
fi

# Update last processed line
echo "$TOTAL_LINES" > /tmp/dialogue-reporter/last-line-processed.txt

echo "Successfully processed transcript" >> "$LOG_FILE"
echo "Updated last line to: $TOTAL_LINES" >> "$LOG_FILE"
echo "===" >> "$LOG_FILE"

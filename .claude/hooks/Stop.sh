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
LAST_MSG_ID=$(cat /tmp/dialogue-reporter/last-message-id.txt 2>/dev/null || echo "")

echo "TRANSCRIPT_PATH=$TRANSCRIPT_PATH" >> "$LOG_FILE"
echo "CONV_FILE=$CONV_FILE" >> "$LOG_FILE"
echo "LAST_LINE=$LAST_LINE" >> "$LOG_FILE"
echo "LAST_MSG_ID=$LAST_MSG_ID" >> "$LOG_FILE"

# If no conversation file, try to find the most recent one
if [ -z "$CONV_FILE" ]; then
  echo "⚠️  No tracked conversation file. Looking for most recent file..." >> "$LOG_FILE"
  DIR="docs/claude-conversations"

  # Load timezone config
  CONFIG_FILE=".dialogue-reporter.config"
  if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
  fi
  export TZ="${TIMEZONE:-America/New_York}"
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
    echo "$LAST_MSG_ID" > /tmp/dialogue-reporter/last-message-id.txt
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

# Temporary file to buffer assistant turn content
BUFFER_FILE="/tmp/dialogue-reporter-buffer.txt"
rm -f "$BUFFER_FILE"

# Variables to track current message
CURRENT_MSG_ID=""
CURRENT_ROLE=""
HAS_CONTENT=false

# Function to format tool use
format_tool_use() {
  local line="$1"
  local tool_name=$(echo "$line" | jq -r '.message.content[0].name // empty')
  local tool_id=$(echo "$line" | jq -r '.message.content[0].id // empty')

  if [ -z "$tool_name" ]; then
    return
  fi

  # Start tool section if first tool
  if [ ! -f "/tmp/dialogue-reporter-in-tools" ]; then
    touch "/tmp/dialogue-reporter-in-tools"
    echo "" >> "$BUFFER_FILE"
    echo "---" >> "$BUFFER_FILE"
    echo "**Tools Used:**" >> "$BUFFER_FILE"
    echo "" >> "$BUFFER_FILE"
  fi

  # Extract tool-specific information
  case "$tool_name" in
    "Bash")
      local command=$(echo "$line" | jq -r '.message.content[0].input.command // empty')
      local description=$(echo "$line" | jq -r '.message.content[0].input.description // empty')
      echo "• **Bash** \`$command\`" >> "$BUFFER_FILE"
      if [ -n "$description" ]; then
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
      local first_param=$(echo "$line" | jq -r '.message.content[0].input | to_entries[0] | "\(.key): \(.value)"' 2>/dev/null)
      if [ -n "$first_param" ] && [ "$first_param" != "null" ]; then
        echo "  $first_param" >> "$BUFFER_FILE"
      fi
      ;;
  esac
  echo "" >> "$BUFFER_FILE"
}

# Function to close tools section
close_tools_section() {
  if [ -f "/tmp/dialogue-reporter-in-tools" ]; then
    echo "---" >> "$BUFFER_FILE"
    echo "" >> "$BUFFER_FILE"
    rm -f "/tmp/dialogue-reporter-in-tools"
  fi
}

# Function to flush buffer to conversation file
flush_buffer() {
  if [ "$HAS_CONTENT" = true ] && [ -f "$BUFFER_FILE" ]; then
    # Close any open tools section
    close_tools_section

    # Write header
    echo "" >> "$CONV_FILE"
    echo "## Assistant" >> "$CONV_FILE"
    echo "" >> "$CONV_FILE"

    # Append buffered content
    cat "$BUFFER_FILE" >> "$CONV_FILE"

    echo "Flushed assistant turn to $CONV_FILE" >> "$LOG_FILE"

    # Clear buffer
    rm -f "$BUFFER_FILE"
    HAS_CONTENT=false
  fi
}

# Process new lines from JSONL transcript
tail -n +$((LAST_LINE + 1)) "$TRANSCRIPT_PATH" | while IFS= read -r line; do
  # Extract message info
  HAS_MESSAGE=$(echo "$line" | jq -r 'has("message")' 2>/dev/null)

  if [ "$HAS_MESSAGE" != "true" ]; then
    continue
  fi

  ROLE=$(echo "$line" | jq -r '.message.role // empty')
  MSG_ID=$(echo "$line" | jq -r '.message.id // empty')
  STOP_REASON=$(echo "$line" | jq -r '.message.stop_reason // empty')

  # Only process assistant messages
  if [ "$ROLE" != "assistant" ]; then
    continue
  fi

  # Check if this is a new message (different message.id)
  if [ -n "$CURRENT_MSG_ID" ] && [ "$MSG_ID" != "$CURRENT_MSG_ID" ]; then
    # Flush previous message
    flush_buffer
  fi

  # Update current message tracking
  CURRENT_MSG_ID="$MSG_ID"
  CURRENT_ROLE="$ROLE"

  # Process content blocks
  CONTENT_TYPE=$(echo "$line" | jq -r '.message.content[0].type // empty')

  case "$CONTENT_TYPE" in
    "text")
      # Close tools section if open
      close_tools_section

      # Extract and append text
      TEXT=$(echo "$line" | jq -r '.message.content[0].text // empty')
      if [ -n "$TEXT" ]; then
        echo "$TEXT" >> "$BUFFER_FILE"
        echo "" >> "$BUFFER_FILE"
        HAS_CONTENT=true
      fi
      ;;

    "tool_use")
      # Format and buffer tool use
      format_tool_use "$line"
      HAS_CONTENT=true
      ;;

    "thinking")
      # Optionally capture thinking (currently skipping)
      # THINKING=$(echo "$line" | jq -r '.message.content[0].thinking // empty')
      ;;
  esac

  # Check if turn is complete
  if [ "$STOP_REASON" != "tool_use" ] && [ "$STOP_REASON" != "null" ]; then
    # Turn complete - flush buffer
    flush_buffer
    # Save this as the last completed message
    echo "$MSG_ID" > /tmp/dialogue-reporter/last-message-id.txt
  fi
done

# Final flush in case of incomplete turn
flush_buffer

# Update last processed line
echo "$TOTAL_LINES" > /tmp/dialogue-reporter/last-line-processed.txt

echo "Successfully processed transcript" >> "$LOG_FILE"
echo "Updated last line to: $TOTAL_LINES" >> "$LOG_FILE"
echo "===" >> "$LOG_FILE"

#!/usr/bin/env bash
# Stop Hook - Capture assistant responses after completion

# Debug log file
LOG_FILE="/tmp/dialogue-reporter-debug.log"
echo "=== Stop Hook Called at $(date) ===" >> "$LOG_FILE"

# Read hook input
INPUT=$(cat)
echo "INPUT received: $INPUT" >> "$LOG_FILE"

TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')
CONV_FILE=$(cat /tmp/dialogue-reporter/current-file.txt 2>/dev/null)
LAST_LINE=$(cat /tmp/dialogue-reporter/last-line-processed.txt 2>/dev/null || echo "0")

echo "TRANSCRIPT_PATH=$TRANSCRIPT_PATH" >> "$LOG_FILE"
echo "CONV_FILE=$CONV_FILE" >> "$LOG_FILE"
echo "LAST_LINE=$LAST_LINE" >> "$LOG_FILE"

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

# Process new lines from JSONL transcript
MESSAGES_ADDED=0
tail -n +$((LAST_LINE + 1)) "$TRANSCRIPT_PATH" | while IFS= read -r line; do
  # Check if this line has a message field
  HAS_MESSAGE=$(echo "$line" | jq -r 'has("message")' 2>/dev/null)

  if [ "$HAS_MESSAGE" = "true" ]; then
    ROLE=$(echo "$line" | jq -r '.message.role // empty')

    # Only capture assistant messages (user messages captured by UserPromptSubmit)
    if [ "$ROLE" = "assistant" ]; then
      # Extract text content from content array
      CONTENT=$(echo "$line" | jq -r '
        .message.content[] |
        select(.type == "text") |
        .text
      ' 2>/dev/null)

      if [ -n "$CONTENT" ]; then
        echo "" >> "$CONV_FILE"
        echo "## Assistant" >> "$CONV_FILE"
        echo "" >> "$CONV_FILE"
        echo "$CONTENT" >> "$CONV_FILE"
        echo "" >> "$CONV_FILE"

        MESSAGES_ADDED=$((MESSAGES_ADDED + 1))
        echo "Added assistant message to $CONV_FILE" >> "$LOG_FILE"
      fi
    fi
  fi
done

# Update last processed line
echo "$TOTAL_LINES" > /tmp/dialogue-reporter/last-line-processed.txt

echo "Successfully processed transcript. Messages added: $MESSAGES_ADDED" >> "$LOG_FILE"
echo "Updated last line to: $TOTAL_LINES" >> "$LOG_FILE"
echo "===" >> "$LOG_FILE"

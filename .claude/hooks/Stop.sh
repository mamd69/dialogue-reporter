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
LAST_INDEX=$(cat /tmp/dialogue-reporter/last-message-index.txt 2>/dev/null || echo "0")

# Debug logging
echo "DEBUG: Stop hook called" >&2
echo "DEBUG: TRANSCRIPT_PATH=$TRANSCRIPT_PATH" >&2
echo "DEBUG: CONV_FILE=$CONV_FILE" >&2
echo "DEBUG: LAST_INDEX=$LAST_INDEX" >&2

echo "TRANSCRIPT_PATH=$TRANSCRIPT_PATH" >> "$LOG_FILE"
echo "CONV_FILE=$CONV_FILE" >> "$LOG_FILE"
echo "LAST_INDEX=$LAST_INDEX" >> "$LOG_FILE"

# If no conversation file, try to find the most recent one
if [ -z "$CONV_FILE" ]; then
  echo "⚠️  No tracked conversation file. Looking for most recent file..." >&2
  DIR="docs/claude-conversations"
  DATE=$(date +%Y-%m-%d)

  # Find the most recent conversation file for today
  RECENT_FILE=$(ls -t "$DIR/claude-convo-$DATE-"*.md 2>/dev/null | head -1)

  if [ -n "$RECENT_FILE" ]; then
    CONV_FILE="$RECENT_FILE"
    echo "✓ Found recent file: $CONV_FILE" >&2
    # Initialize temp tracking
    mkdir -p /tmp/dialogue-reporter
    echo "$CONV_FILE" > /tmp/dialogue-reporter/current-file.txt
    echo "$LAST_INDEX" > /tmp/dialogue-reporter/last-message-index.txt
  else
    echo "❌ No conversation file found. Skipping." >&2
    exit 0
  fi
fi

if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  echo "⚠️  Transcript file not found: $TRANSCRIPT_PATH" >&2
  echo "DEBUG: Full hook input: $INPUT" >&2
  exit 0
fi

# Read the transcript and extract new messages since last capture
# The transcript is a JSON array of messages
TOTAL_MESSAGES=$(jq 'length' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

if [ "$TOTAL_MESSAGES" -le "$LAST_INDEX" ]; then
  # No new messages
  exit 0
fi

# The Stop hook fires after Claude finishes a response
# Process only NEW messages that were added since last hook call
for ((i=$LAST_INDEX; i<$TOTAL_MESSAGES; i++)); do
  ROLE=$(jq -r ".[$i].role // empty" "$TRANSCRIPT_PATH")
  CONTENT=$(jq -r ".[$i].content // empty" "$TRANSCRIPT_PATH")

  # Only capture assistant messages (user messages are captured by UserPromptSubmit)
  if [ "$ROLE" = "assistant" ] && [ -n "$CONTENT" ]; then
    cat >> "$CONV_FILE" <<EOF

## Assistant

$CONTENT

EOF
  fi
done

# Update last processed index to current total
echo "$TOTAL_MESSAGES" > /tmp/dialogue-reporter/last-message-index.txt

echo "Successfully captured assistant messages. Total messages now: $TOTAL_MESSAGES" >> "$LOG_FILE"
echo "Updated conversation file: $CONV_FILE" >> "$LOG_FILE"
echo "===" >> "$LOG_FILE"

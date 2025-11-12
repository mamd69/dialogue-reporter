#!/usr/bin/env bash
# Stop Hook - Capture assistant responses after completion

# Read hook input
INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')
CONV_FILE=$(cat /tmp/dialogue-reporter/current-file.txt 2>/dev/null)
LAST_INDEX=$(cat /tmp/dialogue-reporter/last-message-index.txt 2>/dev/null || echo "0")

if [ -z "$CONV_FILE" ]; then
  echo "⚠️  No conversation file found. SessionStart may not have run." >&2
  exit 0
fi

if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  echo "⚠️  Transcript file not found: $TRANSCRIPT_PATH" >&2
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

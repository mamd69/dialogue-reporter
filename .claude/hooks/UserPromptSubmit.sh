#!/usr/bin/env bash
# UserPromptSubmit Hook - Capture user messages

# Debug log
LOG_FILE="/tmp/dialogue-reporter-userprompt-debug.log"
echo "=== UserPromptSubmit Called at $(date) ===" >> "$LOG_FILE"

# Read hook input
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""')
CONV_FILE=$(cat /tmp/dialogue-reporter/current-file.txt 2>/dev/null)

echo "PROMPT length: ${#PROMPT}" >> "$LOG_FILE"
echo "CONV_FILE: $CONV_FILE" >> "$LOG_FILE"

if [ -z "$CONV_FILE" ]; then
  echo "⚠️  No conversation file found. SessionStart may not have run." >&2
  echo "❌ No CONV_FILE, exiting" >> "$LOG_FILE"
  exit 0
fi

if [ -n "$PROMPT" ]; then
  # Append user message
  cat >> "$CONV_FILE" <<EOF

## Human

$PROMPT

EOF
  echo "✓ Wrote Human message (${#PROMPT} chars) to $CONV_FILE" >> "$LOG_FILE"
else
  echo "⚠️  Empty PROMPT, skipping" >> "$LOG_FILE"
fi

echo "===" >> "$LOG_FILE"

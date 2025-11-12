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
echo "CONV_FILE (initial): $CONV_FILE" >> "$LOG_FILE"

# If no conversation file tracked, try to recover it
if [ -z "$CONV_FILE" ]; then
  echo "⚠️  No tracked file, attempting recovery..." >> "$LOG_FILE"

  # Get cwd from hook input or use current directory
  CWD=$(echo "$INPUT" | jq -r '.cwd // ""')
  if [ -z "$CWD" ]; then
    CWD=$(pwd)
  fi

  DIR="$CWD/docs/claude-conversations"

  echo "Looking in: $DIR" >> "$LOG_FILE"

  # Find the most recent conversation file (any date)
  RECENT_FILE=$(ls -t "$DIR"/claude-convo-*.md 2>/dev/null | head -1)

  if [ -n "$RECENT_FILE" ]; then
    CONV_FILE="$RECENT_FILE"
    # Restore tracking
    mkdir -p /tmp/dialogue-reporter
    echo "$CONV_FILE" > /tmp/dialogue-reporter/current-file.txt
    echo "✓ Recovered CONV_FILE: $CONV_FILE" >> "$LOG_FILE"
  else
    echo "❌ No conversation file found. SessionStart may not have run." >&2
    echo "❌ Recovery failed, no file found" >> "$LOG_FILE"
    exit 0
  fi
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
